import { TimelineClip } from "@/lib/db/schema";
import { ExportPreset, ExportFormat } from "@/lib/ffmpeg/types";

export interface TimelineClipUI extends Omit<TimelineClip, "muted"> {
  muted: boolean;
  take?: any;
  shot?: any;
  scene?: any;
  color?: string;
}

export interface TrackState {
  id: string;
  name: string;
  type: "video" | "audio_dialogue" | "audio_foley" | "audio_music";
  label: string;
  subLabel: string;
  color: string;
  muted: boolean;
  solo: boolean;
  volume: number; // 0.0 to 2.0
}

export interface PlayheadState {
  currentTime: number; // seconds
  isPlaying: boolean;
  duration: number;
  fps: number;
  loop: boolean;
}

export interface TimelineSettings {
  zoom: number; // pixels per second (e.g. 40 to 200)
  snapToCuts: boolean;
  showWaveforms: boolean;
  aspectRatioGuide: "none" | "16:9" | "2.39:1" | "9:16";
}

export interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoClips: TimelineClipUI[];
  audioClips: TimelineClipUI[];
  tracks: TrackState[];
  projectId: string;
  onExportSuccess?: (exportResult: any) => void;
}
