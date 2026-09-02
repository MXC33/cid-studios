"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Activity,
  Flame,
  Square,
  ShieldCheck,
  ShieldAlert,
  Cpu,
  Clock,
  Radio,
  ChevronUp,
  ChevronDown,
  Terminal,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveStudioHUDProps {
  activeShotName?: string;
  isRendering?: boolean;
  onTriggerRender?: () => void;
  onInterrupt?: () => void;
  promptId?: string | null;
}

interface TelemetryState {
  wsConnected: boolean;
  online: boolean;
  activeNode: string | null;
  currentStep: number;
  totalSteps: number;
  progressPercent: number;
  statusText: string;
  elapsedSeconds: number;
  caffeinateActive: boolean;
  caffeinatePid: number | null;
  vramTotal: number;
  vramFree: number;
  eventsLog: Array<{ time: string; message: string; type: "info" | "step" | "error" | "done" }>;
}

export function LiveStudioHUD({
  activeShotName = "SHOT_01",
  isRendering = false,
  onTriggerRender,
  onInterrupt,
  promptId,
}: LiveStudioHUDProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [telemetry, setTelemetry] = useState<TelemetryState>({
    wsConnected: false,
    online: true,
    activeNode: null,
    currentStep: 0,
    totalSteps: 4,
    progressPercent: 0,
    statusText: "READY / STANDBY",
    elapsedSeconds: 0,
    caffeinateActive: true,
    caffeinatePid: null,
    vramTotal: 128,
    vramFree: 96.4,
    eventsLog: [
      { time: "00:00:00", message: "Studio HUD initialized. MiniMax H3 pipeline ready.", type: "info" },
    ],
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const addLog = (message: string, type: "info" | "step" | "error" | "done" = "info") => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    setTelemetry((prev) => ({
      ...prev,
      eventsLog: [{ time, message, type }, ...prev.eventsLog.slice(0, 19)],
    }));
  };

  // Setup WebSocket connection to ComfyUI
  useEffect(() => {
    let ws: WebSocket | null = null;
    const clientId = `cid_hud_${Date.now()}`;
    const wsUrl = `ws://127.0.0.1:8188/ws?clientId=${encodeURIComponent(clientId)}`;

    try {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setTelemetry((prev) => ({
          ...prev,
          wsConnected: true,
          online: true,
        }));
        addLog("WebSocket connected to ComfyUI :8188", "info");
      };

      ws.onmessage = (event) => {
        try {
          if (typeof event.data === "string") {
            const parsed = JSON.parse(event.data);
            const type = parsed.type;
            const data = parsed.data || {};

            if (type === "progress") {
              const val = data.value ?? 0;
              const max = data.max ?? 4;
              const pct = Math.round((val / max) * 100);
              setTelemetry((prev) => ({
                ...prev,
                currentStep: val,
                totalSteps: max,
                progressPercent: pct,
                statusText: `SAMPLING // STEP ${val}/${max} (${pct}%)`,
              }));
              addLog(`Sampling step ${val}/${max} [${pct}%]`, "step");
            } else if (type === "executing") {
              const node = data.node;
              if (node) {
                setTelemetry((prev) => ({
                  ...prev,
                  activeNode: `Node ${node}`,
                  statusText: `EXECUTING NODE [${node}]`,
                }));
                addLog(`Executing graph node: ${node}`, "info");
              } else {
                setTelemetry((prev) => ({
                  ...prev,
                  activeNode: null,
                  statusText: "TAKE GENERATION COMPLETE",
                  progressPercent: 100,
                }));
                addLog("Take generation finished successfully.", "done");
              }
            } else if (type === "execution_error") {
              setTelemetry((prev) => ({
                ...prev,
                statusText: "EXECUTION ERROR",
              }));
              addLog(`ComfyUI Error: ${data.exception_message || "Unknown"}`, "error");
            }
          }
        } catch {
          // Ignored
        }
      };

      ws.onerror = () => {
        setTelemetry((prev) => ({ ...prev, wsConnected: false }));
      };

      ws.onclose = () => {
        setTelemetry((prev) => ({ ...prev, wsConnected: false }));
      };
    } catch {
      setTelemetry((prev) => ({ ...prev, wsConnected: false }));
    }

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  // Status and Caffeinate Poller (Fallback / stats update)
  useEffect(() => {
    const pollStatus = async () => {
      try {
        const res = await fetch("/api/engine/status");
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            const caffeinate = data.caffeinate;
            const engine = data.engine;

            let freeVram = 96.4;
            let totalVram = 128;
            if (engine?.stats?.devices && engine.stats.devices.length > 0) {
              const d = engine.stats.devices[0];
              freeVram = Math.round((d.vram_free / (1024 * 1024 * 1024)) * 10) / 10;
              totalVram = Math.round((d.vram_total / (1024 * 1024 * 1024)) * 10) / 10;
            }

            setTelemetry((prev) => ({
              ...prev,
              online: engine?.online ?? true,
              caffeinateActive: caffeinate?.active ?? true,
              caffeinatePid: caffeinate?.pid ?? null,
              vramFree: freeVram,
              vramTotal: totalVram,
            }));
          }
        }
      } catch {
        // Fallback gracefully
      }
    };

    pollStatus();
    const interval = setInterval(pollStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  // Timer when rendering
  useEffect(() => {
    if (isRendering) {
      setTelemetry((prev) => ({
        ...prev,
        elapsedSeconds: 0,
        statusText: "DISPATCHING PROMPT TO MINIMAX H3...",
      }));
      addLog(`Initiated render for ${activeShotName}`, "info");

      timerRef.current = setInterval(() => {
        setTelemetry((prev) => ({
          ...prev,
          elapsedSeconds: prev.elapsedSeconds + 1,
        }));
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRendering, activeShotName]);

  const etaSeconds = Math.max(0, 32 - telemetry.elapsedSeconds);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#09090b] border-t border-[#27272a] font-mono shadow-[0_-10px_25px_rgba(0,0,0,0.7)] select-none">
      {/* Expanded Console Tray */}
      {isExpanded && (
        <div className="p-4 bg-[#0c0c0e] border-b border-[#27272a] max-h-48 overflow-y-auto space-y-2">
          <div className="flex items-center justify-between text-[10px] text-[#71717a] pb-1 border-b border-[#18181b]">
            <span className="font-bold uppercase tracking-wider text-[#fafafa] flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-[#3b82f6]" />
              <span>LIVE TELEMETRY & EXECUTION STREAM</span>
            </span>
            <span>SHOWING LAST 20 EVENTS</span>
          </div>

          <div className="space-y-1">
            {telemetry.eventsLog.map((log, idx) => (
              <div key={idx} className="flex items-start gap-2 text-[11px]">
                <span className="text-[#52525b] shrink-0 font-mono">[{log.time}]</span>
                <span
                  className={cn(
                    "font-mono",
                    log.type === "step"
                      ? "text-[#10b981]"
                      : log.type === "done"
                      ? "text-[#3b82f6] font-bold"
                      : log.type === "error"
                      ? "text-[#f43f5e]"
                      : "text-[#a1a1aa]"
                  )}
                >
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress Strip */}
      {isRendering && (
        <div className="w-full h-1 bg-[#18181b] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#3b82f6] via-[#10b981] to-[#f59e0b] transition-all duration-300"
            style={{ width: `${Math.max(5, telemetry.progressPercent)}%` }}
          />
        </div>
      )}

      {/* Main HUD Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between px-4 py-2.5 gap-3">
        {/* Left: Studio Status & Active Node */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-[#71717a] hover:text-[#fafafa] bg-[#121215] border border-[#27272a] transition-colors"
            title="Toggle Telemetry Console"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-2">
            <span
              className={cn(
                "w-2 h-2 rounded-full",
                telemetry.wsConnected || telemetry.online
                  ? isRendering
                    ? "bg-[#f59e0b] animate-ping"
                    : "bg-[#10b981]"
                  : "bg-[#f43f5e]"
              )}
            />
            <span className="text-xs font-bold text-[#fafafa] uppercase">
              {isRendering ? "LIVE RENDERING" : "LIVE STUDIO CONSOLE"}
            </span>
          </div>

          <span className="text-[#3f3f46] hidden sm:inline">|</span>

          {/* Active Status String */}
          <div className="hidden lg:flex items-center gap-2 text-xs">
            <span className="text-[#71717a]">STATUS:</span>
            <span
              className={cn(
                "font-bold",
                isRendering ? "text-[#f59e0b]" : "text-[#10b981]"
              )}
            >
              {isRendering ? telemetry.statusText : "READY // AWAITING ACTION"}
            </span>
          </div>

          {/* Active Node Badge */}
          {telemetry.activeNode && (
            <span className="px-1.5 py-0.5 bg-[#3b82f6]/20 border border-[#3b82f6]/40 text-[#3b82f6] text-[10px] font-bold">
              {telemetry.activeNode}
            </span>
          )}
        </div>

        {/* Center: Realtime Telemetry Stats */}
        <div className="flex items-center gap-3 text-[11px] text-[#a1a1aa]">
          {/* Step Progress */}
          {isRendering && (
            <div className="flex items-center gap-1.5 bg-[#18181b] px-2.5 py-1 border border-[#27272a]">
              <Layers className="w-3.5 h-3.5 text-[#f59e0b]" />
              <span className="text-[#fafafa] font-bold">
                STEP {telemetry.currentStep}/{telemetry.totalSteps}
              </span>
              <span className="text-[#10b981]">({telemetry.progressPercent}%)</span>
            </div>
          )}

          {/* Elapsed & ETA */}
          {isRendering && (
            <div className="flex items-center gap-1.5 bg-[#18181b] px-2.5 py-1 border border-[#27272a]">
              <Clock className="w-3.5 h-3.5 text-[#3b82f6]" />
              <span className="text-[#fafafa] font-bold">{telemetry.elapsedSeconds}s</span>
              <span className="text-[#71717a]">/ ETA ~{etaSeconds}s</span>
            </div>
          )}

          {/* Caffeinate Sleep Guard */}
          <div className="hidden sm:flex items-center gap-1.5 bg-[#121215] px-2 py-1 border border-[#27272a]">
            {telemetry.caffeinateActive ? (
              <ShieldCheck className="w-3.5 h-3.5 text-[#10b981]" />
            ) : (
              <ShieldAlert className="w-3.5 h-3.5 text-[#71717a]" />
            )}
            <span className="text-[10px] text-[#fafafa]">
              {telemetry.caffeinateActive
                ? `CAFFEINATE: GUARD ACTIVE${telemetry.caffeinatePid ? ` [PID ${telemetry.caffeinatePid}]` : ""}`
                : "CAFFEINATE: STANDBY"}
            </span>
          </div>

          {/* VRAM stats */}
          <div className="hidden md:flex items-center gap-1.5 bg-[#121215] px-2 py-1 border border-[#27272a]">
            <Cpu className="w-3.5 h-3.5 text-[#3b82f6]" />
            <span className="text-[10px] text-[#71717a]">VRAM:</span>
            <span className="text-[10px] text-[#fafafa] font-bold">{telemetry.vramFree} GB</span>
          </div>
        </div>

        {/* Right: Directorial Execution Controls */}
        <div className="flex items-center gap-2">
          {isRendering ? (
            <button
              type="button"
              onClick={onInterrupt}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#f43f5e] hover:bg-[#e11d48] text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-lg"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>CUT / INTERRUPT</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onTriggerRender}
              className="flex items-center gap-2 px-5 py-1.5 bg-[#f59e0b] hover:bg-[#d97706] text-black text-xs font-bold uppercase tracking-wider transition-colors shadow-lg"
            >
              <Flame className="w-4 h-4" />
              <span>ACTION / RENDER TAKE</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
