"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Edit2,
  Trash2,
  Copy,
  Check,
  Volume2,
  Image as ImageIcon,
  CheckCircle2,
  CircleDashed,
} from "lucide-react";
import { Character } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

interface CharacterCardProps {
  character: Character;
  onEdit: (character: Character) => void;
  onDelete: (id: string) => void;
}

export function CharacterCard({ character, onEdit, onDelete }: CharacterCardProps) {
  const [copied, setCopied] = useState(false);

  // Compute filled reference slots count
  const slots = [
    { label: "ANGLES", filled: Boolean(character.ref_sheet_path), path: character.ref_sheet_path },
    { label: "BODY", filled: Boolean(character.ref_body_path), path: character.ref_body_path },
    { label: "ACTION", filled: Boolean(character.ref_action_path), path: character.ref_action_path },
    { label: "EXPR", filled: Boolean(character.ref_expression_path), path: character.ref_expression_path },
  ];

  const filledCount = slots.filter((s) => s.filled).length;

  // Primary preview image priority: Turnaround -> Body -> Action -> Expression
  const primaryImage =
    character.ref_sheet_path ||
    character.ref_body_path ||
    character.ref_action_path ||
    character.ref_expression_path;

  const getImageSrc = (val: string) => {
    if (val.startsWith("http://") || val.startsWith("https://") || val.startsWith("data:")) {
      return val;
    }
    if (val.startsWith("/vault/")) {
      return val;
    }
    return `/vault/${val}`;
  };

  const getRoleBadge = (role?: string | null) => {
    const r = (role || "LEAD").toUpperCase();
    if (r.includes("LEAD") || r.includes("HERO")) {
      return { label: r, style: "bg-[#3b82f6]/15 border-[#3b82f6]/40 text-[#3b82f6]" };
    }
    if (r.includes("SUPPORT") || r.includes("HANDLER")) {
      return { label: r, style: "bg-[#10b981]/15 border-[#10b981]/40 text-[#10b981]" };
    }
    if (r.includes("ANTAGONIST") || r.includes("ENEMY") || r.includes("DRONE")) {
      return { label: r, style: "bg-[#f59e0b]/15 border-[#f59e0b]/40 text-[#f59e0b]" };
    }
    return { label: r, style: "bg-[#71717a]/15 border-[#71717a]/40 text-[#a1a1aa]" };
  };

  const roleInfo = getRoleBadge(character.role);

  const handleCopyPrompt = (e: React.MouseEvent) => {
    e.stopPropagation();
    const prompt = `Masterpiece anime keyframe of ${character.name}, ${character.role || "Lead"}. ${character.description || ""}. High facial fidelity, consistent turnaround geometry, 8k resolution, cinematic lighting.`;
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#121215] border border-[#27272a] hover:border-[#3f3f46] transition-all p-4 space-y-3.5 font-mono group relative flex flex-col justify-between">
      {/* Top Image Preview Box */}
      <div
        onClick={() => onEdit(character)}
        className="aspect-[3/4] bg-[#18181b] border border-[#27272a] flex flex-col items-center justify-center relative overflow-hidden cursor-pointer"
      >
        {primaryImage ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getImageSrc(primaryImage)}
              alt={character.name}
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
            <span className="text-[10px] text-[#71717a] uppercase">NO REFERENCE LOADED</span>
          </div>
        )}

        {/* Top Floating Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
          <span className={cn("px-1.5 py-0.5 border text-[9px] font-bold uppercase", roleInfo.style)}>
            {roleInfo.label}
          </span>
          <span
            className={cn(
              "px-1.5 py-0.5 border text-[9px] font-bold",
              filledCount === 4
                ? "bg-[#10b981]/20 border-[#10b981]/40 text-[#10b981]"
                : filledCount > 0
                ? "bg-[#f59e0b]/20 border-[#f59e0b]/40 text-[#f59e0b]"
                : "bg-[#71717a]/20 border-[#71717a]/40 text-[#71717a]"
            )}
          >
            {filledCount}/4 ANGLES
          </span>
        </div>

        {/* Bottom Slot Dots Indicator Strip */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[9px] z-10 bg-[#09090b]/80 px-2 py-1 border border-[#27272a]">
          <div className="flex items-center gap-2">
            {slots.map((s, idx) => (
              <div key={idx} className="flex items-center gap-1" title={`${s.label}: ${s.path || "Empty"}`}>
                {s.filled ? (
                  <CheckCircle2 className="w-2.5 h-2.5 text-[#10b981]" />
                ) : (
                  <CircleDashed className="w-2.5 h-2.5 text-[#52525b]" />
                )}
                <span className={cn("text-[8px]", s.filled ? "text-[#fafafa]" : "text-[#52525b]")}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Character Details */}
      <div className="space-y-2 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2">
            <h3
              onClick={() => onEdit(character)}
              className="font-bold text-sm text-[#fafafa] hover:text-[#3b82f6] cursor-pointer transition-colors truncate"
            >
              {character.name}
            </h3>
            <button
              type="button"
              onClick={handleCopyPrompt}
              className="p-1 hover:bg-[#18181b] border border-transparent hover:border-[#27272a] text-[#71717a] hover:text-[#10b981] transition-colors"
              title="Copy Compiled Prompt"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#10b981]" /> : <Sparkles className="w-3.5 h-3.5" />}
            </button>
          </div>

          <p className="text-xs text-[#a1a1aa] mt-1 line-clamp-2 leading-relaxed">
            {character.description || "No visual appearance description recorded."}
          </p>
        </div>

        {/* Voice Profile Line */}
        {character.voice_profile && (
          <div className="flex items-center gap-1.5 text-[10px] text-[#71717a] bg-[#18181b] px-2 py-1 border border-[#27272a] truncate">
            <Volume2 className="w-3 h-3 text-[#3b82f6] shrink-0" />
            <span className="truncate">{character.voice_profile}</span>
          </div>
        )}

        {/* Actions Strip */}
        <div className="flex items-center justify-between pt-2 border-t border-[#27272a] text-[10px]">
          <button
            type="button"
            onClick={() => onEdit(character)}
            className="flex items-center gap-1 text-[#a1a1aa] hover:text-[#fafafa] transition-colors"
          >
            <Edit2 className="w-3 h-3" />
            <span>EDIT SLOTS</span>
          </button>

          <button
            type="button"
            onClick={() => onDelete(character.id)}
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
