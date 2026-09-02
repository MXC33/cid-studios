"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  Copy,
  Check,
  Save,
  Trash2,
  AlertCircle,
  MapPin,
  Sun,
  Moon,
  Sunset,
  CloudFog,
  Zap,
} from "lucide-react";
import { Location } from "@/lib/db/schema";
import { ReferenceSlotUploader } from "@/components/casting/ReferenceSlotUploader";
import { cn } from "@/lib/utils";

interface LocationEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  location?: Location | null;
  onSaved: () => void;
  onDeleted?: (id: string) => void;
  activeProjectId?: string;
}

const LIGHTING_PRESETS = [
  { label: "Night / Cyberpunk Neon", value: "Night / Neon Interior", icon: Moon, color: "text-[#f59e0b]" },
  { label: "Day / Bright Daylight", value: "Day / Bright Natural", icon: Sun, color: "text-[#10b981]" },
  { label: "Golden Hour / Sunset", value: "Golden Hour / Sunset Rim", icon: Sunset, color: "text-[#f97316]" },
  { label: "Moody Fog / Rain Mist", value: "Moody Fog / Rain Reflections", icon: CloudFog, color: "text-[#3b82f6]" },
  { label: "Interior Cyan / Server Core", value: "Interior Cyan / High Contrast", icon: Zap, color: "text-[#06b6d4]" },
  { label: "Overcast Dusk / Low Key", value: "Overcast Dusk / Gritty", icon: Moon, color: "text-[#a1a1aa]" },
];

export function LocationEditorModal({
  isOpen,
  onClose,
  location,
  onSaved,
  onDeleted,
  activeProjectId = "proj_neo_tokyo_2088",
}: LocationEditorModalProps) {
  const isEditing = Boolean(location?.id);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    time_of_day: "Night / Neon Interior",
    ref_main_path: "" as string | null,
    ref_alt_path: "" as string | null,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedAnchor, setCopiedAnchor] = useState(false);

  useEffect(() => {
    if (location) {
      setFormData({
        name: location.name || "",
        description: location.description || "",
        time_of_day: location.time_of_day || "Night / Neon Interior",
        ref_main_path: location.ref_main_path || null,
        ref_alt_path: location.ref_alt_path || null,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        time_of_day: "Night / Neon Interior",
        ref_main_path: null,
        ref_alt_path: null,
      });
    }
    setError(null);
  }, [location, isOpen]);

  if (!isOpen) return null;

  // Generate environmental prompt snippet
  const generateEnvironmentalPrompt = () => {
    const name = formData.name || "UNNAMED_LOCATION";
    const desc = formData.description || "Detailed cyberpunk environment";
    const tod = formData.time_of_day || "Night / Neon Interior";

    return `Cinematic master shot of ${name}. ${desc}. Atmosphere: ${tod}, volumetric lighting, highly detailed environment architecture, cinematic anime style, 8k resolution, photorealistic surface reflections.`;
  };

  const generateStructuralAnchor = () => {
    const refs = [
      formData.ref_main_path ? `main: ${formData.ref_main_path}` : null,
      formData.ref_alt_path ? `alt: ${formData.ref_alt_path}` : null,
    ]
      .filter(Boolean)
      .join(" | ");

    return `[LOCATION_LOCK: ${formData.name || "LOC"}] [LIGHTING: ${formData.time_of_day}] [REFS: ${refs || "NONE"}]`;
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(generateEnvironmentalPrompt());
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleCopyAnchor = () => {
    navigator.clipboard.writeText(generateStructuralAnchor());
    setCopiedAnchor(true);
    setTimeout(() => setCopiedAnchor(false), 2000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Location name is required");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (isEditing && location?.id) {
        const res = await fetch("/api/locations", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: location.id,
            project_id: location.project_id || activeProjectId,
            ...formData,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to update location");
        }
      } else {
        const res = await fetch("/api/locations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project_id: activeProjectId,
            ...formData,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to create location");
        }
      }

      onSaved();
      onClose();
    } catch (err: any) {
      console.error("Save location error:", err);
      setError(err.message || "Failed to save location");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!location?.id) return;
    if (!confirm(`Are you sure you want to delete ${location.name}?`)) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/locations?id=${encodeURIComponent(location.id)}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete location");
      }

      if (onDeleted) onDeleted(location.id);
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to delete location");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#121215] border border-[#27272a] w-full max-w-4xl my-8 overflow-hidden shadow-2xl font-mono">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272a] bg-[#09090b]">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-[#3b82f6]/10 border border-[#3b82f6]/30 text-[#3b82f6]">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#fafafa] uppercase">
                  {isEditing ? `EDIT LOCATION // ${location?.name}` : "LOCATION LOCKER // NEW ENVIRONMENT SET"}
                </span>
                <span className="px-1.5 py-0.2 bg-[#27272a] text-[#a1a1aa] text-[9px] font-bold">
                  ATMOSPHERE ANCHOR
                </span>
              </div>
              <p className="text-[10px] text-[#71717a]">
                Multi-reference environmental set with primary angle, alt angle, and auto-compiled atmosphere prompt
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
          {/* Top Info Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#a1a1aa] mb-1">
                LOCATION SET NAME *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Neo-Akiba Retro Anime Store, Rooftop Solar Array"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-[#18181b] border border-[#27272a] focus:border-[#3b82f6] px-3 py-2 text-xs text-[#fafafa] outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[#a1a1aa] mb-1">
                LIGHTING / TIME OF DAY PRESET
              </label>
              <select
                value={formData.time_of_day}
                onChange={(e) => setFormData({ ...formData, time_of_day: e.target.value })}
                className="w-full bg-[#18181b] border border-[#27272a] focus:border-[#3b82f6] px-3 py-2 text-xs text-[#fafafa] outline-none font-mono"
              >
                {LIGHTING_PRESETS.map((preset) => (
                  <option key={preset.value} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-[#a1a1aa] mb-1">
              ENVIRONMENTAL ARCHITECTURE & ATMOSPHERE DESCRIPTION
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Crowded cyberpunk anime retail interior with glowing holographic shelves, merchandise rows, warm ambient lighting and soft neon signs..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-[#18181b] border border-[#27272a] focus:border-[#3b82f6] px-3 py-2 text-xs text-[#fafafa] outline-none font-mono"
            />
          </div>

          {/* ENVIRONMENT REFERENCE SLOTS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#fafafa] uppercase">
                  ENVIRONMENT REFERENCE IMAGES
                </span>
                <span className="text-[9px] text-[#71717a] font-mono">
                  (Auto-syncs to /vault and ComfyUI/input)
                </span>
              </div>
              <span className="text-[9px] text-[#3b82f6] font-mono">
                {formData.ref_main_path && formData.ref_alt_path
                  ? "✓ 2/2 SLOTS LOADED"
                  : formData.ref_main_path
                  ? "1/2 SLOTS LOADED"
                  : "NO REFERENCES"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Primary Reference */}
              <ReferenceSlotUploader
                slotNumber="LOC-MAIN"
                label="Primary Environment Reference"
                subtitle="Master wide / key establishing shot"
                value={formData.ref_main_path}
                onChange={(path) => setFormData({ ...formData, ref_main_path: path })}
                aspectRatio="aspect-video"
              />

              {/* Alt Reference */}
              <ReferenceSlotUploader
                slotNumber="LOC-ALT"
                label="Secondary Angle / Alt Reference"
                subtitle="Interior interaction / detail framing"
                value={formData.ref_alt_path}
                onChange={(path) => setFormData({ ...formData, ref_alt_path: path })}
                aspectRatio="aspect-video"
              />
            </div>
          </div>

          {/* Environmental Prompt Compiler */}
          <div className="p-4 bg-[#0c0c0e] border border-[#27272a] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#3b82f6]" />
                <span className="text-[11px] font-bold text-[#fafafa] uppercase">
                  ENVIRONMENTAL PROMPT COMPILER
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyAnchor}
                  className="flex items-center gap-1 px-2 py-1 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-[9px] text-[#a1a1aa] hover:text-[#fafafa] transition-colors"
                >
                  {copiedAnchor ? <Check className="w-3 h-3 text-[#3b82f6]" /> : <Copy className="w-3 h-3" />}
                  <span>COPY ANCHORS</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="flex items-center gap-1 px-2 py-1 bg-[#3b82f6]/20 hover:bg-[#3b82f6]/30 border border-[#3b82f6]/40 text-[9px] text-[#3b82f6] transition-colors"
                >
                  {copiedPrompt ? <Check className="w-3 h-3 text-[#3b82f6]" /> : <Copy className="w-3 h-3" />}
                  <span>COPY COMPILED PROMPT</span>
                </button>
              </div>
            </div>

            <div className="p-2.5 bg-[#09090b] border border-[#18181b] text-[10px] text-[#a1a1aa] font-mono leading-relaxed select-all">
              {generateEnvironmentalPrompt()}
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
                <span>DELETE SET</span>
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
                className="flex items-center gap-2 px-5 py-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? "SAVING..." : isEditing ? "UPDATE LOCATION" : "CREATE LOCATION"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
