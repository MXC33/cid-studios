"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  Copy,
  Check,
  Save,
  Volume2,
  Trash2,
  AlertCircle,
  FileText,
  Sliders,
  Maximize2,
} from "lucide-react";
import { Character } from "@/lib/db/schema";
import { ReferenceSlotUploader } from "./ReferenceSlotUploader";
import { cn } from "@/lib/utils";

interface CharacterEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  character?: Character | null;
  onSaved: () => void;
  onDeleted?: (id: string) => void;
  activeProjectId?: string;
}

const ROLE_OPTIONS = [
  { value: "LEAD", label: "LEAD OPERATIVE", color: "text-[#3b82f6] border-[#3b82f6]/40 bg-[#3b82f6]/10" },
  { value: "SUPPORTING", label: "SUPPORTING HANDLER", color: "text-[#10b981] border-[#10b981]/40 bg-[#10b981]/10" },
  { value: "ANTAGONIST", label: "ANTAGONIST / ENEMY", color: "text-[#f59e0b] border-[#f59e0b]/40 bg-[#f59e0b]/10" },
  { value: "EXTRA", label: "EXTRA / NPC", color: "text-[#a1a1aa] border-[#3f3f46] bg-[#18181b]" },
];

const VOICE_TONE_PRESETS = [
  "Calm, energetic Japanese anime heroine",
  "Low gravelly cyborg commander, authoritative",
  "Fast-paced tactical communications specialist",
  "Cold, robotic AI synthesizer with subtle resonance",
  "Playful, mischievous rogue operative",
  "Deep, resonant elder martial artist",
];

const AGE_PRESETS = ["Late Teens (18-20)", "Young Adult (22-26)", "Prime Operative (28-35)", "Veteran (40+)"];

export function CharacterEditorModal({
  isOpen,
  onClose,
  character,
  onSaved,
  onDeleted,
  activeProjectId = "proj_neo_tokyo_2088",
}: CharacterEditorModalProps) {
  const isEditing = Boolean(character?.id);

  const [formData, setFormData] = useState({
    name: "",
    role: "LEAD",
    description: "",
    voice_profile: "Calm, energetic Japanese anime heroine",
    ref_sheet_path: "" as string | null,
    ref_body_path: "" as string | null,
    ref_action_path: "" as string | null,
    ref_expression_path: "" as string | null,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedTags, setCopiedTags] = useState(false);

  useEffect(() => {
    if (character) {
      setFormData({
        name: character.name || "",
        role: character.role || "LEAD",
        description: character.description || "",
        voice_profile: character.voice_profile || "Calm, energetic Japanese anime heroine",
        ref_sheet_path: character.ref_sheet_path || null,
        ref_body_path: character.ref_body_path || null,
        ref_action_path: character.ref_action_path || null,
        ref_expression_path: character.ref_expression_path || null,
      });
    } else {
      setFormData({
        name: "",
        role: "LEAD",
        description: "",
        voice_profile: "Calm, energetic Japanese anime heroine",
        ref_sheet_path: null,
        ref_body_path: null,
        ref_action_path: null,
        ref_expression_path: null,
      });
    }
    setError(null);
  }, [character, isOpen]);

  if (!isOpen) return null;

  // Active slots count
  const filledSlots = [
    formData.ref_sheet_path,
    formData.ref_body_path,
    formData.ref_action_path,
    formData.ref_expression_path,
  ].filter(Boolean).length;

  // Prompt Generator compilation
  const generatePromptDescriptor = () => {
    const charName = formData.name || "UNNAMED_CHARACTER";
    const desc = formData.description || "Distinctive cyberpunk anime operative with intricate character features";
    const role = formData.role || "LEAD";
    const voice = formData.voice_profile || "Standard Vocal profile";

    return `Masterpiece anime keyframe of ${charName}, ${role} role. ${desc}. High facial fidelity, consistent turnaround geometry, pristine anime rendering style, 8k resolution, cinematic color grading. [Voice: ${voice}].`;
  };

  const generateStructuralAnchor = () => {
    const refs = [
      formData.ref_sheet_path ? `sheet: ${formData.ref_sheet_path}` : null,
      formData.ref_body_path ? `body: ${formData.ref_body_path}` : null,
      formData.ref_action_path ? `action: ${formData.ref_action_path}` : null,
      formData.ref_expression_path ? `expr: ${formData.ref_expression_path}` : null,
    ]
      .filter(Boolean)
      .join(" | ");

    return `[CHARACTER_ANCHOR: ${formData.name || "CHAR"}] [ROLE: ${formData.role}] [CONSISTENCY_TIER: ${filledSlots}/4] [INPUT_FILES: ${refs || "NONE"}]`;
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(generatePromptDescriptor());
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleCopyAnchor = () => {
    navigator.clipboard.writeText(generateStructuralAnchor());
    setCopiedTags(true);
    setTimeout(() => setCopiedTags(false), 2000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Character name is required");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (isEditing && character?.id) {
        const res = await fetch("/api/characters", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: character.id,
            project_id: character.project_id || activeProjectId,
            ...formData,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to update character");
        }
      } else {
        const res = await fetch("/api/characters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project_id: activeProjectId,
            ...formData,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to create character");
        }
      }

      onSaved();
      onClose();
    } catch (err: any) {
      console.error("Save character error:", err);
      setError(err.message || "Failed to save character");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!character?.id) return;
    if (!confirm(`Are you sure you want to delete ${character.name}?`)) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/characters?id=${encodeURIComponent(character.id)}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete character");
      }

      if (onDeleted) onDeleted(character.id);
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to delete character");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#121215] border border-[#27272a] w-full max-w-5xl my-8 overflow-hidden shadow-2xl font-mono">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272a] bg-[#09090b]">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-[#10b981]/10 border border-[#10b981]/30 text-[#10b981]">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#fafafa] uppercase">
                  {isEditing ? `EDIT CHARACTER // ${character?.name}` : "CASTING FORGE // NEW OPERATIVE"}
                </span>
                <span className="px-1.5 py-0.2 bg-[#27272a] text-[#a1a1aa] text-[9px] font-bold">
                  CONSISTENCY MATRIX
                </span>
              </div>
              <p className="text-[10px] text-[#71717a]">
                4-angle geometric consistency anchors, voice profile notes, and auto-compiled prompt descriptor
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

        {error && (
          <div className="mx-6 mt-4 p-3 bg-[#f43f5e]/10 border border-[#f43f5e]/30 text-[#f43f5e] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="p-6 space-y-6">
          {/* Top Info Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#a1a1aa] mb-1">
                CHARACTER NAME *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Shampoo, Kaito, Cyber-09"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-[#18181b] border border-[#27272a] focus:border-[#10b981] px-3 py-2 text-xs text-[#fafafa] outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[#a1a1aa] mb-1">
                ROLE CLASSIFICATION
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full bg-[#18181b] border border-[#27272a] focus:border-[#10b981] px-3 py-2 text-xs text-[#fafafa] outline-none font-mono"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[#a1a1aa] mb-1">
                ACTIVE CONSISTENCY TIER
              </label>
              <div className="flex items-center justify-between bg-[#18181b] border border-[#27272a] px-3 py-2 text-xs">
                <span className="text-[#a1a1aa]">{filledSlots}/4 SLOTS ARMED</span>
                <span
                  className={cn(
                    "px-1.5 py-0.2 text-[9px] font-bold uppercase",
                    filledSlots === 4
                      ? "bg-[#10b981]/20 border border-[#10b981]/40 text-[#10b981]"
                      : filledSlots > 0
                      ? "bg-[#f59e0b]/20 border border-[#f59e0b]/40 text-[#f59e0b]"
                      : "bg-[#71717a]/20 border border-[#71717a]/40 text-[#71717a]"
                  )}
                >
                  {filledSlots === 4 ? "FULL ANCHOR" : filledSlots > 0 ? "PARTIAL ANCHOR" : "NO REFS"}
                </span>
              </div>
            </div>
          </div>

          {/* Description & Visual Profile */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-[#a1a1aa] mb-1">
              VISUAL DESCRIPTION & KEY ATTIRE (APPEARANCE PROMPT)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Cybernetic operative with purple hair in twin buns, tactical traditional kimono blend outfit, glowing magenta cybernetic left eye..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-[#18181b] border border-[#27272a] focus:border-[#10b981] px-3 py-2 text-xs text-[#fafafa] outline-none font-mono"
            />
          </div>

          {/* 4-VIEW CONSISTENCY REFERENCE GRID */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#fafafa] uppercase">
                  4-VIEW CONSISTENCY REFERENCE MATRIX
                </span>
                <span className="text-[9px] text-[#71717a] font-mono">
                  (Auto-syncs to /vault and ComfyUI/input)
                </span>
              </div>
              <span className="text-[9px] text-[#10b981] font-mono">
                {filledSlots === 4 ? "✓ ALL 4 SLOTS POPULATED" : `${4 - filledSlots} SLOTS REMAINING`}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Slot 1: Turnaround Sheet */}
              <ReferenceSlotUploader
                slotNumber="REF-01"
                label="Turnaround Sheet"
                subtitle="Multi-angle views"
                value={formData.ref_sheet_path}
                onChange={(path) => setFormData({ ...formData, ref_sheet_path: path })}
                aspectRatio="aspect-[3/4]"
              />

              {/* Slot 2: Full Body */}
              <ReferenceSlotUploader
                slotNumber="REF-02"
                label="Full Body Silhouette"
                subtitle="Costume & proportions"
                value={formData.ref_body_path}
                onChange={(path) => setFormData({ ...formData, ref_body_path: path })}
                aspectRatio="aspect-[3/4]"
              />

              {/* Slot 3: Action Pose */}
              <ReferenceSlotUploader
                slotNumber="REF-03"
                label="Dynamic Action Pose"
                subtitle="Motion & weapon stance"
                value={formData.ref_action_path}
                onChange={(path) => setFormData({ ...formData, ref_action_path: path })}
                aspectRatio="aspect-[3/4]"
              />

              {/* Slot 4: Expressions Matrix */}
              <ReferenceSlotUploader
                slotNumber="REF-04"
                label="Expression Sheet"
                subtitle="Facial range & emotion"
                value={formData.ref_expression_path}
                onChange={(path) => setFormData({ ...formData, ref_expression_path: path })}
                aspectRatio="aspect-[3/4]"
              />
            </div>
          </div>

          {/* Voice Profile & Character Sound Architecture */}
          <div className="p-4 bg-[#09090b] border border-[#27272a] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-[#3b82f6]" />
                <span className="text-xs font-bold text-[#fafafa] uppercase">
                  VOICE PROFILE & ACOUSTIC SIGNATURE
                </span>
              </div>
              <span className="text-[9px] text-[#71717a]">Foley / Dialogue Conditioning</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder="e.g. Calm, energetic Japanese anime heroine, slightly breathless in combat"
                  value={formData.voice_profile}
                  onChange={(e) => setFormData({ ...formData, voice_profile: e.target.value })}
                  className="w-full bg-[#18181b] border border-[#27272a] focus:border-[#3b82f6] px-3 py-1.5 text-xs text-[#fafafa] outline-none font-mono"
                />
              </div>

              <div>
                <select
                  onChange={(e) => setFormData({ ...formData, voice_profile: e.target.value })}
                  className="w-full bg-[#18181b] border border-[#27272a] focus:border-[#3b82f6] px-2 py-1.5 text-[11px] text-[#a1a1aa] outline-none font-mono"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select tone preset...
                  </option>
                  {VOICE_TONE_PRESETS.map((preset) => (
                    <option key={preset} value={preset}>
                      {preset}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Auto-compiled Character Prompt Descriptor */}
          <div className="p-4 bg-[#0c0c0e] border border-[#27272a] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#10b981]" />
                <span className="text-[11px] font-bold text-[#fafafa] uppercase">
                  PROMPT DESCRIPTOR COMPILER
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyAnchor}
                  className="flex items-center gap-1 px-2 py-1 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-[9px] text-[#a1a1aa] hover:text-[#fafafa] transition-colors"
                >
                  {copiedTags ? <Check className="w-3 h-3 text-[#10b981]" /> : <Copy className="w-3 h-3" />}
                  <span>COPY ANCHORS</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="flex items-center gap-1 px-2 py-1 bg-[#10b981]/20 hover:bg-[#10b981]/30 border border-[#10b981]/40 text-[9px] text-[#10b981] transition-colors"
                >
                  {copiedPrompt ? <Check className="w-3 h-3 text-[#10b981]" /> : <Copy className="w-3 h-3" />}
                  <span>COPY COMPILED PROMPT</span>
                </button>
              </div>
            </div>

            <div className="p-2.5 bg-[#09090b] border border-[#18181b] text-[10px] text-[#a1a1aa] font-mono leading-relaxed select-all">
              {generatePromptDescriptor()}
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-[#27272a]">
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3 py-2 bg-transparent hover:bg-[#f43f5e]/10 text-[#f43f5e] border border-[#f43f5e]/30 text-xs font-bold uppercase transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>DELETE CHARACTER</span>
              </button>
            )}

            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-xs font-bold text-[#a1a1aa] uppercase transition-colors"
              >
                CANCEL
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2 bg-[#10b981] hover:bg-[#059669] text-black text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? "SAVING..." : isEditing ? "UPDATE CHARACTER" : "CREATE CHARACTER"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
