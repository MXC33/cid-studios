"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Repeat,
  Star,
  Film,
  Sparkles,
  Layers,
  Sliders,
  Clock,
  Check,
  Download,
  Share2,
  Maximize2,
  X,
  Send,
  Cpu,
  Info,
} from "lucide-react";
import { Take, Shot, Scene } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

interface EnrichedTake extends Take {
  parsed_metadata?: Record<string, any>;
  shot?: Shot;
  scene?: Scene;
}

interface TakePlayerModalProps {
  take: EnrichedTake | null;
  isOpen: boolean;
  onClose: () => void;
  onTakeUpdated?: (updatedTake: EnrichedTake) => void;
  onSendToTimeline?: (take: EnrichedTake) => void;
}

export function TakePlayerModal({
  take,
  isOpen,
  onClose,
  onTakeUpdated,
  onSendToTimeline,
}: TakePlayerModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isLooping, setIsLooping] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1.0);

  // Metadata & Review states
  const metadata = take?.parsed_metadata || (take?.metadata ? JSON.parse(take.metadata) : {});
  const fps = metadata.fps || 24;
  const totalFrames = metadata.total_frames || Math.round((take?.duration || 3.0) * fps);
  const currentFrame = Math.floor(currentTime * fps);

  const [rating, setRating] = useState<number>(metadata.rating || 0);
  const [isStarred, setIsStarred] = useState<boolean>(Boolean(metadata.starred));
  const [notes, setNotes] = useState<string>(metadata.director_notes || "");
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [timelineSent, setTimelineSent] = useState(false);

  // Update local state when take changes
  useEffect(() => {
    if (take) {
      const meta = take.parsed_metadata || (take.metadata ? JSON.parse(take.metadata) : {});
      setRating(meta.rating || 0);
      setIsStarred(Boolean(meta.starred));
      setNotes(meta.director_notes || "");
      setCurrentTime(0);
      setIsPlaying(false);
      setTimelineSent(false);
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
      }
    }
  }, [take]);

  // Handle Play/Pause
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  // Frame Accurate Step: +/- 1 frame (1/fps seconds)
  const stepFrame = useCallback((direction: number) => {
    if (!videoRef.current) return;
    videoRef.current.pause();
    setIsPlaying(false);
    const frameDuration = 1.0 / fps;
    let target = videoRef.current.currentTime + direction * frameDuration;
    if (target < 0) target = 0;
    if (duration > 0 && target > duration) target = duration;
    videoRef.current.currentTime = target;
    setCurrentTime(target);
  }, [fps, duration]);

  // Jump to start
  const jumpToStart = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    setCurrentTime(0);
  }, []);

  // Time formatting helper: HH:MM:SS:FF
  const formatTimecode = (seconds: number) => {
    const totalFramesCount = Math.floor(seconds * fps);
    const frames = totalFramesCount % fps;
    const totalSecs = Math.floor(seconds);
    const s = totalSecs % 60;
    const m = Math.floor(totalSecs / 60) % 60;
    const h = Math.floor(totalSecs / 3600);
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}:${frames.toString().padStart(2, "0")}`;
  };

  // Speed multiplier cycle
  const cyclePlaybackRate = () => {
    const rates = [0.25, 0.5, 1.0, 1.5, 2.0];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextRate;
    }
  };

  // Save notes & rating to DB
  const saveReview = async (newRating?: number, newStarred?: boolean, newNotes?: string) => {
    if (!take) return;
    setIsSaving(true);
    setSavedSuccess(false);
    try {
      const res = await fetch("/api/takes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: take.id,
          rating: newRating !== undefined ? newRating : rating,
          starred: newStarred !== undefined ? newStarred : isStarred,
          director_notes: newNotes !== undefined ? newNotes : notes,
        }),
      });
      const data = await res.json();
      if (data.success && data.take) {
        setSavedSuccess(true);
        if (onTakeUpdated) onTakeUpdated(data.take);
        setTimeout(() => setSavedSuccess(false), 2000);
      }
    } catch (err) {
      console.error("Failed to save take review:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRatingClick = (starValue: number) => {
    const newRating = rating === starValue ? 0 : starValue;
    setRating(newRating);
    saveReview(newRating, isStarred, notes);
  };

  const handleStarToggle = () => {
    const nextStarred = !isStarred;
    setIsStarred(nextStarred);
    saveReview(rating, nextStarred, notes);
  };

  const handleSendToTimeline = async () => {
    if (!take) return;
    setTimelineSent(true);
    // Persist timeline selection flag
    await saveReview(rating, true, notes);
    if (onSendToTimeline) onSendToTimeline(take);
    setTimeout(() => setTimelineSent(false), 3000);
  };

  // Keyboard controls
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in the textarea
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
        return;
      }

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
        case "KeyM":
          e.preventDefault();
          setIsMuted((prev) => !prev);
          break;
        case "KeyL":
          e.preventDefault();
          setIsLooping((prev) => !prev);
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

  if (!isOpen || !take) return null;

  const videoSource = take.video_path
    ? `/api/media?path=${encodeURIComponent(take.video_path)}`
    : "";

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-150">
      <div className="bg-[#0c0c0e] border border-[#27272a] w-full max-w-6xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#121215] border-b border-[#27272a]">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 bg-[#f59e0b]/20 border border-[#f59e0b]/40 text-[#f59e0b] text-[10px] font-mono font-bold uppercase tracking-wider">
              DAILIES TAKE PLAYER
            </span>
            <div className="h-4 w-px bg-[#27272a]" />
            <h2 className="text-sm font-mono font-bold text-[#fafafa] tracking-wide">
              TAKE #{take.take_number.toString().padStart(2, "0")} —{" "}
              {take.shot ? `SHOT ${take.shot.shot_number}` : "STUDIO TAKE"}
            </h2>
            {take.scene && (
              <span className="text-xs font-mono text-[#71717a] hidden sm:inline">
                [SCENE {take.scene.scene_number}: {take.scene.title}]
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleStarToggle}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-bold uppercase border transition-colors",
                isStarred
                  ? "bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/40"
                  : "bg-[#18181b] text-[#a1a1aa] border-[#27272a] hover:border-[#3f3f46]"
              )}
            >
              <Star className={cn("w-3.5 h-3.5", isStarred && "fill-current")} />
              <span>{isStarred ? "★ STARRED SELECT" : "STAR TAKE"}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-[#a1a1aa] hover:text-[#fafafa] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 overflow-y-auto">
          {/* Main Video Viewport & Controls */}
          <div className="lg:col-span-2 flex flex-col bg-black border-b lg:border-b-0 lg:border-r border-[#27272a]">
            <div className="relative aspect-video bg-[#09090b] flex items-center justify-center overflow-hidden select-none">
              {videoSource ? (
                <video
                  ref={videoRef}
                  src={videoSource}
                  loop={isLooping}
                  muted={isMuted}
                  playsInline
                  onTimeUpdate={() => {
                    if (videoRef.current) {
                      setCurrentTime(videoRef.current.currentTime);
                    }
                  }}
                  onLoadedMetadata={() => {
                    if (videoRef.current) {
                      setDuration(videoRef.current.duration);
                    }
                  }}
                  onEnded={() => {
                    if (!isLooping) setIsPlaying(false);
                  }}
                  onClick={togglePlay}
                  className="w-full h-full object-contain cursor-pointer"
                />
              ) : (
                <div className="text-center p-8 space-y-2 font-mono">
                  <Film className="w-12 h-12 text-[#3f3f46] mx-auto" />
                  <p className="text-xs text-[#71717a]">No video file attached to this take.</p>
                </div>
              )}

              {/* Central Play Overlay Button */}
              {!isPlaying && videoSource && (
                <button
                  onClick={togglePlay}
                  className="absolute w-16 h-16 bg-[#18181b]/90 hover:bg-[#27272a] border border-[#3f3f46] flex items-center justify-center text-[#fafafa] hover:text-[#3b82f6] shadow-2xl transition-all"
                >
                  <Play className="w-8 h-8 fill-current ml-1" />
                </button>
              )}

              {/* Video Overlay Watermark / HUD */}
              <div className="absolute top-3 left-3 px-2 py-0.5 bg-black/80 border border-[#27272a] text-[10px] font-mono text-[#3b82f6] flex items-center gap-2 pointer-events-none">
                <span className="w-1.5 h-1.5 bg-[#3b82f6] animate-pulse" />
                <span>REC {formatTimecode(currentTime)}</span>
              </div>

              <div className="absolute top-3 right-3 px-2 py-0.5 bg-black/80 border border-[#27272a] text-[10px] font-mono text-[#a1a1aa] pointer-events-none">
                FRAME {currentFrame} / {totalFrames}
              </div>
            </div>

            {/* Brutalist Scrubber Bar */}
            <div className="px-4 pt-3 pb-1 bg-[#121215] border-t border-[#27272a]">
              <div className="relative group cursor-pointer">
                <input
                  type="range"
                  min={0}
                  max={duration || 1}
                  step={1.0 / fps}
                  value={currentTime}
                  onChange={(e) => {
                    const time = parseFloat(e.target.value);
                    setCurrentTime(time);
                    if (videoRef.current) {
                      videoRef.current.currentTime = time;
                    }
                  }}
                  className="w-full h-2 bg-[#27272a] accent-[#3b82f6] cursor-pointer"
                />
              </div>
            </div>

            {/* Brutalist Transport Controls */}
            <div className="p-4 bg-[#121215] flex flex-wrap items-center justify-between gap-3 select-none">
              {/* Left: Transport Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={jumpToStart}
                  title="Jump to Start (Frame 0)"
                  className="p-2 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-[#a1a1aa] hover:text-[#fafafa] text-xs font-mono transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => stepFrame(-1)}
                  title="Step -1 Frame (Left Arrow)"
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-[#fafafa] text-xs font-mono transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="text-[10px] font-bold">-1 FR</span>
                </button>

                <button
                  onClick={togglePlay}
                  title="Play / Pause (Space)"
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs font-mono font-bold tracking-wider uppercase transition-colors"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 fill-current" />
                      <span>PAUSE</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                      <span>PLAY</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => stepFrame(1)}
                  title="Step +1 Frame (Right Arrow)"
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-[#fafafa] text-xs font-mono transition-colors"
                >
                  <span className="text-[10px] font-bold">+1 FR</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Center: Timecode & Frame Indicator */}
              <div className="flex items-center gap-3 px-3 py-1 bg-[#09090b] border border-[#27272a] text-xs font-mono">
                <span className="text-[#3b82f6] font-bold">{formatTimecode(currentTime)}</span>
                <span className="text-[#3f3f46]">/</span>
                <span className="text-[#a1a1aa]">{formatTimecode(duration || take.duration)}</span>
                <span className="text-[#71717a] text-[10px]">[{currentFrame}F]</span>
              </div>

              {/* Right: Aux Controls (Speed, Loop, Audio) */}
              <div className="flex items-center gap-2">
                <button
                  onClick={cyclePlaybackRate}
                  title="Playback Speed Multiplier"
                  className="px-2 py-1 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-[11px] font-mono font-bold text-[#fafafa] transition-colors"
                >
                  {playbackRate}x
                </button>

                <button
                  onClick={() => setIsLooping(!isLooping)}
                  title="Loop Playback (L)"
                  className={cn(
                    "p-2 border text-xs transition-colors",
                    isLooping
                      ? "bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40"
                      : "bg-[#18181b] text-[#71717a] border-[#27272a] hover:text-[#fafafa]"
                  )}
                >
                  <Repeat className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setIsMuted(!isMuted)}
                  title="Mute / Unmute (M)"
                  className={cn(
                    "p-2 border text-xs transition-colors",
                    isMuted
                      ? "bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/40"
                      : "bg-[#18181b] text-[#fafafa] border-[#27272a] hover:border-[#3f3f46]"
                  )}
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel: Technical Specs & Review */}
          <div className="p-5 bg-[#0e0e11] space-y-5 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-5">
              {/* Technical Metadata Box */}
              <div>
                <div className="flex items-center gap-2 pb-2 border-b border-[#27272a]">
                  <Cpu className="w-4 h-4 text-[#3b82f6]" />
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#fafafa]">
                    TECHNICAL TELEMETRY
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 font-mono text-xs">
                  <div className="p-2.5 bg-[#121215] border border-[#27272a]">
                    <span className="text-[10px] text-[#71717a] uppercase block">RESOLUTION</span>
                    <span className="font-bold text-[#fafafa]">{take.resolution}</span>
                  </div>

                  <div className="p-2.5 bg-[#121215] border border-[#27272a]">
                    <span className="text-[10px] text-[#71717a] uppercase block">FRAME RATE</span>
                    <span className="font-bold text-[#fafafa]">{fps.toFixed(2)} FPS</span>
                  </div>

                  <div className="p-2.5 bg-[#121215] border border-[#27272a]">
                    <span className="text-[10px] text-[#71717a] uppercase block">TOTAL FRAMES</span>
                    <span className="font-bold text-[#fafafa]">{totalFrames} Frames</span>
                  </div>

                  <div className="p-2.5 bg-[#121215] border border-[#27272a]">
                    <span className="text-[10px] text-[#71717a] uppercase block">LORA STRENGTH</span>
                    <span className="font-bold text-[#3b82f6]">
                      {metadata.lora_strength !== undefined ? Number(metadata.lora_strength).toFixed(2) : "1.00"}
                    </span>
                  </div>

                  <div className="p-2.5 bg-[#121215] border border-[#27272a]">
                    <span className="text-[10px] text-[#71717a] uppercase block">DIFFUSION SEED</span>
                    <span className="font-bold text-[#fafafa] truncate block" title={String(take.seed)}>
                      {take.seed}
                    </span>
                  </div>

                  <div className="p-2.5 bg-[#121215] border border-[#27272a]">
                    <span className="text-[10px] text-[#71717a] uppercase block">TURBO STEPS</span>
                    <span className="font-bold text-[#10b981]">{take.steps} Steps</span>
                  </div>
                </div>

                {metadata.sampler_name && (
                  <div className="mt-2 p-2 bg-[#121215] border border-[#27272a] text-[10px] font-mono text-[#a1a1aa] flex items-center justify-between">
                    <span>SAMPLER / SCHEDULER</span>
                    <span className="text-[#fafafa]">
                      {metadata.sampler_name} / {metadata.scheduler || "simple"}
                    </span>
                  </div>
                )}
              </div>

              {/* Star Rating Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#a1a1aa]">
                    DIRECTOR RATING
                  </span>
                  <span className="text-[10px] font-mono text-[#f59e0b] font-bold">
                    {rating > 0 ? `${rating} / 5 STARS` : "UNRATED"}
                  </span>
                </div>

                <div className="flex items-center gap-2 p-3 bg-[#121215] border border-[#27272a] justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRatingClick(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={cn(
                          "w-6 h-6 transition-colors",
                          star <= rating
                            ? "text-[#f59e0b] fill-[#f59e0b]"
                            : "text-[#3f3f46] hover:text-[#71717a]"
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Director Notes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#a1a1aa]">
                    DIRECTOR & QA NOTES
                  </span>
                  {savedSuccess && (
                    <span className="text-[10px] font-mono text-[#10b981] flex items-center gap-1">
                      <Check className="w-3 h-3" /> SAVED
                    </span>
                  )}
                </div>

                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={() => saveReview()}
                  placeholder="Record continuity observations, facial consistency score, or color grading notes..."
                  rows={4}
                  className="w-full p-3 bg-[#121215] border border-[#27272a] text-xs font-mono text-[#fafafa] placeholder-[#52525b] focus:outline-none focus:border-[#3b82f6] resize-none"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-4 border-t border-[#27272a]">
              <button
                onClick={handleSendToTimeline}
                disabled={timelineSent}
                className={cn(
                  "w-full py-3 px-4 text-xs font-mono font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors",
                  timelineSent
                    ? "bg-[#10b981] text-black"
                    : "bg-[#f59e0b] hover:bg-[#d97706] text-black shadow-lg"
                )}
              >
                {timelineSent ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>ASSIGNED TO NLE TIMELINE</span>
                  </>
                ) : (
                  <>
                    <Film className="w-4 h-4" />
                    <span>SEND TO NLE TIMELINE</span>
                  </>
                )}
              </button>

              <button
                onClick={() => saveReview()}
                disabled={isSaving}
                className="w-full py-2 bg-[#18181b] hover:bg-[#27272a] border border-[#3f3f46] text-[#fafafa] text-xs font-mono uppercase tracking-wider transition-colors"
              >
                {isSaving ? "SAVING..." : "SAVE REVIEW METADATA"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
