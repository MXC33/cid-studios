import WebSocket from "ws";
import {
  ComfyApiPrompt,
  ComfySystemStats,
  ComfyPromptResponse,
  ComfyQueueResponse,
  ComfyHistoryResponse,
  ComfyProgressEvent,
} from "./types";

const DEFAULT_COMFY_URL = process.env.COMFYUI_URL || "http://127.0.0.1:8188";

function getBaseUrl(customUrl?: string): string {
  const url = customUrl || DEFAULT_COMFY_URL;
  return url.replace(/\/+$/, "");
}

/**
 * Queries ComfyUI /system_stats for live hardware, VRAM, and platform info.
 */
export async function checkStatus(customUrl?: string): Promise<{
  online: boolean;
  stats?: ComfySystemStats;
  error?: string;
}> {
  const baseUrl = getBaseUrl(customUrl);
  try {
    const res = await fetch(`${baseUrl}/system_stats`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) {
      return {
        online: false,
        error: `ComfyUI returned status HTTP ${res.status}: ${res.statusText}`,
      };
    }

    const stats = (await res.json()) as ComfySystemStats;
    return {
      online: true,
      stats,
    };
  } catch (err: any) {
    return {
      online: false,
      error: err.message || "Could not connect to ComfyUI instance",
    };
  }
}

/**
 * Submits an API prompt graph to ComfyUI /prompt.
 */
export async function submitPrompt(
  prompt: ComfyApiPrompt,
  clientId?: string,
  customUrl?: string
): Promise<ComfyPromptResponse> {
  const baseUrl = getBaseUrl(customUrl);
  const payload = {
    prompt,
    client_id: clientId || `cid_studios_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
  };

  const res = await fetch(`${baseUrl}/prompt`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(
      `ComfyUI prompt submission failed [${res.status}]: ${errorText || res.statusText}`
    );
  }

  return (await res.json()) as ComfyPromptResponse;
}

/**
 * Cancels or interrupts the active execution on ComfyUI.
 */
export async function cancelJob(
  promptId?: string,
  customUrl?: string
): Promise<{ success: boolean; message: string }> {
  const baseUrl = getBaseUrl(customUrl);
  try {
    const res = await fetch(`${baseUrl}/interrupt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(promptId ? { prompt_id: promptId } : {}),
    });

    if (!res.ok) {
      return {
        success: false,
        message: `Failed to interrupt job: HTTP ${res.status}`,
      };
    }

    return {
      success: true,
      message: "Interrupt signal dispatched to ComfyUI",
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Error interrupting job",
    };
  }
}

/**
 * Fetches current execution queue (running + pending) from ComfyUI /queue.
 */
export async function getQueue(customUrl?: string): Promise<ComfyQueueResponse> {
  const baseUrl = getBaseUrl(customUrl);
  const res = await fetch(`${baseUrl}/queue`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ComfyUI queue: HTTP ${res.status}`);
  }

  return (await res.json()) as ComfyQueueResponse;
}

/**
 * Retrieves execution history for all prompts or a specific prompt ID from ComfyUI /history.
 */
export async function getHistory(
  promptId?: string,
  customUrl?: string
): Promise<ComfyHistoryResponse> {
  const baseUrl = getBaseUrl(customUrl);
  const endpoint = promptId ? `${baseUrl}/history/${promptId}` : `${baseUrl}/history`;

  const res = await fetch(endpoint, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ComfyUI history: HTTP ${res.status}`);
  }

  return (await res.json()) as ComfyHistoryResponse;
}

/**
 * Connects to ComfyUI WebSocket endpoint to receive live streaming execution telemetry.
 */
export function createComfyWebSocket(
  clientId: string,
  onEvent: (event: ComfyProgressEvent) => void,
  customUrl?: string
): WebSocket {
  const baseUrl = getBaseUrl(customUrl);
  const wsUrl = baseUrl.replace(/^http/, "ws") + `/ws?clientId=${encodeURIComponent(clientId)}`;

  const ws = new WebSocket(wsUrl);

  ws.on("message", (data: WebSocket.Data) => {
    try {
      if (typeof data === "string") {
        const parsed = JSON.parse(data);
        onEvent(parsed);
      } else if (Buffer.isBuffer(data)) {
        // Binary preview data (e.g. latency preview image / jpeg)
        // Ignored or passed if needed
      }
    } catch (err) {
      console.error("[ComfyWS] Failed to parse message:", err);
    }
  });

  ws.on("error", (err) => {
    console.error(`[ComfyWS] WebSocket error for client ${clientId}:`, err);
  });

  return ws;
}
