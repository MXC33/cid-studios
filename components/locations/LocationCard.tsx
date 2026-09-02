"use client";

import React, { useState } from "react";
import {
  MapPin,
  Sparkles,
  Edit2,
  Trash2,
  Copy,
  Check,
  Sun,
  Moon,
  Sunset,
  CloudFog,
  Zap,
  Image as ImageIcon,
  Layers,
} from "lucide-react";
import { Location } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

interface LocationCardProps {
  location: Location;
  onEdit: (location: Location) => void;
  onDelete: (id: string) => void;
}

export function LocationCard({ location, onEdit, onDelete }: LocationCardProps) {
  const [copied, setCopied] = useState(false);
  const [showingAlt, setShowingAlt] = useState(false);

  const getImageSrc = (val: string) => {
    if (val.startsWith("http://") || val.startsWith("https://") || val.startsWith("data:")) {
      return val;
    }
    if (val.startsWith("/vault/")) {
      return val;
    }
    return `/vault/${val}`;
  };

  const currentImage = showingAlt && location.ref_alt_path ? location.ref_alt_path : location.ref_main_path;

  const getLightingBadge = (tod?: string | null) => {
    const t = (tod || "Night").toLowerCase();
    if (t.includes("day") || t.includes("sun")) {
      return { label: tod || "DAYLIGHT", icon: Sun, style: "bg-[#10b981]/15 border-[#10b981]/40 text-[#10b981]" };
    }
    if (t.includes("golden") || t.includes("sunset")) {
      return { label: tod || "GOLDEN HOUR", icon: Sunset, style: "bg-[#f97316]/15 border-[#f97316]/40 text-[#f97316]" };
    }
    if (t.includes("cyan") || t.includes("server") || t.includes("interior")) {
      return { label: tod || "CYAN INTERIOR", icon: Zap, style: "bg-[#06b6d4]/15 border-[#06b6d4]/40 text-[#06b6d4]" };
    }
    if (t.includes("fog") || t.includes("rain") || t.includes("mist")) {
      return { label: tod || "MOODY FOG", icon: CloudFog, style: "bg-[#3b82f6]/15 border-[#3b82f6]/40 text-[#3b82f6]" };
    }
    return { label: tod || "NIGHT NEON", icon: Moon, style: "bg-[#f59e0b]/15 border-[#f59e0b]/40 text-[#f59e0b]" };
  };

  const lighting = getLightingBadge(location.time_of_day);
  const LightingIcon = lighting.icon;

  const handleCopyPrompt = (e: React.MouseEvent) => {
    e.stopPropagation();
    const prompt = `Cinematic master shot of ${location.name}. ${location.description || ""}. Atmosphere: ${location.time_of_day || "Night"}, volumetric lighting, 8k resolution, photorealistic cinematic reflections.`;
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#121215] border border-[#27272a] hover:border-[#3f3f46] transition-all p-4 space-y-3.5 font-mono group relative flex flex-col justify-between">
      {/* Visual Preview Box */}
      <div
        onClick={() => onEdit(location)}
        className="aspect-video bg-[#18181b] border border-[#27272a] flex items-center justify-center relative overflow-hidden cursor-pointer"
      >
        {currentImage ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getImageSrc(currentImage)}
              alt={location.name}
              className="w-full h-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-4 text-[#71717a] space-y-2">
            <ImageIcon className="w-8 h-8 opacity-40" />
            <span className="text-[10px] text-[#71717a] uppercase">NO ENVIRONMENT LOADED</span>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
          <div className={cn("flex items-center gap-1 px-1.5 py-0.5 border text-[9px] font-bold uppercase", lighting.style)}>
            <LightingIcon className="w-3 h-3" />
            <span className="truncate max-w-[140px]">{lighting.label}</span>
          </div>

          {location.ref_alt_path && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowingAlt(!showingAlt);
              }}
              className="px-1.5 py-0.5 bg-[#09090b]/90 hover:bg-[#18181b] border border-[#27272a] text-[8px] font-bold text-[#3b82f6] transition-colors flex items-center gap-1"
              title="Toggle Main/Alt Angle"
            >
              <Layers className="w-2.5 h-2.5" />
              <span>{showingAlt ? "ALT VIEW" : "MAIN VIEW"}</span>
            </button>
          )}
        </div>

        {/* Bottom Filename / Dimensions Bar */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[10px] z-10 bg-[#09090b]/80 px-2 py-1 border border-[#27272a]">
          <span className="text-[#fafafa] truncate max-w-[180px]">
            {currentImage || "EMPTY_SLOT"}
          </span>
          <span className="text-[#3b82f6] text-[9px]">
            {location.ref_main_path && location.ref_alt_path ? "2/2 ANGLES" : "1/2 ANGLE"}
          </span>
        </div>
      </div>

      {/* Location Meta Details */}
      <div className="space-y-2 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2">
            <h3
              onClick={() => onEdit(location)}
              className="font-bold text-sm text-[#fafafa] hover:text-[#3b82f6] cursor-pointer transition-colors truncate"
            >
              {location.name}
            </h3>
            <button
              type="button"
              onClick={handleCopyPrompt}
              className="p-1 hover:bg-[#18181b] border border-transparent hover:border-[#27272a] text-[#71717a] hover:text-[#3b82f6] transition-colors"
              title="Copy Environmental Prompt"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#3b82f6]" /> : <Sparkles className="w-3.5 h-3.5" />}
            </button>
          </div>

          <p className="text-xs text-[#a1a1aa] mt-1 line-clamp-2 leading-relaxed">
            {location.description || "No architectural description recorded."}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-[#27272a] text-[10px]">
          <button
            type="button"
            onClick={() => onEdit(location)}
            className="flex items-center gap-1 text-[#a1a1aa] hover:text-[#fafafa] transition-colors"
          >
            <Edit2 className="w-3 h-3" />
            <span>EDIT SET</span>
          </button>

          <button
            type="button"
            onClick={() => onDelete(location.id)}
            className="flex items-center gap-1 text-[#71717a] hover:text-[#f43f5e] transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            <span>REMOVE</span>
          </button>
        </div>
      </div>
    </div>
  );
}
