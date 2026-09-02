export interface ComfyNodeInput {
  [key: string]: any;
}

export interface ComfyNode {
  class_type: string;
  inputs: ComfyNodeInput;
  _meta?: {
    title?: string;
  };
}

export interface ComfyApiPrompt {
  [nodeId: string]: ComfyNode;
}

export interface StoryboardShotInput {
  prompt: string;
  duration?: number; // in seconds (e.g. 5.0)
  width?: number; // default 1344
  height?: number; // default 768
  steps?: number; // default 4
  seed?: number; // random integer if omitted
  fps?: number; // default 24
  ref_images?: (string | null | undefined)[]; // [ref0, ref1, ref2, ref3] filenames/paths
  lora_strength?: number; // default 1.0
  scheduler?: string; // default "simple"
  sampler_name?: string; // default "res_multistep"
  filename_prefix?: string; // default "video/MiniMax_H3"
}

export interface ComfySystemStats {
  system: {
    os: string;
    ram_total: number;
    ram_free: number;
    comfyui_version?: string;
    python_version?: string;
    pytorch_version?: string;
    argv?: string[];
  };
  devices: Array<{
    name: string;
    type: string;
    index: number;
    vram_total: number;
    vram_free: number;
    torch_vram_total?: number;
    torch_vram_free?: number;
  }>;
}

export interface ComfyPromptResponse {
  prompt_id: string;
  number: number;
  node_errors?: Record<string, any>;
}

export interface ComfyQueueItem {
  prompt_id: string;
  number: number;
  prompt: [number, string, ComfyApiPrompt, Record<string, any>, string[]];
  extra_data: Record<string, any>;
  outputs_to_execute: string[];
}

export interface ComfyQueueResponse {
  queue_running: ComfyQueueItem[];
  queue_pending: ComfyQueueItem[];
}

export interface ComfyHistoryOutput {
  images?: Array<{
    filename: string;
    subfolder: string;
    type: string;
  }>;
  videos?: Array<{
    filename: string;
    subfolder: string;
    type: string;
  }>;
  gifs?: Array<{
    filename: string;
    subfolder: string;
    type: string;
  }>;
  audio?: Array<{
    filename: string;
    subfolder: string;
    type: string;
  }>;
}

export interface ComfyHistoryItem {
  prompt: [number, string, ComfyApiPrompt, Record<string, any>, string[]];
  outputs: Record<string, ComfyHistoryOutput>;
  status?: {
    status_str: string;
    completed: boolean;
    messages: any[];
  };
}

export type ComfyHistoryResponse = Record<string, ComfyHistoryItem>;

export interface ComfyProgressEvent {
  type: "progress" | "executing" | "executed" | "execution_start" | "execution_error" | "status";
  data: {
    value?: number;
    max?: number;
    prompt_id?: string;
    node?: string | null;
    output?: any;
    status?: any;
    exception_message?: string;
    exception_type?: string;
    traceback?: string[];
  };
}
