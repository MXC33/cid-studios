export interface MediaMetadata {
  duration: number;
  width?: number;
  height?: number;
  aspectRatio?: string;
  fps?: number;
  videoCodec?: string;
  audioCodec?: string;
  audioSampleRate?: number;
  audioChannels?: number;
  bitrate?: number;
  size?: number;
  format?: string;
}

export type TimelineTrackType =
  | "video"
  | "audio_dialogue"
  | "audio_foley"
  | "audio_music";

export interface TimelineClipInput {
  id: string;
  track_type: TimelineTrackType;
  track_index?: number;
  take_id?: string | null;
  name: string;
  file_path: string;
  trim_in: number;
  trim_out: number;
  start_time: number;
  duration: number;
  volume?: number;
  muted?: boolean;
  speed?: number;
  order_index?: number;
  metadata?: Record<string, any>;
}

export interface AudioTrackInput {
  id: string;
  type: "dialogue" | "foley" | "music";
  name?: string;
  volume: number;
  muted: boolean;
  solo: boolean;
  clips: TimelineClipInput[];
}

export type ExportPreset = "1080p" | "4k" | "scope" | "social_9_16";
export type ExportFormat = "mp4" | "prores" | "webm";

export interface ExportSettings {
  preset: ExportPreset;
  format: ExportFormat;
  resolution?: { width: number; height: number };
  fps?: number;
  videoBitrate?: string;
  audioBitrate?: string;
  audioSampleRate?: number;
  normalizeAudio?: boolean;
  exportToShared?: boolean;
  customTitle?: string;
}

export interface ExportProgress {
  percentage: number;
  stage:
    | "preparing"
    | "trimming"
    | "concatenating"
    | "mixing_audio"
    | "encoding"
    | "finalizing"
    | "completed"
    | "failed";
  details?: string;
  outputPath?: string;
  fileSize?: number;
  duration?: number;
  error?: string;
}

export interface ExportResult {
  success: boolean;
  outputPath: string;
  publicUrl: string;
  sharedPath?: string | null;
  duration: number;
  fileSize: number;
  metadata: MediaMetadata;
  settings: ExportSettings;
}
