"use client";

import React, { useState } from "react";
import {
  X,
  Download,
  Film,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Play,
  Volume2,
  HardDrive,
  Cpu,
  Layers,
  Settings2,
  RefreshCw,
  FolderCheck,
} from "lucide-react";
import { ExportPreset, ExportFormat, ExportSettings, ExportResult } from "@/lib/ffmpeg/types";
import { TimelineClipUI, TrackState } from "./types";
import { formatTimecode } from "./ProgramMonitor";
import { cn } from "@/lib/utils";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoClips: TimelineClipUI[];
  audioClips: TimelineClipUI[];
  tracks: TrackState[];
  projectId: string;
  totalDuration: number;
}

export function ExportModal({
  isOpen,
  onClose,
  videoClips,
  audioClips,
  tracks,
  projectId,
  totalDuration,
}: ExportModalProps) {
  const [customTitle, setCustomTitle] = useState("neo_tokyo_2088_master");
  const [preset, setPreset] = useState<ExportPreset>("1080p");
  const [format, setFormat] = useState<ExportFormat>("mp4");
  const [normalizeAudio, setNormalizeAudio] = useState(true);
  const [exportToShared, setExportToShared] = useState(true);

  // Export State
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stageDetails, setStageDetails] = useState("");
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartExport = async () => {
    if (videoClips.length === 0) {
      setExportError("Cannot export empty timeline: Please add at least one video cut to Track V1.");
      return;
    }

    setIsExporting(true);
    setProgress(15);
    setStageDetails("Preparing timeline clips and audio track graph...");
    setExportError(null);
    setExportResult(null);

    try {
      const exportSettings: ExportSettings = {
        preset,
        format,
        fps: 24,
        normalizeAudio,
        exportToShared,
        customTitle,
      };

      // Progress simulation ticker while server-side FFmpeg runs
      const timer = setInterval(() => {
        setProgress((prev) => {
          if (prev < 85) return prev + Math.floor(Math.random() * 8) + 2;
          return prev;
        });
      }, 500);

      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          videoClips,
          audioTracks: audioClips,
          exportSettings,
        }),
      });

      clearInterval(timer);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Master export failed");
      }

      setProgress(100);
      setStageDetails("Export finished successfully.");
      setExportResult(data.export);
    } catch (err: any) {
      setExportError(err.message || "Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl bg-[#121215] border border-[#27272a] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 bg-[#18181b] border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 bg-[#f43f5e]/20 border border-[#f43f5e]/40 text-[#f43f5e] text-[10px] font-mono font-bold uppercase">
              FFMPEG ENGINE
            </span>
            <h2 className="text-sm font-mono font-bold text-[#fafafa] uppercase">
              MASTER FILM EXPORT PIPELINE
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="p-1 hover:bg-[#27272a] text-[#a1a1aa] hover:text-[#fafafa] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 font-mono text-xs">
          {/* If already completed, show player & download card */}
          {exportResult ? (
            <div className="space-y-4">
              <div className="p-4 bg-[#10b981]/10 border border-[#10b981]/40 rounded space-y-3">
                <div className="flex items-center gap-2 text-[#10b981] font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>MASTER EXPORT COMPLETE</span>
                </div>
                <p className="text-[11px] text-[#a1a1aa]">
                  Your timeline has been compiled, frame-accurately stitched, audio mixed and mastered.
                </p>

                {/* Video Playback Stage */}
                <div className="aspect-video bg-black border border-[#27272a] overflow-hidden rounded">
                  <video
                    src={exportResult.publicUrl}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Telemetry Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[10px]">
                  <div className="p-2 bg-[#18181b] border border-[#27272a]">
                    <span className="text-[#71717a] block">DURATION</span>
                    <span className="text-[#fafafa] font-bold">
                      {formatTimecode(exportResult.duration)}
                    </span>
                  </div>
                  <div className="p-2 bg-[#18181b] border border-[#27272a]">
                    <span className="text-[#71717a] block">FILE SIZE</span>
                    <span className="text-[#38bdf8] font-bold">
                      {formatBytes(exportResult.fileSize)}
                    </span>
                  </div>
                  <div className="p-2 bg-[#18181b] border border-[#27272a]">
                    <span className="text-[#71717a] block">RESOLUTION</span>
                    <span className="text-[#fafafa] font-bold">
                      {exportResult.metadata.width}x{exportResult.metadata.height}
                    </span>
                  </div>
                  <div className="p-2 bg-[#18181b] border border-[#27272a]">
                    <span className="text-[#71717a] block">CODEC</span>
                    <span className="text-[#10b981] font-bold uppercase">
                      {exportResult.metadata.videoCodec || format}
                    </span>
                  </div>
                </div>

                {/* Path Badges */}
                <div className="space-y-1.5 pt-1 text-[10px]">
                  <div className="flex items-center gap-2 text-[#a1a1aa] truncate">
                    <FolderCheck className="w-3.5 h-3.5 text-[#10b981] shrink-0" />
                    <span className="text-[#71717a]">Public Output:</span>
                    <span className="text-[#fafafa] truncate">{exportResult.outputPath}</span>
                  </div>
                  {exportResult.sharedPath && (
                    <div className="flex items-center gap-2 text-[#a1a1aa] truncate">
                      <HardDrive className="w-3.5 h-3.5 text-[#3b82f6] shrink-0" />
                      <span className="text-[#71717a]">ComfyUI Shared:</span>
                      <span className="text-[#38bdf8] truncate">{exportResult.sharedPath}</span>
                    </div>
                  )}
                </div>

                {/* Download and Reset Actions */}
                <div className="flex items-center gap-3 pt-3 border-t border-[#10b981]/20">
                  <a
                    href={exportResult.publicUrl}
                    download
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#10b981] hover:bg-[#059669] text-white font-bold transition-colors shadow-md"
                  >
                    <Download className="w-4 h-4" />
                    <span>DOWNLOAD MASTER FILE</span>
                  </a>
                  <button
                    onClick={() => setExportResult(null)}
                    className="px-4 py-2.5 bg-[#27272a] hover:bg-[#3f3f46] text-[#fafafa] font-bold transition-colors"
                  >
                    CONFIGURE NEW EXPORT
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Filename Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-[#a1a1aa] font-bold">
                  PROJECT / MASTER CUT TITLE
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  disabled={isExporting}
                  placeholder="e.g. neo_tokyo_scene_01_final_cut"
                  className="w-full bg-[#18181b] border border-[#27272a] px-3 py-2 text-[#fafafa] focus:border-[#f43f5e] outline-none"
                />
              </div>

              {/* Preset Selector */}
              <div className="space-y-2">
                <label className="text-[11px] text-[#a1a1aa] font-bold">
                  RESOLUTION & ASPECT RATIO PRESET
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      id: "1080p",
                      title: "1080P MASTER (16:9)",
                      sub: "1920x1080 - Full HD Standard",
                    },
                    {
                      id: "4k",
                      title: "4K CINEMA UHD (16:9)",
                      sub: "3840x2160 - Master Archival",
                    },
                    {
                      id: "scope",
                      title: "2.39:1 CINEMASCOPE",
                      sub: "1920x804 - Anamorphic Scope",
                    },
                    {
                      id: "social_9_16",
                      title: "9:16 SOCIAL REEL",
                      sub: "1080x1920 - Vertical Short/Reel",
                    },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      disabled={isExporting}
                      onClick={() => setPreset(p.id as ExportPreset)}
                      className={cn(
                        "p-3 text-left border transition-all",
                        preset === p.id
                          ? "bg-[#f43f5e]/20 border-[#f43f5e] text-[#fafafa]"
                          : "bg-[#18181b] border-[#27272a] text-[#a1a1aa] hover:border-[#3f3f46]"
                      )}
                    >
                      <div className="font-bold text-[11px]">{p.title}</div>
                      <div className="text-[9px] text-[#71717a] mt-0.5">{p.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Format / Codec Selector */}
              <div className="space-y-2">
                <label className="text-[11px] text-[#a1a1aa] font-bold">
                  MASTER CONTAINER & CODEC
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      id: "mp4",
                      title: "H.264 (MP4)",
                      sub: "Universal AAC Stereo",
                    },
                    {
                      id: "prores",
                      title: "PRORES 422 HQ",
                      sub: "Lossless PCM Audio",
                    },
                    {
                      id: "webm",
                      title: "WEBM (VP9)",
                      sub: "Opus Audio Web",
                    },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      disabled={isExporting}
                      onClick={() => setFormat(f.id as ExportFormat)}
                      className={cn(
                        "p-2.5 text-left border transition-all",
                        format === f.id
                          ? "bg-[#3b82f6]/20 border-[#3b82f6] text-[#fafafa]"
                          : "bg-[#18181b] border-[#27272a] text-[#a1a1aa] hover:border-[#3f3f46]"
                      )}
                    >
                      <div className="font-bold text-[11px]">{f.title}</div>
                      <div className="text-[9px] text-[#71717a] mt-0.5">{f.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Audio & Delivery Options */}
              <div className="p-3 bg-[#18181b] border border-[#27272a] space-y-2.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={normalizeAudio}
                    onChange={(e) => setNormalizeAudio(e.target.checked)}
                    disabled={isExporting}
                    className="accent-[#f43f5e]"
                  />
                  <span className="text-[#fafafa] font-bold">
                    EBU R128 Audio Loudness Normalization (-16 LUFS)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={exportToShared}
                    onChange={(e) => setExportToShared(e.target.checked)}
                    disabled={isExporting}
                    className="accent-[#3b82f6]"
                  />
                  <span className="text-[#fafafa] font-bold">
                    Sync export to ComfyUI-Shared/output directory
                  </span>
                </label>
              </div>

              {/* Timeline Telemetry Summary */}
              <div className="flex items-center justify-between p-3 bg-[#0c0c0e] border border-[#27272a] text-[11px]">
                <div className="flex items-center gap-3">
                  <span className="text-[#71717a]">SEQUENCE:</span>
                  <span className="text-[#3b82f6] font-bold">{videoClips.length} VIDEO CUTS</span>
                  <span className="text-[#10b981] font-bold">{audioClips.length} AUDIO CUES</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#71717a]">RUNTIME:</span>
                  <span className="text-[#fafafa] font-bold">{formatTimecode(totalDuration)}</span>
                </div>
              </div>

              {/* Error Message */}
              {exportError && (
                <div className="p-3 bg-[#f43f5e]/10 border border-[#f43f5e]/40 text-[#f43f5e] flex items-center gap-2 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{exportError}</span>
                </div>
              )}

              {/* Live Render Progress Meter */}
              {isExporting && (
                <div className="p-4 bg-[#18181b] border border-[#27272a] space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#f43f5e] font-bold flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{stageDetails || "Rendering Master Cut..."}</span>
                    </span>
                    <span className="text-[#fafafa] font-bold">{progress}%</span>
                  </div>
                  <div className="w-full bg-[#27272a] h-2 rounded overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#3b82f6] via-[#f43f5e] to-[#10b981] h-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        {!exportResult && (
          <div className="flex items-center justify-between p-4 bg-[#18181b] border-t border-[#27272a]">
            <button
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 bg-[#27272a] hover:bg-[#3f3f46] text-[#a1a1aa] hover:text-[#fafafa] text-xs font-mono font-bold transition-colors"
            >
              CANCEL
            </button>

            <button
              onClick={handleStartExport}
              disabled={isExporting || videoClips.length === 0}
              className={cn(
                "flex items-center gap-2 px-6 py-2 text-xs font-mono font-bold transition-colors shadow-lg",
                isExporting || videoClips.length === 0
                  ? "bg-[#27272a] text-[#71717a] cursor-not-allowed"
                  : "bg-[#f43f5e] hover:bg-[#e11d48] text-white"
              )}
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? "RENDERING MASTER CUT..." : "EXECUTE MASTER RENDER"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
