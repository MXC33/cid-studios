"use client";

import React, { useState } from "react";
import { X, Layers, Film, Sparkles, Check } from "lucide-react";
import { Scene, Shot } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

interface EnqueueModalProps {
  isOpen: boolean;
  scenes: Scene[];
  shots: Shot[];
  onClose: () => void;
  onEnqueued: (count: number) => void;
}

export function EnqueueModal({
  isOpen,
  scenes,
  shots,
  onClose,
  onEnqueued,
}: EnqueueModalProps) {
  const [selectedSceneId, setSelectedSceneId] = useState<string>(scenes[0]?.id || "");
  const [takesPerShot, setTakesPerShot] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const sceneShots = shots.filter((s) => s.scene_id === selectedSceneId);
  const totalTakesToEnqueue = sceneShots.length * takesPerShot;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSceneId) {
      setError("Please select a scene to enqueue");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/queue/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scene_id: selectedSceneId,
          count_per_shot: takesPerShot,
          auto_dispatch: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onEnqueued(data.enqueued_count || totalTakesToEnqueue);
        onClose();
      } else {
        setError(data.error || "Failed to enqueue scene");
      }
    } catch (err: any) {
      setError(err.message || "Network error enqueuing batch");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0c0c0e] border border-[#27272a] w-full max-w-md shadow-2xl overflow-hidden font-mono">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-[#121215] border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#10b981]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#fafafa]">
              ENQUEUE SCENE BATCH
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#71717a] hover:text-[#fafafa] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] text-[11px]">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[#a1a1aa] block uppercase font-bold text-[10px]">
              TARGET SCENE
            </label>
            <select
              value={selectedSceneId}
              onChange={(e) => setSelectedSceneId(e.target.value)}
              className="w-full bg-[#18181b] border border-[#27272a] p-2.5 text-[#fafafa] focus:outline-none focus:border-[#10b981]"
            >
              {scenes.map((scene) => (
                <option key={scene.id} value={scene.id}>
                  Scene {scene.scene_number}: {scene.title}
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 bg-[#121215] border border-[#27272a] space-y-1 text-[11px]">
            <div className="flex justify-between text-[#71717a]">
              <span>SHOTS IN SCENE:</span>
              <span className="text-[#fafafa] font-bold">{sceneShots.length} Shots</span>
            </div>
            <div className="flex justify-between text-[#71717a]">
              <span>COMFYUI BACKEND:</span>
              <span className="text-[#3b82f6] font-bold">MiniMax H3 (INT8) Turbo</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[#a1a1aa] block uppercase font-bold text-[10px]">
              TAKES PER SHOT (REPLICATES / VARIATIONS)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setTakesPerShot(num)}
                  className={cn(
                    "py-2 border text-center font-bold transition-colors",
                    takesPerShot === num
                      ? "bg-[#10b981]/20 text-[#10b981] border-[#10b981]"
                      : "bg-[#18181b] text-[#71717a] border-[#27272a] hover:text-[#fafafa]"
                  )}
                >
                  {num} {num === 1 ? "TAKE" : "TAKES"}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-[#18181b] border border-[#27272a] flex items-center justify-between">
            <span className="text-[#a1a1aa] text-[11px]">TOTAL JOBS TO ENQUEUE:</span>
            <span className="text-[#10b981] font-bold text-sm">{totalTakesToEnqueue} RENDERS</span>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-[#a1a1aa] hover:text-[#fafafa]"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isSubmitting || sceneShots.length === 0}
              className="px-5 py-2 bg-[#10b981] hover:bg-[#059669] text-black font-bold uppercase tracking-wider disabled:opacity-50"
            >
              {isSubmitting ? "ENQUEUING..." : "DISPATCH TO QUEUE"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
