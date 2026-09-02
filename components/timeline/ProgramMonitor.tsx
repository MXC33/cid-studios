"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Repeat,
  Maximize2,
  Minimize2,
  Film,
  Sparkles,
  Monitor,
  Eye,
  Sliders,
  Ratio,
} from "lucide-react";
import { TimelineClipUI, PlayheadState } from "./types";
import { cn } from "@/lib/utils";

interface ProgramMonitorProps {
  playhead: PlayheadState;
  onSeek: (time: number) => void;
  onTogglePlay: () => void;
  videoClips: TimelineClipUI[];
  activeClip: TimelineClipUI | null;
  activeClipOffset: number; // offset within current clip
  aspectRatioGuide: "none" | "16:9" | "2.39:1" | "9:16";
  onAspectRatioChange: (ratio: "none" | "16:9" | "2.39:1" | "9:16") => void;
  totalDuration: number;
}

export function formatTimecode(seconds: number, fps: number = 24): string {
  if (isNaN(seconds) || seconds < 0) seconds = 0;
  const totalFrames = Math.floor(seconds * fps);
  const frames = totalFrames % fps;
  const totalSeconds = Math.floor(seconds);
  const s = totalSeconds % 60;
  const m = Math.floor(totalSeconds / 60) % 60;
  const h = Math.floor(totalSeconds / 3600);

  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}:${pad(frames)}`;
}

export function ProgramMonitor({
  playhead,
  onSeek,
  onTogglePlay,
  videoClips,
  activeClip,
  activeClipOffset,
  aspectRatioGuide,
  onAspectRatioChange,
  totalDuration,
}: ProgramMonitorProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1.0);

  // Sync internal video element with playhead position & active clip
  useEffect(() => {
    if (!videoRef.current || !activeClip) return;

    const currentSrc = videoRef.current.getAttribute("data-clip-id");
    const targetSrc = activeClip.file_path;

    if (currentSrc !== activeClip.id) {
      videoRef.current.setAttribute("data-clip-id", activeClip.id);
      videoRef.current.src = targetSrc.startsWith("/") || targetSrc.startsWith("http")
        ? targetSrc
        : `/api/media?path=${encodeURIComponent(targetSrc)}`;
      videoRef.current.load();
    }

    const clipTargetTime = (activeClip.trim_in || 0) + activeClipOffset;
    if (Math.abs(videoRef.current.currentTime - clipTargetTime) > 0.1) {
      videoRef.current.currentTime = clipTargetTime;
    }

    if (playhead.isPlaying) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [activeClip, activeClipOffset, playhead.isPlaying]);

  // Frame step handlers (1/24 sec)
  const stepFrame = useCallback(
    (frames: number) => {
      const frameDelta = frames / playhead.fps;
      const newTime = Math.max(0, Math.min(totalDuration, playhead.currentTime + frameDelta));
      onSeek(newTime);
    },
    [playhead.currentTime, playhead.fps, totalDuration, onSeek]
  );

  // Jump to previous/next cut
  const jumpToPreviousCut = useCallback(() => {
    if (videoClips.length === 0) {
      onSeek(0);
      return;
    }
    const current = playhead.currentTime;
    let target = 0;
    for (let i = videoClips.length - 1; i >= 0; i--) {
      const cutStart = videoClips[i].start_time;
      if (cutStart < current - 0.05) {
        target = cutStart;
        break;
      }
    }
    onSeek(target);
  }, [videoClips, playhead.currentTime, onSeek]);

  const jumpToNextCut = useCallback(() => {
    if (videoClips.length === 0) {
      onSeek(totalDuration);
      return;
    }
    const current = playhead.currentTime;
    let target = totalDuration;
    for (let i = 0; i < videoClips.length; i++) {
      const cutEnd = videoClips[i].start_time + videoClips[i].duration;
      if (cutEnd > current + 0.05) {
        target = cutEnd;
        break;
      }
    }
    onSeek(target);
  }, [videoClips, playhead.currentTime, totalDuration, onSeek]);

  // Keyboard shortcut listener for spacebar and arrow keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        onTogglePlay();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        stepFrame(e.shiftKey ? -24 : -1);
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        stepFrame(e.shiftKey ? 24 : 1);
      } else if (e.code === "Home") {
        e.preventDefault();
        onSeek(0);
      } else if (e.code === "End") {
        e.preventDefault();
        onSeek(totalDuration);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onTogglePlay, stepFrame, onSeek, totalDuration]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const currentFrame = Math.floor(playhead.currentTime * playhead.fps);
  const totalFrames = Math.floor(totalDuration * playhead.fps);

  return (
    <div
      ref={containerRef}
      className="flex flex-col bg-[#121215] border border-[#27272a] overflow-hidden shadow-2xl relative"
    >
      {/* Program Monitor Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#18181b] border-b border-[#27272a] text-xs font-mono">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[#f43f5e] font-bold">
            <Monitor className="w-3.5 h-3.5" />
            <span>PROGRAM MONITOR</span>
          </div>
          <span className="text-[#3f3f46]">|</span>
          <span className="text-[#a1a1aa] text-[11px] truncate max-w-[200px]">
            {activeClip ? activeClip.name : "NO CLIP SELECTED"}
          </span>
          {activeClip && (
            <span className="px-1.5 py-0.5 bg-[#3b82f6]/20 border border-[#3b82f6]/40 text-[#3b82f6] text-[9px] font-bold">
              {activeClip.take?.take_number ? `TAKE #${activeClip.take.take_number}` : "CUT"}
            </span>
          )}
        </div>

        {/* Aspect Ratio Guides & Tools */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#09090b] px-2 py-0.5 border border-[#27272a] text-[10px]">
            <Ratio className="w-3 h-3 text-[#71717a]" />
            <span className="text-[#71717a]">SCOPE:</span>
            {(["none", "16:9", "2.39:1", "9:16"] as const).map((ratio) => (
              <button
                key={ratio}
                onClick={() => onAspectRatioChange(ratio)}
                className={cn(
                  "px-1.5 py-0.5 rounded transition-colors text-[9px] uppercase",
                  aspectRatioGuide === ratio
                    ? "bg-[#f43f5e] text-white font-bold"
                    : "text-[#a1a1aa] hover:text-[#fafafa]"
                )}
              >
                {ratio === "none" ? "FULL" : ratio}
              </button>
            ))}
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-1 hover:bg-[#27272a] text-[#a1a1aa] hover:text-[#fafafa] transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Video Viewport Stage */}
      <div className="relative w-full aspect-video bg-[#000000] flex items-center justify-center overflow-hidden select-none">
        {activeClip ? (
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            muted={isMuted}
            playsInline
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-6 space-y-2">
            <Film className="w-12 h-12 text-[#27272a]" />
            <p className="text-xs font-mono text-[#71717a]">TIMELINE EMPTY OR PLAYHEAD AT GAP</p>
            <p className="text-[10px] font-mono text-[#52525b]">Add takes from the drawer or move playhead</p>
          </div>
        )}

        {/* Aspect Ratio Mattes / Overlay Guides */}
        {aspectRatioGuide === "2.39:1" && (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between">
            <div className="w-full bg-black/85 border-b border-[#f43f5e]/40 h-[12.5%]" />
            <div className="w-full bg-black/85 border-t border-[#f43f5e]/40 h-[12.5%]" />
          </div>
        )}

        {aspectRatioGuide === "9:16" && (
          <div className="absolute inset-0 pointer-events-none flex justify-between">
            <div className="h-full bg-black/85 border-r border-[#3b82f6]/40 w-[28%]" />
            <div className="h-full bg-black/85 border-l border-[#3b82f6]/40 w-[28%]" />
          </div>
        )}

        {aspectRatioGuide === "16:9" && (
          <div className="absolute inset-0 pointer-events-none border-2 border-[#10b981]/40 m-4" />
        )}

        {/* Live Studio Timecode Overlay */}
        <div className="absolute top-3 left-3 px-2 py-1 bg-black/80 border border-[#27272a] backdrop-blur-sm font-mono text-xs text-[#fafafa] flex items-center gap-2 pointer-events-none shadow-lg">
          <span className="inline-block w-2 h-2 rounded-full bg-[#f43f5e] animate-pulse" />
          <span className="text-[#3b82f6] font-bold text-sm">
            {formatTimecode(playhead.currentTime, playhead.fps)}
          </span>
          <span className="text-[#71717a] text-[10px]">
            [{currentFrame} / {totalFrames}F]
          </span>
        </div>

        {/* Active Shot Badge */}
        {activeClip && (
          <div className="absolute top-3 right-3 px-2 py-1 bg-black/80 border border-[#27272a] backdrop-blur-sm font-mono text-[10px] text-[#fafafa] flex items-center gap-1.5 pointer-events-none shadow-lg">
            <span className="text-[#f59e0b] font-bold">V1</span>
            <span className="text-[#a1a1aa] truncate max-w-[140px]">{activeClip.name}</span>
          </div>
        )}
      </div>

      {/* Program Transport Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-[#18181b] border-t border-[#27272a] font-mono text-xs">
        {/* Timecode Indicators */}
        <div className="flex items-center gap-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[10px] text-[#71717a]">TC</span>
            <span className="text-sm font-bold text-[#fafafa] tracking-wider">
              {formatTimecode(playhead.currentTime, playhead.fps)}
            </span>
          </div>
          <span className="text-[#3f3f46]">/</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[10px] text-[#71717a]">TOTAL</span>
            <span className="text-xs text-[#a1a1aa] tracking-wider">
              {formatTimecode(totalDuration, playhead.fps)}
            </span>
          </div>
        </div>

        {/* Center Transport Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={jumpToPreviousCut}
            className="p-1.5 bg-[#27272a] hover:bg-[#3f3f46] text-[#a1a1aa] hover:text-[#fafafa] transition-colors"
            title="Jump to Previous Cut (Home)"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={() => stepFrame(-1)}
            className="p-1.5 bg-[#27272a] hover:bg-[#3f3f46] text-[#a1a1aa] hover:text-[#fafafa] transition-colors"
            title="Step 1 Frame Backward (Left Arrow)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={onTogglePlay}
            className={cn(
              "px-4 py-1.5 font-bold transition-colors flex items-center gap-1.5 shadow-md",
              playhead.isPlaying
                ? "bg-[#f43f5e] hover:bg-[#e11d48] text-white"
                : "bg-[#3b82f6] hover:bg-[#2563eb] text-white"
            )}
            title="Play / Pause (Space)"
          >
            {playhead.isPlaying ? (
              <>
                <Pause className="w-4 h-4" />
                <span className="text-xs">PAUSE</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span className="text-xs">PLAY</span>
              </>
            )}
          </button>

          <button
            onClick={() => stepFrame(1)}
            className="p-1.5 bg-[#27272a] hover:bg-[#3f3f46] text-[#a1a1aa] hover:text-[#fafafa] transition-colors"
            title="Step 1 Frame Forward (Right Arrow)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={jumpToNextCut}
            className="p-1.5 bg-[#27272a] hover:bg-[#3f3f46] text-[#a1a1aa] hover:text-[#fafafa] transition-colors"
            title="Jump to Next Cut (End)"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Audio Volume & Mute */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 text-[#a1a1aa] hover:text-[#fafafa]"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-[#f43f5e]" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setVolume(val);
              setIsMuted(val === 0);
              if (videoRef.current) {
                videoRef.current.volume = val;
              }
            }}
            className="w-16 h-1 bg-[#27272a] rounded accent-[#3b82f6] cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
