"use client";

import React, { useState } from "react";
import {
  Film,
  Camera,
  Clapperboard,
  Sparkles,
  Flame,
  Edit3,
  Trash2,
  Copy,
  Check,
  Clock,
  Layers,
  MapPin,
  Users,
  Play,
  Maximize2,
} from "lucide-react";
import { Shot, Character, Location, Take } from "@/lib/db/schema";
import { calculateFrameLength } from "@/lib/comfy/graphCompiler";
import { cn } from "@/lib/utils";

interface ShotCardProps {
  shot: Shot;
  index: number;
  cumulativeStartTime?: number;
  characters: Character[];
  locations: Location[];
  takes?: Take[];
  fps?: number;
  isActive?: boolean;
  isRendering?: boolean;
  onSelect?: () => void;
  onEdit: (shot: Shot) => void;
  onDelete: (id: string) => void;
  onRender: (shot: Shot) => void;
  onOpenPromptDoctor?: (shot: Shot) => void;
}

export function ShotCard({
  shot,
  index,
  cumulativeStartTime = 0,
  characters,
  locations,
  takes = [],
  fps = 24,
  isActive = false,
  isRendering = false,
  onSelect,
  onEdit,
  onDelete,
  onRender,
  onOpenPromptDoctor,
}: ShotCardProps) {
  const [copied, setCopied] = useState(false);

  const duration = shot.duration || 5.0;
  const frameCount = calculateFrameLength(duration, fps);
  const endTime = cumulativeStartTime + duration;

  // Format seconds to HH:MM:SS:FF
  const formatTimecode = (sec: number) => {
    const totalFrames = Math.round(sec * fps);
    const f = totalFrames % fps;
    const totalSeconds = Math.floor(sec);
    const s = totalSeconds % 60;
    const m = Math.floor(totalSeconds / 60) % 60;
    const h = Math.floor(totalSeconds / 3600);
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(h)}:${pad(m)}:${pad(s)}:${pad(f)}`;
  };

  const startTimecode = formatTimecode(cumulativeStartTime);
  const endTimecode = formatTimecode(endTime);

  // Parse attached characters
  let attachedCharIds: string[] = [];
  try {
    if (shot.character_ids) {
      if (shot.character_ids.startsWith("[")) {
        attachedCharIds = JSON.parse(shot.character_ids);
      } else {
        attachedCharIds = [shot.character_ids];
      }
    }
  } catch {
    attachedCharIds = [];
  }

  const attachedChars = characters.filter((c) => attachedCharIds.includes(c.id));
  const attachedLocation = locations.find((l) => l.id === shot.location_id);

  // Latest take if any
  const latestTake = takes.length > 0 ? takes[0] : null;

  // Primary image thumbnail for shot
  const primaryCharImage = attachedChars[0]?.ref_sheet_path || attachedChars[0]?.ref_body_path;
  const primaryLocImage = attachedLocation?.ref_main_path || attachedLocation?.ref_alt_path;
  const previewImage = latestTake?.thumbnail_path || primaryCharImage || primaryLocImage;

  const getImageSrc = (val: string) => {
    if (val.startsWith("http://") || val.startsWith("https://") || val.startsWith("data:")) {
      return val;
    }
    if (val.startsWith("/vault/")) {
      return val;
    }
    return `/vault/${val}`;
  };

  const handleCopyPrompt = (e: React.MouseEvent) => {
    e.stopPropagation();
    const promptText = shot.action_notes || "Cinematic anime shot";
    navigator.clipboard.writeText(promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={onSelect}
      className={cn(
        "bg-[#121215] border transition-all font-mono group relative flex flex-col justify-between select-none",
        isActive
          ? "border-[#3b82f6] shadow-[0_0_15px_rgba(59,130,246,0.15)] ring-1 ring-[#3b82f6]"
          : "border-[#27272a] hover:border-[#3f3f46]"
      )}
    >
      {/* Top Header Strip */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#09090b] border-b border-[#27272a]">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 bg-[#3b82f6]/20 border border-[#3b82f6]/40 text-[#3b82f6] text-[10px] font-bold">
            SHOT {shot.shot_number.toString().padStart(2, "0")}
          </span>
          <span className="text-xs font-bold text-[#fafafa]">
            {shot.framing || "Medium Shot"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#a1a1aa] bg-[#18181b] px-1.5 py-0.5 border border-[#27272a]">
            {shot.camera_movement || "Static"}
          </span>
          <span
            className={cn(
              "px-1.5 py-0.5 text-[9px] font-bold border",
              isRendering
                ? "bg-[#f59e0b]/20 border-[#f59e0b]/40 text-[#f59e0b] animate-pulse"
                : takes.length > 0
                ? "bg-[#10b981]/15 border-[#10b981]/40 text-[#10b981]"
                : "bg-[#27272a] border-[#3f3f46] text-[#71717a]"
            )}
          >
            {isRendering
              ? "RENDERING"
              : takes.length > 0
              ? `${takes.length} TAKE${takes.length > 1 ? "S" : ""}`
              : "READY"}
          </span>
        </div>
      </div>

      {/* Main Card Content */}
      <div className="p-4 space-y-3.5 flex-1 flex flex-col justify-between">
        {/* Visual Preview Box */}
        <div
          onClick={() => onEdit(shot)}
          className="aspect-video bg-[#18181b] border border-[#27272a] relative overflow-hidden flex items-center justify-center cursor-pointer group/thumb"
        >
          {previewImage ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getImageSrc(previewImage)}
                alt={`Shot ${shot.shot_number}`}
                className="w-full h-full object-cover object-center group-hover/thumb:scale-105 transition-transform duration-300"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-transparent opacity-75 group-hover/thumb:opacity-90 transition-opacity" />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-[#71717a] space-y-1">
              <Film className="w-6 h-6 opacity-40" />
              <span className="text-[9px] text-[#52525b] uppercase">NO PREVIEW / TAKE</span>
            </div>
          )}

          {/* Timecode overlay badge */}
          <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1.5 bg-[#09090b]/85 px-2 py-0.5 border border-[#27272a] text-[9px] text-[#a1a1aa]">
            <Clock className="w-2.5 h-2.5 text-[#3b82f6]" />
            <span className="text-[#fafafa] font-bold">{duration.toFixed(1)}s</span>
            <span className="text-[#52525b]">|</span>
            <span className="text-[#10b981]">{frameCount}f</span>
          </div>

          {/* Timing range badge */}
          <div className="absolute top-2 left-2 z-10 bg-[#09090b]/85 px-1.5 py-0.5 border border-[#27272a] text-[8px] text-[#a1a1aa]">
            {startTimecode} - {endTimecode}
          </div>

          {/* Hover Edit Overlay Prompt */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover/thumb:opacity-100 transition-opacity z-20">
            <span className="px-2.5 py-1 bg-[#3b82f6] text-white text-[10px] font-bold tracking-wider uppercase flex items-center gap-1">
              <Edit3 className="w-3 h-3" />
              EDIT SHOT PARAMS
            </span>
          </div>
        </div>

        {/* Reference Tag Pills (Cast & Location) */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {attachedChars.map((char) => (
            <span
              key={char.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#3b82f6]/10 border border-[#3b82f6]/30 text-[#3b82f6] text-[9px] font-bold uppercase truncate max-w-[140px]"
            >
              <Users className="w-2.5 h-2.5 shrink-0" />
              <span className="truncate">{char.name}</span>
            </span>
          ))}

          {attachedLocation && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#10b981]/10 border border-[#10b981]/30 text-[#10b981] text-[9px] font-bold uppercase truncate max-w-[160px]">
              <MapPin className="w-2.5 h-2.5 shrink-0" />
              <span className="truncate">{attachedLocation.name}</span>
            </span>
          )}

          {attachedChars.length === 0 && !attachedLocation && (
            <span className="text-[9px] text-[#52525b] italic">
              No character or location anchor linked
            </span>
          )}
        </div>

        {/* Action Notes / Prompt */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] text-[#71717a]">
            <span className="font-bold uppercase tracking-wider text-[#a1a1aa]">
              ACTION & DIRECTION
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleCopyPrompt}
                className="p-0.5 hover:text-[#fafafa] text-[#71717a] transition-colors"
                title="Copy Prompt"
              >
                {copied ? <Check className="w-3 h-3 text-[#10b981]" /> : <Copy className="w-3 h-3" />}
              </button>
              {onOpenPromptDoctor && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenPromptDoctor(shot);
                  }}
                  className="text-[9px] text-[#3b82f6] hover:underline flex items-center gap-0.5"
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>DOCTOR</span>
                </button>
              )}
            </div>
          </div>
          <p className="text-xs text-[#d4d4d8] leading-relaxed line-clamp-3 bg-[#18181b]/50 p-2 border border-[#27272a] select-text">
            {shot.action_notes || "No action or camera description specified."}
          </p>
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#09090b] border-t border-[#27272a] text-[10px]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(shot)}
            className="flex items-center gap-1 text-[#a1a1aa] hover:text-[#fafafa] transition-colors"
          >
            <Edit3 className="w-3 h-3" />
            <span>EDIT</span>
          </button>
          <span className="text-[#27272a]">|</span>
          <button
            type="button"
            onClick={() => onDelete(shot.id)}
            className="flex items-center gap-1 text-[#71717a] hover:text-[#f43f5e] transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            <span>DELETE</span>
          </button>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRender(shot);
          }}
          disabled={isRendering}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors",
            isRendering
              ? "bg-[#18181b] border border-[#3f3f46] text-[#71717a] cursor-not-allowed"
              : "bg-[#f59e0b] hover:bg-[#d97706] text-black"
          )}
        >
          <Flame className="w-3 h-3" />
          <span>{isRendering ? "RENDERING..." : "RENDER"}</span>
        </button>
      </div>
    </div>
  );
}
