"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  Scissors,
  Volume2,
  VolumeX,
  Plus,
  Trash2,
  ZoomIn,
  ZoomOut,
  Magnet,
  Layers,
  Music,
  Mic,
  Wind,
  Video,
  GripVertical,
  ChevronRight,
  MoveHorizontal,
} from "lucide-react";
import { TimelineClipUI, TrackState, PlayheadState, TimelineSettings } from "./types";
import { formatTimecode } from "./ProgramMonitor";
import { cn } from "@/lib/utils";

interface TimelineCanvasProps {
  playhead: PlayheadState;
  onSeek: (time: number) => void;
  videoClips: TimelineClipUI[];
  audioClips: TimelineClipUI[];
  tracks: TrackState[];
  selectedClipId: string | null;
  onSelectClip: (clipId: string | null) => void;
  onUpdateClip: (clipId: string, updates: Partial<TimelineClipUI>) => void;
  onDeleteClip: (clipId: string) => void;
  onReorderVideoClips: (startIndex: number, endIndex: number) => void;
  onSplitClipAtPlayhead: (clipId: string, splitTime: number) => void;
  onUpdateTrack: (trackId: string, updates: Partial<TrackState>) => void;
  settings: TimelineSettings;
  onUpdateSettings: (settings: Partial<TimelineSettings>) => void;
  totalDuration: number;
  onOpenTakeBin: () => void;
  onOpenAudioBin: () => void;
  onClearTimeline: () => void;
}

export function TimelineCanvas({
  playhead,
  onSeek,
  videoClips,
  audioClips,
  tracks,
  selectedClipId,
  onSelectClip,
  onUpdateClip,
  onDeleteClip,
  onReorderVideoClips,
  onSplitClipAtPlayhead,
  onUpdateTrack,
  settings,
  onUpdateSettings,
  totalDuration,
  onOpenTakeBin,
  onOpenAudioBin,
  onClearTimeline,
}: TimelineCanvasProps) {
  const rulerRef = useRef<HTMLDivElement | null>(null);
  const tracksContainerRef = useRef<HTMLDivElement | null>(null);

  // Dragging states
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [draggedClipIndex, setDraggedClipIndex] = useState<number | null>(null);
  const [trimmingState, setTrimmingState] = useState<{
    clipId: string;
    type: "left" | "right";
    initialX: number;
    initialTrimIn: number;
    initialTrimOut: number;
    initialDuration: number;
  } | null>(null);

  const zoom = settings.zoom; // px per second

  // Calculate timeline canvas width (at least enough for totalDuration + extra blank headroom)
  const canvasWidth = Math.max(1200, (totalDuration + 8) * zoom);

  // Timecode Ruler Click & Scrubbing
  const handleRulerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!rulerRef.current) return;
    const rect = rulerRef.current.getBoundingClientRect();
    const scrollLeft = tracksContainerRef.current?.scrollLeft || 0;
    const clickX = e.clientX - rect.left + scrollLeft;
    const newTime = Math.max(0, clickX / zoom);
    onSeek(newTime);
    setIsScrubbing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isScrubbing && rulerRef.current) {
        const rect = rulerRef.current.getBoundingClientRect();
        const scrollLeft = tracksContainerRef.current?.scrollLeft || 0;
        const clickX = e.clientX - rect.left + scrollLeft;
        let newTime = Math.max(0, clickX / zoom);

        // Snap to cuts if enabled
        if (settings.snapToCuts) {
          const snapThreshold = 6 / zoom; // ~6 pixels
          for (const vc of videoClips) {
            if (Math.abs(newTime - vc.start_time) < snapThreshold) {
              newTime = vc.start_time;
              break;
            }
            if (Math.abs(newTime - (vc.start_time + vc.duration)) < snapThreshold) {
              newTime = vc.start_time + vc.duration;
              break;
            }
          }
        }

        onSeek(newTime);
      }

      if (trimmingState) {
        const deltaPx = e.clientX - trimmingState.initialX;
        const deltaSec = deltaPx / zoom;

        if (trimmingState.type === "right") {
          // Trimming the out point
          const newDuration = Math.max(0.2, trimmingState.initialDuration + deltaSec);
          const newTrimOut = trimmingState.initialTrimIn + newDuration;
          onUpdateClip(trimmingState.clipId, {
            duration: newDuration,
            trim_out: newTrimOut,
          });
        } else if (trimmingState.type === "left") {
          // Trimming the in point
          const maxDelta = trimmingState.initialDuration - 0.2;
          const clampedDelta = Math.min(maxDelta, deltaSec);
          const newTrimIn = Math.max(0, trimmingState.initialTrimIn + clampedDelta);
          const newDuration = Math.max(0.2, trimmingState.initialDuration - clampedDelta);
          onUpdateClip(trimmingState.clipId, {
            trim_in: newTrimIn,
            duration: newDuration,
          });
        }
      }
    };

    const handleMouseUp = () => {
      if (isScrubbing) setIsScrubbing(false);
      if (trimmingState) setTrimmingState(null);
    };

    if (isScrubbing || trimmingState) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isScrubbing, trimmingState, zoom, settings.snapToCuts, videoClips, onSeek, onUpdateClip]);

  // Generate ruler tick marks
  const rulerTicks = [];
  const maxSec = Math.ceil(canvasWidth / zoom);
  const step = zoom < 50 ? 5 : zoom < 100 ? 2 : 1;

  for (let sec = 0; sec <= maxSec; sec += step) {
    const leftPx = sec * zoom;
    rulerTicks.push(
      <div
        key={`tick_${sec}`}
        className="absolute top-0 bottom-0 border-l border-[#3f3f46]/50 flex flex-col justify-between pl-1 select-none pointer-events-none"
        style={{ left: `${leftPx}px` }}
      >
        <span className="text-[9px] font-mono text-[#71717a]">
          {formatTimecode(sec, playhead.fps).slice(3)}
        </span>
        <div className="w-1 h-1.5 bg-[#3f3f46]" />
      </div>
    );
  }

  // Get track icon
  const getTrackIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="w-3.5 h-3.5 text-[#3b82f6]" />;
      case "audio_dialogue":
        return <Mic className="w-3.5 h-3.5 text-[#10b981]" />;
      case "audio_foley":
        return <Wind className="w-3.5 h-3.5 text-[#06b6d4]" />;
      case "audio_music":
      default:
        return <Music className="w-3.5 h-3.5 text-[#f59e0b]" />;
    }
  };

  return (
    <div className="flex flex-col bg-[#121215] border border-[#27272a] overflow-hidden select-none">
      {/* Timeline Controls & Settings Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-[#18181b] border-b border-[#27272a] text-xs font-mono">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-[#fafafa]">
            <Layers className="w-4 h-4 text-[#f43f5e]" />
            <span>NLE MULTI-TRACK CANVAS</span>
          </div>

          <span className="text-[#3f3f46]">|</span>

          {/* Quick Action Tools */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                if (selectedClipId) {
                  onSplitClipAtPlayhead(selectedClipId, playhead.currentTime);
                }
              }}
              disabled={!selectedClipId}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold border transition-colors",
                selectedClipId
                  ? "bg-[#27272a] hover:bg-[#3f3f46] text-[#fafafa] border-[#3f3f46]"
                  : "bg-[#18181b] text-[#52525b] border-[#27272a] cursor-not-allowed"
              )}
              title="Split selected clip at playhead"
            >
              <Scissors className="w-3.5 h-3.5 text-[#f43f5e]" />
              <span>RAZOR CUT</span>
            </button>

            <button
              onClick={() => {
                if (selectedClipId) {
                  onDeleteClip(selectedClipId);
                }
              }}
              disabled={!selectedClipId}
              className={cn(
                "p-1 border transition-colors",
                selectedClipId
                  ? "bg-[#27272a] hover:bg-[#f43f5e]/20 text-[#f43f5e] border-[#3f3f46]"
                  : "bg-[#18181b] text-[#52525b] border-[#27272a] cursor-not-allowed"
              )}
              title="Delete Selected Clip"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() =>
                onUpdateSettings({ snapToCuts: !settings.snapToCuts })
              }
              className={cn(
                "flex items-center gap-1 px-2 py-1 text-[10px] font-bold border transition-colors",
                settings.snapToCuts
                  ? "bg-[#3b82f6]/20 border-[#3b82f6] text-[#3b82f6]"
                  : "bg-[#27272a] border-[#3f3f46] text-[#71717a]"
              )}
              title="Toggle Snap to Cuts"
            >
              <Magnet className="w-3 h-3" />
              <span>SNAP: {settings.snapToCuts ? "ON" : "OFF"}</span>
            </button>
          </div>
        </div>

        {/* Right Side Tools: Zoom, Add Take, Add Audio */}
        <div className="flex items-center gap-3">
          {/* Zoom Slider */}
          <div className="flex items-center gap-1.5 bg-[#09090b] px-2 py-1 border border-[#27272a]">
            <button
              onClick={() =>
                onUpdateSettings({ zoom: Math.max(30, settings.zoom - 15) })
              }
              className="p-0.5 hover:text-[#fafafa] text-[#a1a1aa]"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <input
              type="range"
              min="30"
              max="200"
              value={settings.zoom}
              onChange={(e) =>
                onUpdateSettings({ zoom: parseInt(e.target.value, 10) })
              }
              className="w-16 h-1 bg-[#27272a] rounded accent-[#f43f5e] cursor-pointer"
            />
            <button
              onClick={() =>
                onUpdateSettings({ zoom: Math.min(200, settings.zoom + 15) })
              }
              className="p-0.5 hover:text-[#fafafa] text-[#a1a1aa]"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
            <span className="text-[9px] text-[#71717a] ml-1">{settings.zoom}px/s</span>
          </div>

          <button
            onClick={onOpenTakeBin}
            className="flex items-center gap-1 px-3 py-1 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-[11px] font-bold transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>ADD TAKE (V1)</span>
          </button>

          <button
            onClick={onOpenAudioBin}
            className="flex items-center gap-1 px-3 py-1 bg-[#10b981] hover:bg-[#059669] text-white text-[11px] font-bold transition-colors shadow-sm"
          >
            <Music className="w-3.5 h-3.5" />
            <span>SOUND FX / OST</span>
          </button>

          <button
            onClick={onClearTimeline}
            className="px-2 py-1 bg-[#27272a] hover:bg-[#3f3f46] text-[#a1a1aa] hover:text-[#f43f5e] text-[10px] transition-colors"
            title="Clear all clips from timeline"
          >
            CLEAR
          </button>
        </div>
      </div>

      {/* Timeline Multi-Track Canvas Body */}
      <div className="flex items-stretch flex-1 overflow-hidden min-h-[360px] bg-[#0c0c0e]">
        {/* Track Headers Column (Sticky Left) */}
        <div className="w-48 bg-[#18181b] border-r border-[#27272a] flex flex-col z-20 shrink-0">
          {/* Ruler Header Spacer */}
          <div className="h-8 border-b border-[#27272a] bg-[#121215] flex items-center justify-between px-3 text-[10px] font-mono text-[#71717a]">
            <span>TRACKS</span>
            <span>VOL / M / S</span>
          </div>

          {/* Track Headers */}
          <div className="flex-1 flex flex-col divide-y divide-[#27272a]">
            {tracks.map((track) => (
              <div
                key={track.id}
                className={cn(
                  "p-2.5 flex flex-col justify-between transition-colors",
                  track.type === "video" ? "h-24" : "h-16",
                  track.muted ? "opacity-60 bg-[#121215]" : "bg-[#18181b]"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {getTrackIcon(track.type)}
                    <span className="font-bold text-[11px] font-mono text-[#fafafa]">
                      {track.label}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-[#71717a]">
                    {track.subLabel}
                  </span>
                </div>

                {/* Track Controls: Volume Slider, Mute, Solo */}
                <div className="flex items-center justify-between mt-2 pt-1 border-t border-[#27272a]/50 text-[10px] font-mono">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        onUpdateTrack(track.id, { muted: !track.muted })
                      }
                      className={cn(
                        "px-1.5 py-0.5 rounded text-[9px] font-bold",
                        track.muted
                          ? "bg-[#f43f5e] text-white"
                          : "bg-[#27272a] text-[#a1a1aa] hover:text-[#fafafa]"
                      )}
                      title="Mute Track"
                    >
                      M
                    </button>
                    <button
                      onClick={() =>
                        onUpdateTrack(track.id, { solo: !track.solo })
                      }
                      className={cn(
                        "px-1.5 py-0.5 rounded text-[9px] font-bold",
                        track.solo
                          ? "bg-[#f59e0b] text-black"
                          : "bg-[#27272a] text-[#a1a1aa] hover:text-[#fafafa]"
                      )}
                      title="Solo Track"
                    >
                      S
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <Volume2 className="w-3 h-3 text-[#71717a]" />
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.05"
                      value={track.volume}
                      onChange={(e) =>
                        onUpdateTrack(track.id, {
                          volume: parseFloat(e.target.value),
                        })
                      }
                      className="w-14 h-1 bg-[#27272a] rounded accent-[#3b82f6] cursor-pointer"
                      title={`Volume: ${Math.round(track.volume * 100)}%`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable Track Canvas & Ruler */}
        <div
          ref={tracksContainerRef}
          className="flex-1 overflow-x-auto overflow-y-hidden relative select-none"
        >
          <div
            className="relative h-full flex flex-col"
            style={{ width: `${canvasWidth}px` }}
          >
            {/* Timecode Ruler Bar */}
            <div
              ref={rulerRef}
              onMouseDown={handleRulerMouseDown}
              className="h-8 bg-[#121215] border-b border-[#27272a] relative cursor-pointer sticky top-0 z-10 overflow-hidden"
            >
              {rulerTicks}
            </div>

            {/* Track Lanes */}
            <div className="flex-1 flex flex-col divide-y divide-[#27272a] relative">
              {/* V1 VIDEO TRACK LANE */}
              <div className="h-24 bg-[#09090b] relative flex items-center px-1 overflow-hidden">
                {videoClips.map((clip, index) => {
                  const leftPx = clip.start_time * zoom;
                  const widthPx = Math.max(30, clip.duration * zoom);
                  const isSelected = selectedClipId === clip.id;

                  return (
                    <div
                      key={clip.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectClip(clip.id);
                      }}
                      draggable
                      onDragStart={() => setDraggedClipIndex(index)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (draggedClipIndex !== null && draggedClipIndex !== index) {
                          onReorderVideoClips(draggedClipIndex, index);
                          setDraggedClipIndex(null);
                        }
                      }}
                      className={cn(
                        "absolute top-1 bottom-1 rounded border flex flex-col justify-between p-2 cursor-pointer transition-all shadow-md group",
                        isSelected
                          ? "bg-[#3b82f6]/30 border-[#3b82f6] ring-1 ring-[#3b82f6]"
                          : "bg-[#1e293b]/70 border-[#334155] hover:border-[#60a5fa]"
                      )}
                      style={{
                        left: `${leftPx}px`,
                        width: `${widthPx}px`,
                      }}
                    >
                      {/* Left Trim Handle */}
                      <div
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setTrimmingState({
                            clipId: clip.id,
                            type: "left",
                            initialX: e.clientX,
                            initialTrimIn: clip.trim_in || 0,
                            initialTrimOut: clip.trim_out || (clip.trim_in || 0) + clip.duration,
                            initialDuration: clip.duration,
                          });
                        }}
                        className="absolute left-0 top-0 bottom-0 w-2.5 bg-[#3b82f6]/50 hover:bg-[#3b82f6] cursor-ew-resize opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-10"
                        title="Drag to trim IN point"
                      >
                        <div className="w-0.5 h-4 bg-white/80 rounded" />
                      </div>

                      {/* Clip Body Info */}
                      <div className="flex items-start justify-between gap-1 overflow-hidden pointer-events-none">
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-[11px] font-mono font-bold text-[#fafafa] truncate">
                            {clip.name}
                          </span>
                          <span className="text-[9px] font-mono text-[#94a3b8]">
                            {clip.take?.take_number ? `TAKE ${clip.take.take_number}` : "CUT"}
                          </span>
                        </div>
                        <span className="px-1 py-0.5 bg-black/60 rounded text-[9px] font-mono text-[#38bdf8] font-semibold shrink-0">
                          {clip.duration.toFixed(2)}s
                        </span>
                      </div>

                      {/* Clip Footer Details */}
                      <div className="flex items-center justify-between text-[8px] font-mono text-[#64748b] pointer-events-none">
                        <span>IN: {(clip.trim_in || 0).toFixed(1)}s</span>
                        <span>OUT: {((clip.trim_in || 0) + clip.duration).toFixed(1)}s</span>
                      </div>

                      {/* Right Trim Handle */}
                      <div
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setTrimmingState({
                            clipId: clip.id,
                            type: "right",
                            initialX: e.clientX,
                            initialTrimIn: clip.trim_in || 0,
                            initialTrimOut: clip.trim_out || (clip.trim_in || 0) + clip.duration,
                            initialDuration: clip.duration,
                          });
                        }}
                        className="absolute right-0 top-0 bottom-0 w-2.5 bg-[#3b82f6]/50 hover:bg-[#3b82f6] cursor-ew-resize opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-10"
                        title="Drag to trim OUT point"
                      >
                        <div className="w-0.5 h-4 bg-white/80 rounded" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* A1 DIALOGUE & VOICE TRACK LANE */}
              <div className="h-16 bg-[#09090b] relative flex items-center px-1 overflow-hidden">
                {audioClips
                  .filter((ac) => ac.track_type === "audio_dialogue")
                  .map((clip) => {
                    const leftPx = clip.start_time * zoom;
                    const widthPx = Math.max(25, clip.duration * zoom);
                    const isSelected = selectedClipId === clip.id;

                    return (
                      <div
                        key={clip.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectClip(clip.id);
                        }}
                        className={cn(
                          "absolute top-1 bottom-1 rounded border flex flex-col justify-between p-1.5 cursor-pointer shadow-sm group",
                          isSelected
                            ? "bg-[#10b981]/30 border-[#10b981] ring-1 ring-[#10b981]"
                            : "bg-[#064e3b]/50 border-[#047857] hover:border-[#34d399]"
                        )}
                        style={{
                          left: `${leftPx}px`,
                          width: `${widthPx}px`,
                        }}
                      >
                        <div className="flex items-center justify-between pointer-events-none">
                          <span className="text-[10px] font-mono font-bold text-[#10b981] truncate">
                            {clip.name}
                          </span>
                          <span className="text-[9px] font-mono text-[#a7f3d0]">
                            {clip.duration.toFixed(1)}s
                          </span>
                        </div>
                        {/* Waveform Simulation Bars */}
                        <div className="flex items-center gap-0.5 h-3 opacity-60 pointer-events-none overflow-hidden">
                          {Array.from({ length: Math.min(30, Math.floor(widthPx / 4)) }).map(
                            (_, i) => (
                              <div
                                key={i}
                                className="w-0.5 bg-[#10b981] rounded-full"
                                style={{
                                  height: `${20 + ((i * 37) % 80)}%`,
                                }}
                              />
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* A2 FOLEY & AMBIENCE TRACK LANE */}
              <div className="h-16 bg-[#09090b] relative flex items-center px-1 overflow-hidden">
                {audioClips
                  .filter((ac) => ac.track_type === "audio_foley")
                  .map((clip) => {
                    const leftPx = clip.start_time * zoom;
                    const widthPx = Math.max(25, clip.duration * zoom);
                    const isSelected = selectedClipId === clip.id;

                    return (
                      <div
                        key={clip.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectClip(clip.id);
                        }}
                        className={cn(
                          "absolute top-1 bottom-1 rounded border flex flex-col justify-between p-1.5 cursor-pointer shadow-sm group",
                          isSelected
                            ? "bg-[#06b6d4]/30 border-[#06b6d4] ring-1 ring-[#06b6d4]"
                            : "bg-[#164e63]/50 border-[#0e7490] hover:border-[#22d3ee]"
                        )}
                        style={{
                          left: `${leftPx}px`,
                          width: `${widthPx}px`,
                        }}
                      >
                        <div className="flex items-center justify-between pointer-events-none">
                          <span className="text-[10px] font-mono font-bold text-[#06b6d4] truncate">
                            {clip.name}
                          </span>
                          <span className="text-[9px] font-mono text-[#a5f3fc]">
                            {clip.duration.toFixed(1)}s
                          </span>
                        </div>
                        {/* Waveform Simulation Bars */}
                        <div className="flex items-center gap-0.5 h-3 opacity-60 pointer-events-none overflow-hidden">
                          {Array.from({ length: Math.min(30, Math.floor(widthPx / 4)) }).map(
                            (_, i) => (
                              <div
                                key={i}
                                className="w-0.5 bg-[#06b6d4] rounded-full"
                                style={{
                                  height: `${30 + ((i * 23) % 70)}%`,
                                }}
                              />
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* A3 SOUNDTRACK & MUSIC TRACK LANE */}
              <div className="h-16 bg-[#09090b] relative flex items-center px-1 overflow-hidden">
                {audioClips
                  .filter((ac) => ac.track_type === "audio_music")
                  .map((clip) => {
                    const leftPx = clip.start_time * zoom;
                    const widthPx = Math.max(25, clip.duration * zoom);
                    const isSelected = selectedClipId === clip.id;

                    return (
                      <div
                        key={clip.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectClip(clip.id);
                        }}
                        className={cn(
                          "absolute top-1 bottom-1 rounded border flex flex-col justify-between p-1.5 cursor-pointer shadow-sm group",
                          isSelected
                            ? "bg-[#f59e0b]/30 border-[#f59e0b] ring-1 ring-[#f59e0b]"
                            : "bg-[#78350f]/50 border-[#b45309] hover:border-[#fbbf24]"
                        )}
                        style={{
                          left: `${leftPx}px`,
                          width: `${widthPx}px`,
                        }}
                      >
                        <div className="flex items-center justify-between pointer-events-none">
                          <span className="text-[10px] font-mono font-bold text-[#f59e0b] truncate">
                            {clip.name}
                          </span>
                          <span className="text-[9px] font-mono text-[#fde68a]">
                            {clip.duration.toFixed(1)}s
                          </span>
                        </div>
                        {/* Waveform Simulation Bars */}
                        <div className="flex items-center gap-0.5 h-3 opacity-60 pointer-events-none overflow-hidden">
                          {Array.from({ length: Math.min(30, Math.floor(widthPx / 4)) }).map(
                            (_, i) => (
                              <div
                                key={i}
                                className="w-0.5 bg-[#f59e0b] rounded-full"
                                style={{
                                  height: `${25 + ((i * 43) % 75)}%`,
                                }}
                              />
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Studio Red Playhead Line & Scrubber */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-[#f43f5e] z-30 pointer-events-none"
              style={{ left: `${playhead.currentTime * zoom}px` }}
            >
              {/* Top Playhead Scrubber Cap */}
              <div className="w-3.5 h-4 bg-[#f43f5e] -ml-[6px] -mt-1 polygon-playhead shadow-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
