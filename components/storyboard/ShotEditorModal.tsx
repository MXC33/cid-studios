"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  Flame,
  Save,
  Trash2,
  AlertCircle,
  Copy,
  Check,
  Dices,
  Layers,
  Clock,
  Film,
  Camera,
  MapPin,
  Users,
  Sliders,
  CheckCircle2,
  CircleDashed,
} from "lucide-react";
import { Shot, Character, Location } from "@/lib/db/schema";
import { calculateFrameLength } from "@/lib/comfy/graphCompiler";
import { ReferenceSlotUploader } from "@/components/casting/ReferenceSlotUploader";
import { cn } from "@/lib/utils";

interface ShotEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  shot?: Shot | null;
  sceneId: string;
  characters: Character[];
  locations: Location[];
  onSaved: () => void;
  onDeleted?: (id: string) => void;
  onRenderNow?: (payload: any) => void;
  fps?: number;
}

const FRAMING_OPTIONS = [
  "Wide / Establishing Shot",
  "Medium-Wide Shot",
  "Medium Shot",
  "Medium Close-Up",
  "Close-Up",
  "Extreme Close-Up",
  "Low Angle Dramatic",
  "High Angle / Birds Eye",
  "Over-The-Shoulder",
  "Dutch Angle Dynamic",
];

const CAMERA_MOVEMENTS = [
  "Static",
  "Slow Push-In",
  "Slow Pull-Out",
  "Pan Left to Right",
  "Pan Right to Left",
  "Tilt Up",
  "Tilt Down",
  "Tracking Sprint",
  "Handheld Shaky-Cam",
  "Drone Crane Sweep",
  "Orbit 180 Around Subject",
];

const RESOLUTION_PRESETS = [
  { label: "16:9 Landscape (1344x768)", width: 1344, height: 768, tag: "16:9" },
  { label: "9:16 Portrait (768x1344)", width: 768, height: 1344, tag: "9:16" },
  { label: "2.39:1 Anamorphic (1536x640)", width: 1536, height: 640, tag: "2.39:1" },
  { label: "1:1 Square (1024x1024)", width: 1024, height: 1024, tag: "1:1" },
];

export function ShotEditorModal({
  isOpen,
  onClose,
  shot,
  sceneId,
  characters,
  locations,
  onSaved,
  onDeleted,
  onRenderNow,
  fps = 24,
}: ShotEditorModalProps) {
  const isEditing = Boolean(shot?.id);

  // Form State
  const [shotNumber, setShotNumber] = useState<number>(1);
  const [duration, setDuration] = useState<number>(3.0);
  const [framing, setFraming] = useState<string>("Medium Shot");
  const [cameraMovement, setCameraMovement] = useState<string>("Static");
  const [actionNotes, setActionNotes] = useState<string>("");
  const [selectedCharIds, setSelectedCharIds] = useState<string[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");

  // Engine / Render Parameters
  const [resolution, setResolution] = useState(RESOLUTION_PRESETS[0]);
  const [steps, setSteps] = useState<number>(4);
  const [seed, setSeed] = useState<number>(() => Math.floor(Math.random() * 1_000_000_000));
  const [loraStrength, setLoraStrength] = useState<number>(1.0);

  // Custom 4 Reference slots (injected from cast/location or custom)
  const [refImages, setRefImages] = useState<(string | null)[]>([null, null, null, null]);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Calculate live frames with 17-frame alignment
  const frameCount = calculateFrameLength(duration, fps);

  // Initialize form when opened or shot changed
  useEffect(() => {
    if (shot) {
      setShotNumber(shot.shot_number);
      setDuration(shot.duration || 3.0);
      setFraming(shot.framing || "Medium Shot");
      setCameraMovement(shot.camera_movement || "Static");
      setActionNotes(shot.action_notes || "");
      setSelectedLocationId(shot.location_id || "");

      let charIds: string[] = [];
      try {
        if (shot.character_ids) {
          if (shot.character_ids.startsWith("[")) {
            charIds = JSON.parse(shot.character_ids);
          } else {
            charIds = [shot.character_ids];
          }
        }
      } catch {
        charIds = [];
      }
      setSelectedCharIds(charIds);
    } else {
      setShotNumber(1);
      setDuration(3.0);
      setFraming("Medium Shot");
      setCameraMovement("Static");
      setActionNotes("");
      setSelectedCharIds(characters.length > 0 ? [characters[0].id] : []);
      setSelectedLocationId(locations.length > 0 ? locations[0].id : "");
    }
    setSeed(Math.floor(Math.random() * 1_000_000_000));
    setError(null);
  }, [shot, isOpen, characters, locations]);

  // Auto-inject references when characters or locations change
  useEffect(() => {
    const activeChars = characters.filter((c) => selectedCharIds.includes(c.id));
    const activeLoc = locations.find((l) => l.id === selectedLocationId);

    const primaryChar = activeChars[0];
    const secondaryChar = activeChars[1];

    const ref0 = primaryChar?.ref_sheet_path || null;
    const ref1 = primaryChar?.ref_body_path || primaryChar?.ref_action_path || null;
    const ref2 = activeLoc?.ref_main_path || secondaryChar?.ref_sheet_path || null;
    const ref3 = activeLoc?.ref_alt_path || primaryChar?.ref_expression_path || null;

    setRefImages([ref0, ref1, ref2, ref3]);
  }, [selectedCharIds, selectedLocationId, characters, locations]);

  if (!isOpen) return null;

  // Toggle Character selection
  const toggleCharacter = (charId: string) => {
    setSelectedCharIds((prev) =>
      prev.includes(charId) ? prev.filter((id) => id !== charId) : [...prev, charId]
    );
  };

  // Compile Structured Prompt for MiniMax H3
  const compileStructuredPrompt = () => {
    const activeChars = characters.filter((c) => selectedCharIds.includes(c.id));
    const activeLoc = locations.find((l) => l.id === selectedLocationId);

    const charDetails = activeChars
      .map((c) => `${c.name} (${c.role || "Character"}: ${c.description || "Consistent anime character"})`)
      .join(". ");

    const locDetails = activeLoc
      ? `${activeLoc.name} (${activeLoc.time_of_day || "Cinematic Lighting"}: ${activeLoc.description || "Detailed environment"})`
      : "";

    const parts = [
      `${framing}, ${cameraMovement}.`,
      actionNotes || "Character stands in cinematic anime composition with high visual fidelity.",
      charDetails ? `Cast: ${charDetails}.` : "",
      locDetails ? `Environment: ${locDetails}.` : "",
      "Masterpiece cinematic anime keyframe, 8k resolution, crisp turnaround geometry, volumetric lighting, photorealistic textures.",
    ];

    return parts.filter(Boolean).join(" ");
  };

  const compiledPrompt = compileStructuredPrompt();

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(compiledPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleRandomizeSeed = () => {
    setSeed(Math.floor(Math.random() * 1_000_000_000_000_000));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const payload = {
        scene_id: sceneId,
        shot_number: shotNumber,
        duration: Number(duration),
        framing,
        camera_movement: cameraMovement,
        action_notes: actionNotes,
        character_ids: selectedCharIds,
        location_id: selectedLocationId || null,
      };

      if (isEditing && shot?.id) {
        const res = await fetch("/api/shots", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: shot.id,
            ...payload,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to update shot");
        }
      } else {
        const res = await fetch("/api/shots", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to create shot");
        }
      }

      onSaved();
      onClose();
    } catch (err: any) {
      console.error("Save shot error:", err);
      setError(err.message || "Failed to save shot");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!shot?.id) return;
    if (!confirm(`Are you sure you want to delete Shot ${shot.shot_number}?`)) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/shots?id=${encodeURIComponent(shot.id)}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete shot");
      }

      if (onDeleted) onDeleted(shot.id);
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to delete shot");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTriggerRender = () => {
    if (onRenderNow) {
      onRenderNow({
        shot_id: shot?.id,
        prompt: compiledPrompt,
        duration,
        width: resolution.width,
        height: resolution.height,
        steps,
        seed,
        fps,
        ref_images: refImages.filter(Boolean),
        lora_strength: loraStrength,
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#121215] border border-[#27272a] w-full max-w-5xl my-8 overflow-hidden shadow-2xl font-mono">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272a] bg-[#09090b]">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-[#3b82f6]/10 border border-[#3b82f6]/30 text-[#3b82f6]">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#fafafa] uppercase">
                  {isEditing ? `DIRECTORIAL DRAWER // SHOT ${shot?.shot_number}` : "NEW STORYBOARD SHOT"}
                </span>
                <span className="px-1.5 py-0.2 bg-[#3b82f6]/20 text-[#3b82f6] text-[9px] font-bold border border-[#3b82f6]/40">
                  MINIMAX H3 TURBO
                </span>
              </div>
              <p className="text-[10px] text-[#71717a]">
                Configure shot framing, duration with 17-frame alignment, anchor cast/set, and compile prompt
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
          {/* Row 1: Shot Timing & Framing Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-[#09090b] border border-[#27272a]">
            {/* Duration Slider with Live Frame Calculation */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase font-bold text-[#a1a1aa] flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#3b82f6]" />
                  <span>DURATION: {duration.toFixed(1)}s</span>
                </label>
                <span className="px-1.5 py-0.2 bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 text-[9px] font-bold">
                  {frameCount} FRAMES (17-MOD)
                </span>
              </div>
              <input
                type="range"
                min="1.0"
                max="8.0"
                step="0.5"
                value={duration}
                onChange={(e) => setDuration(parseFloat(e.target.value))}
                className="w-full accent-[#3b82f6] cursor-pointer"
              />
              <div className="flex justify-between text-[8px] text-[#71717a]">
                <span>1.0s (29f)</span>
                <span>3.0s (73f)</span>
                <span>5.0s (124f)</span>
                <span>8.0s (192f)</span>
              </div>
            </div>

            {/* Framing Selector */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-[#a1a1aa] block">
                CAMERA FRAMING
              </label>
              <select
                value={framing}
                onChange={(e) => setFraming(e.target.value)}
                className="w-full bg-[#18181b] border border-[#27272a] focus:border-[#3b82f6] px-3 py-2 text-xs text-[#fafafa] outline-none font-mono"
              >
                {FRAMING_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Camera Movement Selector */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-[#a1a1aa] block">
                CAMERA MOVEMENT / CUE
              </label>
              <select
                value={cameraMovement}
                onChange={(e) => setCameraMovement(e.target.value)}
                className="w-full bg-[#18181b] border border-[#27272a] focus:border-[#3b82f6] px-3 py-2 text-xs text-[#fafafa] outline-none font-mono"
              >
                {CAMERA_MOVEMENTS.map((mov) => (
                  <option key={mov} value={mov}>
                    {mov}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Resolution & Steps & Seed Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-[#18181b] border border-[#27272a] text-xs">
            {/* Resolution Picker */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-[9px] uppercase font-bold text-[#71717a] block">
                ASPECT RATIO / RESOLUTION
              </label>
              <select
                value={resolution.tag}
                onChange={(e) => {
                  const found = RESOLUTION_PRESETS.find((r) => r.tag === e.target.value);
                  if (found) setResolution(found);
                }}
                className="w-full bg-[#09090b] border border-[#27272a] focus:border-[#3b82f6] px-2 py-1.5 text-[11px] text-[#fafafa] outline-none"
              >
                {RESOLUTION_PRESETS.map((r) => (
                  <option key={r.tag} value={r.tag}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Steps Toggle */}
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-bold text-[#71717a] block">
                SAMPLING STEPS
              </label>
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => setSteps(4)}
                  className={cn(
                    "py-1 text-[10px] font-bold border transition-colors",
                    steps === 4
                      ? "bg-[#10b981]/20 border-[#10b981]/50 text-[#10b981]"
                      : "bg-[#09090b] border-[#27272a] text-[#71717a]"
                  )}
                >
                  4 TURBO
                </button>
                <button
                  type="button"
                  onClick={() => setSteps(8)}
                  className={cn(
                    "py-1 text-[10px] font-bold border transition-colors",
                    steps === 8
                      ? "bg-[#3b82f6]/20 border-[#3b82f6]/50 text-[#3b82f6]"
                      : "bg-[#09090b] border-[#27272a] text-[#71717a]"
                  )}
                >
                  8 HIGH
                </button>
              </div>
            </div>

            {/* Seed Randomize */}
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-bold text-[#71717a] block">
                NOISE SEED
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={seed}
                  onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
                  className="w-full bg-[#09090b] border border-[#27272a] px-2 py-1 text-[10px] text-[#fafafa] outline-none"
                />
                <button
                  type="button"
                  onClick={handleRandomizeSeed}
                  className="p-1.5 bg-[#09090b] hover:bg-[#27272a] border border-[#27272a] text-[#a1a1aa] hover:text-[#fafafa] transition-colors"
                  title="Randomize Seed"
                >
                  <Dices className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Row 3: Action Description & Directorial Prompt */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase font-bold text-[#a1a1aa]">
                ACTION DESCRIPTION & VISUAL BEHAVIOR *
              </label>
              <span className="text-[9px] text-[#71717a]">
                Describe character motion, facial cues, interactions, and physics
              </span>
            </div>
            <textarea
              rows={3}
              required
              placeholder="e.g. Shampoo walks past neon-lit holographic shelves, glancing over her shoulder with an alert, energetic expression before reaching for the cartridge."
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              className="w-full bg-[#18181b] border border-[#27272a] focus:border-[#3b82f6] p-3 text-xs text-[#fafafa] outline-none font-mono"
            />
          </div>

          {/* Row 4: Cast & Location Anchors Injector */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cast Selector */}
            <div className="p-3.5 bg-[#09090b] border border-[#27272a] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-[#fafafa] flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#3b82f6]" />
                  <span>CAST ATTACHMENT ({selectedCharIds.length} SELECTED)</span>
                </span>
                <span className="text-[8px] text-[#71717a]">Auto-injects Ref 0-1</span>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {characters.map((char) => {
                  const isSelected = selectedCharIds.includes(char.id);
                  return (
                    <button
                      type="button"
                      key={char.id}
                      onClick={() => toggleCharacter(char.id)}
                      className={cn(
                        "px-2 py-1 text-[10px] font-bold border transition-colors flex items-center gap-1",
                        isSelected
                          ? "bg-[#3b82f6]/20 border-[#3b82f6] text-[#3b82f6]"
                          : "bg-[#18181b] border-[#27272a] text-[#a1a1aa] hover:border-[#3f3f46]"
                      )}
                    >
                      {isSelected ? (
                        <CheckCircle2 className="w-3 h-3 text-[#3b82f6]" />
                      ) : (
                        <CircleDashed className="w-3 h-3 text-[#52525b]" />
                      )}
                      <span>{char.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Location Selector */}
            <div className="p-3.5 bg-[#09090b] border border-[#27272a] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-[#fafafa] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#10b981]" />
                  <span>ENVIRONMENT SET ANCHOR</span>
                </span>
                <span className="text-[8px] text-[#71717a]">Auto-injects Ref 2-3</span>
              </div>

              <select
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                className="w-full bg-[#18181b] border border-[#27272a] focus:border-[#10b981] px-3 py-2 text-xs text-[#fafafa] outline-none"
              >
                <option value="">-- No Environment Anchor --</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.time_of_day || "Default"})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 5: 4-Slot Reference Injector Preview Strip */}
          <div className="space-y-2 bg-[#09090b] p-3.5 border border-[#27272a]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-[#3b82f6]" />
                <span className="text-[10px] font-bold text-[#fafafa] uppercase">
                  MINIMAX H3 REFERENCE INJECTOR (SLOTS 0 - 3)
                </span>
              </div>
              <span className="text-[9px] text-[#10b981] font-bold">
                {refImages.filter(Boolean).length}/4 LOADED
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[
                { slot: "REF 0", label: "Char Turnaround", val: refImages[0] },
                { slot: "REF 1", label: "Char Body / Action", val: refImages[1] },
                { slot: "REF 2", label: "Set Main", val: refImages[2] },
                { slot: "REF 3", label: "Set Alt / Interaction", val: refImages[3] },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "p-2 border text-[9px] space-y-1",
                    item.val ? "bg-[#18181b] border-[#3b82f6]/40" : "bg-[#121215] border-[#27272a]"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#3b82f6]">{item.slot}</span>
                    <span className="text-[#71717a] truncate">{item.label}</span>
                  </div>
                  <div className="text-[8px] text-[#fafafa] truncate font-mono">
                    {item.val ? `✓ ${item.val}` : "[Empty]"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Row 6: Live Prompt Doctor Preview */}
          <div className="p-4 bg-[#0c0c0e] border border-[#27272a] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#f59e0b]" />
                <span className="text-[10px] font-bold text-[#fafafa] uppercase">
                  PROMPT DOCTOR // STRUCTURED MINIMAX H3 PROMPT
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyPrompt}
                className="flex items-center gap-1 px-2 py-1 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-[9px] text-[#a1a1aa] hover:text-[#fafafa] transition-colors"
              >
                {copiedPrompt ? <Check className="w-3 h-3 text-[#10b981]" /> : <Copy className="w-3 h-3" />}
                <span>COPY COMPILED PROMPT</span>
              </button>
            </div>

            <div className="p-2.5 bg-[#09090b] border border-[#18181b] text-[10px] text-[#a1a1aa] font-mono leading-relaxed select-all">
              {compiledPrompt}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-[#27272a]">
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3 py-2 bg-transparent hover:bg-[#f43f5e]/10 text-[#f43f5e] border border-[#f43f5e]/30 text-xs font-bold uppercase transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>DELETE SHOT</span>
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

              {onRenderNow && (
                <button
                  type="button"
                  onClick={handleTriggerRender}
                  disabled={isSaving || !actionNotes.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-[#f59e0b] hover:bg-[#d97706] text-black text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                >
                  <Flame className="w-4 h-4" />
                  <span>ACTION / RENDER TAKE</span>
                </button>
              )}

              <button
                type="submit"
                disabled={isSaving || !actionNotes.trim()}
                className="flex items-center gap-2 px-5 py-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? "SAVING..." : isEditing ? "UPDATE SHOT" : "CREATE SHOT"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
