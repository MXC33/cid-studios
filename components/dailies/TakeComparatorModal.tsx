"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Columns,
  Grid,
  Lock,
  Unlock,
  Star,
  Check,
  X,
  Volume2,
  VolumeX,
  Film,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";
import { Take, Shot, Scene } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

interface EnrichedTake extends Take {
  parsed_metadata?: Record<string, any>;
  shot?: Shot;
  scene?: Scene;
}

interface TakeComparatorModalProps {
  takes: EnrichedTake[];
  initialTakeIds?: string[];
  isOpen: boolean;
  onClose: () => void;
  onSelectMaster?: (take: EnrichedTake) => void;
}

export function TakeComparatorModal({
  takes,
  initialTakeIds = [],
  isOpen,
  onClose,
  onSelectMaster,
}: TakeComparatorModalProps) {
  const [layoutMode, setLayoutMode] = useState<"2up" | "4up">("2up");
  const [syncLocked, setSyncLocked] = useState(true);

  // Selected take IDs in each slot (up to 4 slots)
  const [slotTakeIds, setSlotTakeIds] = useState<string[]>([]);

  // Video refs for synchronization
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([null, null, null, null]);

  // Master playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [maxDuration, setMaxDuration] = useState(3.0);
  const [fps, setFps] = useState(24);
  const [isMuted, setIsMuted] = useState(true);

  // Initialize slots
  useEffect(() => {
    if (!isOpen) return;

    let initialSlots: string[] = [];
    if (initialTakeIds.length > 0) {
      initialSlots = [...initialTakeIds];
    } else if (takes.length > 0) {
      initialSlots = takes.slice(0, 4).map((t) => t.id);
    }

    // Fill up to 4 slots if available
    while (initialSlots.length < 4 && takes.length > initialSlots.length) {
      const nextTake = takes.find((t) => !initialSlots.includes(t.id));
      if (nextTake) initialSlots.push(nextTake.id);
      else break;
    }

    setSlotTakeIds(initialSlots);
    setIsPlaying(false);
    setCurrentTime(0);
  }, [isOpen, initialTakeIds, takes]);

  // Synchronized Play / Pause
  const togglePlay = useCallback(() => {
    const nextPlayState = !isPlaying;
    setIsPlaying(nextPlayState);

    videoRefs.current.forEach((video) => {
      if (!video) return;
      if (nextPlayState) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, [isPlaying]);

  // Synchronized Frame Step
  const stepFrame = useCallback(
    (direction: number) => {
      setIsPlaying(false);
      const frameDuration = 1.0 / fps;
      const targetTime = Math.max(0, Math.min(maxDuration, currentTime + direction * frameDuration));
      setCurrentTime(targetTime);

      videoRefs.current.forEach((video) => {
        if (!video) return;
        video.pause();
        video.currentTime = targetTime;
      });
    },
    [fps, maxDuration, currentTime]
  );

  // Synchronized Scrubber
  const handleScrub = (time: number) => {
    setCurrentTime(time);
    if (syncLocked) {
      videoRefs.current.forEach((video) => {
        if (!video) return;
        video.currentTime = time;
      });
    }
  };

  // Synchronized Jump to Start
  const jumpToStart = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    videoRefs.current.forEach((video) => {
      if (!video) return;
      video.pause();
      video.currentTime = 0;
    });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLSelectElement) return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          stepFrame(-1);
          break;
        case "ArrowRight":
          e.preventDefault();
          stepFrame(1);
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, togglePlay, stepFrame, onClose]);

  if (!isOpen) return null;

  const activeSlotsCount = layoutMode === "2up" ? 2 : 4;
  const currentFrame = Math.floor(currentTime * fps);

  // Helper to format timecode
  const formatTimecode = (seconds: number) => {
    const totalFramesCount = Math.floor(seconds * fps);
    const frames = totalFramesCount % fps;
    const totalSecs = Math.floor(seconds);
    const s = totalSecs % 60;
    const m = Math.floor(totalSecs / 60) % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}:${frames.toString().padStart(2, "0")}`;
  };

  const handleSlotChange = (slotIndex: number, newTakeId: string) => {
    const updated = [...slotTakeIds];
    updated[slotIndex] = newTakeId;
    setSlotTakeIds(updated);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-150">
      <div className="bg-[#0c0c0e] border border-[#27272a] w-full max-w-7xl max-h-[96vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Comparator Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#121215] border-b border-[#27272a]">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 bg-[#3b82f6]/20 border border-[#3b82f6]/40 text-[#3b82f6] text-[10px] font-mono font-bold uppercase tracking-wider">
              MULTI-TAKE COMPARATOR
            </span>
            <div className="h-4 w-px bg-[#27272a]" />
            <h2 className="text-sm font-mono font-bold text-[#fafafa] tracking-wide">
              SYNCHRONIZED {layoutMode === "2up" ? "2-UP SPLIT" : "4-UP QUAD"} COMPARISON
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center border border-[#27272a] bg-[#18181b]">
              <button
                onClick={() => setLayoutMode("2up")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-bold uppercase transition-colors",
                  layoutMode === "2up"
                    ? "bg-[#3b82f6] text-white"
                    : "text-[#a1a1aa] hover:text-[#fafafa]"
                )}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>2-UP</span>
              </button>
              <button
                onClick={() => setLayoutMode("4up")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-bold uppercase transition-colors",
                  layoutMode === "4up"
                    ? "bg-[#3b82f6] text-white"
                    : "text-[#a1a1aa] hover:text-[#fafafa]"
                )}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>4-UP</span>
              </button>
            </div>

            {/* Sync Lock Toggle */}
            <button
              onClick={() => setSyncLocked(!syncLocked)}
              title={syncLocked ? "Lock Synchronized Playback" : "Independent Playback"}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-bold uppercase border transition-colors",
                syncLocked
                  ? "bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40"
                  : "bg-[#18181b] text-[#71717a] border-[#27272a]"
              )}
            >
              {syncLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              <span>{syncLocked ? "SYNC LOCKED" : "UNLOCKED"}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-[#a1a1aa] hover:text-[#fafafa] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Comparator Video Grid */}
        <div className="flex-1 p-4 bg-black overflow-y-auto">
          <div
            className={cn(
              "grid gap-4 h-full",
              layoutMode === "2up" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
            )}
          >
            {Array.from({ length: activeSlotsCount }).map((_, slotIdx) => {
              const takeId = slotTakeIds[slotIdx];
              const slotTake = takes.find((t) => t.id === takeId);
              const meta = slotTake?.parsed_metadata || (slotTake?.metadata ? JSON.parse(slotTake.metadata) : {});
              const videoSrc = slotTake?.video_path
                ? `/api/media?path=${encodeURIComponent(slotTake.video_path)}`
                : "";

              return (
                <div
                  key={slotIdx}
                  className="bg-[#121215] border border-[#27272a] flex flex-col justify-between overflow-hidden relative group"
                >
                  {/* Slot Header Selector */}
                  <div className="p-2.5 bg-[#18181b] border-b border-[#27272a] flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold text-[#3b82f6] px-1.5 py-0.5 bg-[#3b82f6]/10 border border-[#3b82f6]/30">
                      SLOT {slotIdx + 1}
                    </span>

                    <select
                      value={takeId || ""}
                      onChange={(e) => handleSlotChange(slotIdx, e.target.value)}
                      className="flex-1 bg-[#0c0c0e] border border-[#27272a] text-xs font-mono text-[#fafafa] px-2 py-1 focus:outline-none focus:border-[#3b82f6]"
                    >
                      <option value="" disabled>
                        Select Take to Compare...
                      </option>
                      {takes.map((t) => (
                        <option key={t.id} value={t.id}>
                          Take #{t.take_number.toString().padStart(2, "0")} — Seed: {t.seed} ({t.resolution})
                        </option>
                      ))}
                    </select>

                    {slotTake && (
                      <button
                        onClick={() => onSelectMaster && onSelectMaster(slotTake)}
                        title="Mark as Selected Master"
                        className={cn(
                          "p-1.5 border text-xs transition-colors",
                          meta.starred
                            ? "bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/40"
                            : "bg-[#09090b] text-[#71717a] border-[#27272a] hover:text-[#fafafa]"
                        )}
                      >
                        <Star className={cn("w-3.5 h-3.5", meta.starred && "fill-current")} />
                      </button>
                    )}
                  </div>

                  {/* Video Box */}
                  <div className="relative aspect-video bg-[#09090b] flex items-center justify-center overflow-hidden">
                    {videoSrc ? (
                      <video
                        ref={(el) => {
                          videoRefs.current[slotIdx] = el;
                        }}
                        src={videoSrc}
                        loop
                        muted={isMuted}
                        playsInline
                        onLoadedMetadata={(e) => {
                          const target = e.currentTarget;
                          if (target.duration > maxDuration) {
                            setMaxDuration(target.duration);
                          }
                        }}
                        onTimeUpdate={(e) => {
                          if (!isPlaying) return;
                          if (slotIdx === 0) {
                            setCurrentTime(e.currentTarget.currentTime);
                          }
                        }}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-center p-4 font-mono text-[#71717a] text-xs">
                        <Film className="w-8 h-8 text-[#3f3f46] mx-auto mb-1" />
                        <span>No take assigned</span>
                      </div>
                    )}

                    {/* Slot Overlay Stats */}
                    {slotTake && (
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/80 border border-[#27272a] text-[9px] font-mono text-[#fafafa]">
                        TAKE #{slotTake.take_number.toString().padStart(2, "0")} • SEED: {slotTake.seed}
                      </div>
                    )}
                  </div>

                  {/* Slot Metadata Card Footer */}
                  {slotTake && (
                    <div className="p-3 bg-[#0e0e11] border-t border-[#27272a] grid grid-cols-3 gap-1.5 text-[10px] font-mono">
                      <div>
                        <span className="text-[#71717a] block">STEPS</span>
                        <span className="text-[#10b981] font-bold">{slotTake.steps} Turbo</span>
                      </div>
                      <div>
                        <span className="text-[#71717a] block">LORA</span>
                        <span className="text-[#3b82f6] font-bold">
                          {meta.lora_strength !== undefined ? Number(meta.lora_strength).toFixed(2) : "1.00"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#71717a] block">RATING</span>
                        <span className="text-[#f59e0b] font-bold">
                          {meta.rating ? `★ ${meta.rating}/5` : "Unrated"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Master Synchronized Transport Footer */}
        <div className="p-4 bg-[#121215] border-t border-[#27272a] space-y-3 select-none">
          {/* Timeline Scrubber */}
          <div className="relative group">
            <input
              type="range"
              min={0}
              max={maxDuration || 3}
              step={1.0 / fps}
              value={currentTime}
              onChange={(e) => handleScrub(parseFloat(e.target.value))}
              className="w-full h-2 bg-[#27272a] accent-[#3b82f6] cursor-pointer"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Left Transport */}
            <div className="flex items-center gap-2">
              <button
                onClick={jumpToStart}
                title="Jump to Start"
                className="p-2 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-[#a1a1aa] hover:text-[#fafafa] text-xs font-mono transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => stepFrame(-1)}
                title="Step -1 Frame (Left Arrow)"
                className="flex items-center gap-1 px-3 py-1.5 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-[#fafafa] text-xs font-mono transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="text-[10px] font-bold">-1 FR</span>
              </button>

              <button
                onClick={togglePlay}
                title="Master Play / Pause (Space)"
                className="flex items-center gap-1.5 px-5 py-1.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs font-mono font-bold tracking-wider uppercase transition-colors shadow-lg"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    <span>PAUSE ALL</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                    <span>PLAY ALL</span>
                  </>
                )}
              </button>

              <button
                onClick={() => stepFrame(1)}
                title="Step +1 Frame (Right Arrow)"
                className="flex items-center gap-1 px-3 py-1.5 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-[#fafafa] text-xs font-mono transition-colors"
              >
                <span className="text-[10px] font-bold">+1 FR</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Timecode & Sync Status */}
            <div className="flex items-center gap-3 px-4 py-1.5 bg-[#09090b] border border-[#27272a] text-xs font-mono">
              <span className="text-[#3b82f6] font-bold">{formatTimecode(currentTime)}</span>
              <span className="text-[#3f3f46]">/</span>
              <span className="text-[#a1a1aa]">{formatTimecode(maxDuration)}</span>
              <span className="text-[#10b981] font-bold">[{currentFrame}F SYNCED]</span>
            </div>

            {/* Mute & Close */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={cn(
                  "p-2 border text-xs transition-colors",
                  isMuted
                    ? "bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/40"
                    : "bg-[#18181b] text-[#fafafa] border-[#27272a]"
                )}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={onClose}
                className="px-4 py-1.5 bg-[#18181b] hover:bg-[#27272a] border border-[#3f3f46] text-[#fafafa] text-xs font-mono font-bold uppercase transition-colors"
              >
                CLOSE COMPARATOR
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
