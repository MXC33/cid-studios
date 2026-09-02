"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Clapperboard,
  Save,
  Trash2,
  AlertCircle,
  Volume2,
  FileText,
} from "lucide-react";
import { Scene } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

interface SceneEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  scene?: Scene | null;
  projectId: string;
  onSaved: () => void;
  onDeleted?: (id: string) => void;
}

export function SceneEditorModal({
  isOpen,
  onClose,
  scene,
  projectId,
  onSaved,
  onDeleted,
}: SceneEditorModalProps) {
  const isEditing = Boolean(scene?.id);

  const [sceneNumber, setSceneNumber] = useState<number>(1);
  const [title, setTitle] = useState<string>("");
  const [synopsis, setSynopsis] = useState<string>("");
  const [promptScript, setPromptScript] = useState<string>("");
  const [audioFoley, setAudioFoley] = useState<string>("");

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (scene) {
      setSceneNumber(scene.scene_number);
      setTitle(scene.title || "");
      setSynopsis(scene.synopsis || "");
      setPromptScript(scene.prompt_script || "");
      setAudioFoley(scene.audio_foley || "");
    } else {
      setSceneNumber(1);
      setTitle("");
      setSynopsis("");
      setPromptScript("");
      setAudioFoley("");
    }
    setError(null);
  }, [scene, isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Scene title is required");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const payload = {
        project_id: projectId,
        scene_number: Number(sceneNumber),
        title,
        synopsis: synopsis || null,
        prompt_script: promptScript || null,
        audio_foley: audioFoley || null,
      };

      if (isEditing && scene?.id) {
        const res = await fetch("/api/scenes", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: scene.id,
            ...payload,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to update scene");
        }
      } else {
        const res = await fetch("/api/scenes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to create scene");
        }
      }

      onSaved();
      onClose();
    } catch (err: any) {
      console.error("Save scene error:", err);
      setError(err.message || "Failed to save scene");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!scene?.id) return;
    if (!confirm(`Are you sure you want to delete Scene ${scene.scene_number}: ${scene.title}? This will also delete all shots within this scene.`)) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/scenes?id=${encodeURIComponent(scene.id)}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete scene");
      }

      if (onDeleted) onDeleted(scene.id);
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to delete scene");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#121215] border border-[#27272a] w-full max-w-2xl my-8 overflow-hidden shadow-2xl font-mono">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272a] bg-[#09090b]">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-[#3b82f6]/10 border border-[#3b82f6]/30 text-[#3b82f6]">
              <Clapperboard className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#fafafa] uppercase">
                  {isEditing ? `EDIT SCENE // SCENE ${scene?.scene_number}` : "NEW SCENE DEFINITION"}
                </span>
              </div>
              <p className="text-[10px] text-[#71717a]">
                Manage scene narrative sequence, overall synopsis, and scene-wide foley audio cues
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

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#a1a1aa] mb-1">
                SCENE NO. *
              </label>
              <input
                type="number"
                min="1"
                required
                value={sceneNumber}
                onChange={(e) => setSceneNumber(parseInt(e.target.value) || 1)}
                className="w-full bg-[#18181b] border border-[#27272a] focus:border-[#3b82f6] px-3 py-2 text-xs text-[#fafafa] outline-none font-mono"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-[10px] uppercase font-bold text-[#a1a1aa] mb-1">
                SCENE TITLE *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. The Retrieval, Rooftop Breach"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#18181b] border border-[#27272a] focus:border-[#3b82f6] px-3 py-2 text-xs text-[#fafafa] outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-[#a1a1aa] mb-1">
              SCENE SYNOPSIS
            </label>
            <textarea
              rows={2}
              placeholder="Summary of narrative events taking place across this scene sequence..."
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              className="w-full bg-[#18181b] border border-[#27272a] focus:border-[#3b82f6] p-3 text-xs text-[#fafafa] outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-[#a1a1aa] mb-1">
              PROMPT SCRIPT NOTES / CONTEXT
            </label>
            <textarea
              rows={2}
              placeholder="Key terms, recurring visual motifs, or tone notes..."
              value={promptScript}
              onChange={(e) => setPromptScript(e.target.value)}
              className="w-full bg-[#18181b] border border-[#27272a] focus:border-[#3b82f6] p-3 text-xs text-[#fafafa] outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-[#a1a1aa] mb-1">
              SYNCHRONIZED AUDIO & FOLEY PROFILE
            </label>
            <input
              type="text"
              placeholder="e.g. Neon hum, store chime, soft footstep, rain patter"
              value={audioFoley}
              onChange={(e) => setAudioFoley(e.target.value)}
              className="w-full bg-[#18181b] border border-[#27272a] focus:border-[#3b82f6] px-3 py-2 text-xs text-[#fafafa] outline-none font-mono"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-[#27272a]">
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3 py-2 bg-transparent hover:bg-[#f43f5e]/10 text-[#f43f5e] border border-[#f43f5e]/30 text-xs font-bold uppercase transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>DELETE SCENE</span>
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
                disabled={isSaving || !title.trim()}
                className="flex items-center gap-2 px-5 py-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? "SAVING..." : isEditing ? "UPDATE SCENE" : "CREATE SCENE"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
