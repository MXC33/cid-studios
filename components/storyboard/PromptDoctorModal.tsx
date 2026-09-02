"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  Copy,
  Check,
  Flame,
  Wand2,
  CheckCircle2,
  AlertTriangle,
  Info,
  Terminal,
  Layers,
  Volume2,
  Camera,
  MapPin,
  Users,
} from "lucide-react";
import { Shot, Character, Location } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

interface PromptDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  shot?: Shot | null;
  characters: Character[];
  locations: Location[];
  onApplyPrompt?: (updatedActionNotes: string) => void;
  onRenderNow?: (payload: any) => void;
}

export function PromptDoctorModal({
  isOpen,
  onClose,
  shot,
  characters,
  locations,
  onApplyPrompt,
  onRenderNow,
}: PromptDoctorModalProps) {
  const [actionPrompt, setActionPrompt] = useState("");
  const [framingPrompt, setFramingPrompt] = useState("");
  const [cameraPrompt, setCameraPrompt] = useState("");
  const [foleyPrompt, setFoleyPrompt] = useState("");
  const [stylePreset, setStylePreset] = useState("Cyberpunk Anime Keyframe");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (shot) {
      setActionPrompt(shot.action_notes || "");
      setFramingPrompt(shot.framing || "Medium Shot");
      setCameraPrompt(shot.camera_movement || "Static");
    } else {
      setActionPrompt("Shampoo walks gracefully past glowing anime merchandise shelves, smiling cheerfully.");
      setFramingPrompt("Medium Shot");
      setCameraPrompt("Slow Push-In");
    }
  }, [shot, isOpen]);

  if (!isOpen) return null;

  // Resolve attached characters and locations
  let attachedCharIds: string[] = [];
  try {
    if (shot?.character_ids) {
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
  const attachedLoc = locations.find((l) => l.id === shot?.location_id);

  // Compile structured prompt
  const compiledFullPrompt = [
    `${framingPrompt}, ${cameraPrompt}.`,
    actionPrompt,
    attachedChars.length > 0
      ? `Cast: ${attachedChars.map((c) => `${c.name} (${c.role || "Lead"}: ${c.description || ""})`).join(". ")}.`
      : "",
    attachedLoc
      ? `Environment: ${attachedLoc.name} (${attachedLoc.time_of_day || "Night / Neon"}: ${attachedLoc.description || ""}).`
      : "",
    `Style: ${stylePreset}, masterpiece anime quality, 8k resolution, crisp turnaround geometry, volumetric lighting, photorealistic surface reflections.`,
  ]
    .filter(Boolean)
    .join(" ");

  // Prompt Doctor analysis diagnostics
  const wordCount = compiledFullPrompt.split(/\s+/).filter(Boolean).length;
  const hasAction = actionPrompt.trim().length > 10;
  const hasCast = attachedChars.length > 0;
  const hasLocation = Boolean(attachedLoc);
  const hasFraming = Boolean(framingPrompt && framingPrompt !== "Static");

  const score = [hasAction, hasCast, hasLocation, hasFraming].filter(Boolean).length;
  const healthGrade = score >= 4 ? "OPTIMAL" : score >= 2 ? "MODERATE" : "NEEDS ANCHORS";

  const handleCopy = () => {
    navigator.clipboard.writeText(compiledFullPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    if (onApplyPrompt) {
      onApplyPrompt(actionPrompt);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#121215] border border-[#27272a] w-full max-w-4xl my-8 overflow-hidden shadow-2xl font-mono">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272a] bg-[#09090b]">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-[#f59e0b]/10 border border-[#f59e0b]/30 text-[#f59e0b]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#fafafa] uppercase">
                  PROMPT DOCTOR // MINIMAX H3 COMPILER & SYNTAX ANALYZER
                </span>
                <span
                  className={cn(
                    "px-1.5 py-0.2 text-[9px] font-bold border",
                    healthGrade === "OPTIMAL"
                      ? "bg-[#10b981]/20 border-[#10b981]/40 text-[#10b981]"
                      : "bg-[#f59e0b]/20 border-[#f59e0b]/40 text-[#f59e0b]"
                  )}
                >
                  {healthGrade} ({score}/4 ANCHORS)
                </span>
              </div>
              <p className="text-[10px] text-[#71717a]">
                Structured prompt optimizer tailored for Qwen3-VL text/vision conditioning and Turbo 4-step diffusion
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#71717a] hover:text-[#fafafa] hover:bg-[#18181b] border border-[#27272a] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Diagnostics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-[#09090b] border border-[#27272a] space-y-1">
              <span className="text-[9px] text-[#71717a] uppercase font-bold">PROMPT WORDS</span>
              <div className="text-sm font-bold text-[#fafafa]">{wordCount} WORDS</div>
              <span className="text-[8px] text-[#10b981]">~{Math.round(wordCount * 1.3)} Qwen Tokens</span>
            </div>

            <div className="p-3 bg-[#09090b] border border-[#27272a] space-y-1">
              <span className="text-[9px] text-[#71717a] uppercase font-bold">CHARACTER FIDELITY</span>
              <div className="text-sm font-bold text-[#3b82f6]">
                {attachedChars.length > 0 ? `${attachedChars.length} ATTACHED` : "UNANCHORED"}
              </div>
              <span className="text-[8px] text-[#71717a]">
                {attachedChars.length > 0 ? "Ref Turnaround Active" : "No ref image"}
              </span>
            </div>

            <div className="p-3 bg-[#09090b] border border-[#27272a] space-y-1">
              <span className="text-[9px] text-[#71717a] uppercase font-bold">SET ATMOSPHERE</span>
              <div className="text-sm font-bold text-[#10b981]">
                {attachedLoc ? attachedLoc.time_of_day || "ATTACHED" : "UNANCHORED"}
              </div>
              <span className="text-[8px] text-[#71717a]">
                {attachedLoc ? "Environmental Lock" : "Generic setting"}
              </span>
            </div>

            <div className="p-3 bg-[#09090b] border border-[#27272a] space-y-1">
              <span className="text-[9px] text-[#71717a] uppercase font-bold">CAMERA MOTION</span>
              <div className="text-sm font-bold text-[#f59e0b]">{cameraPrompt || "STATIC"}</div>
              <span className="text-[8px] text-[#71717a]">{framingPrompt}</span>
            </div>
          </div>

          {/* Interactive Edit Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#a1a1aa] mb-1">
                ACTION & MOTION DESCRIPTION
              </label>
              <textarea
                rows={3}
                value={actionPrompt}
                onChange={(e) => setActionPrompt(e.target.value)}
                className="w-full bg-[#18181b] border border-[#27272a] focus:border-[#3b82f6] p-3 text-xs text-[#fafafa] outline-none font-mono"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#a1a1aa] mb-1">
                  CAMERA DIRECTION
                </label>
                <input
                  type="text"
                  value={`${framingPrompt}, ${cameraPrompt}`}
                  onChange={(e) => {
                    const parts = e.target.value.split(",");
                    setFramingPrompt(parts[0]?.trim() || "");
                    setCameraPrompt(parts[1]?.trim() || "");
                  }}
                  className="w-full bg-[#18181b] border border-[#27272a] focus:border-[#3b82f6] px-3 py-2 text-xs text-[#fafafa] outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-[#a1a1aa] mb-1">
                  SYNCHRONIZED FOLEY / AUDIO CUE
                </label>
                <input
                  type="text"
                  value={foleyPrompt}
                  placeholder="e.g. Neon hum, soft footsteps, mechanical servo click"
                  onChange={(e) => setFoleyPrompt(e.target.value)}
                  className="w-full bg-[#18181b] border border-[#27272a] focus:border-[#3b82f6] px-3 py-2 text-xs text-[#fafafa] outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* Structured Output Preview */}
          <div className="p-4 bg-[#09090b] border border-[#27272a] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-[#3b82f6]" />
                <span className="text-[10px] font-bold text-[#fafafa] uppercase">
                  LIVE STRUCTURED COMPILED PROMPT
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 px-2 py-1 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-[9px] text-[#a1a1aa] hover:text-[#fafafa] transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-[#10b981]" /> : <Copy className="w-3 h-3" />}
                <span>COPY TO CLIPBOARD</span>
              </button>
            </div>

            <div className="p-3 bg-[#0c0c0e] border border-[#18181b] text-xs text-[#fafafa] font-mono leading-relaxed select-all">
              {compiledFullPrompt}
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-[#27272a]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-xs font-bold text-[#a1a1aa] uppercase transition-colors"
            >
              CLOSE
            </button>

            <div className="flex items-center gap-3">
              {onApplyPrompt && (
                <button
                  type="button"
                  onClick={handleApply}
                  className="flex items-center gap-2 px-4 py-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  <Wand2 className="w-4 h-4" />
                  <span>APPLY TO SHOT</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
