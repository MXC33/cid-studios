"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  Clapperboard,
  Plus,
  Flame,
  Layers,
  Sparkles,
  Sliders,
  RefreshCw,
  Film,
  Camera,
  Play,
  CheckCircle2,
  AlertCircle,
  Volume2,
  Clock,
  ChevronRight,
  FolderPlus,
  Edit2,
  MapPin,
  Users,
} from "lucide-react";
import { Scene, Shot, Character, Location, Take } from "@/lib/db/schema";
import { calculateFrameLength } from "@/lib/comfy/graphCompiler";
import { ShotCard } from "@/components/storyboard/ShotCard";
import { ShotEditorModal } from "@/components/storyboard/ShotEditorModal";
import { PromptDoctorModal } from "@/components/storyboard/PromptDoctorModal";
import { SceneEditorModal } from "@/components/storyboard/SceneEditorModal";
import { LiveStudioHUD } from "@/components/storyboard/LiveStudioHUD";
import { cn } from "@/lib/utils";

export default function StoryboardPage() {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [activeSceneId, setActiveSceneId] = useState<string>("");
  const [shots, setShots] = useState<Shot[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [activeShotId, setActiveShotId] = useState<string | null>(null);

  // Modals state
  const [isShotModalOpen, setIsShotModalOpen] = useState(false);
  const [editingShot, setEditingShot] = useState<Shot | null>(null);
  const [isSceneModalOpen, setIsSceneModalOpen] = useState(false);
  const [editingScene, setEditingScene] = useState<Scene | null>(null);
  const [isPromptDoctorOpen, setIsPromptDoctorOpen] = useState(false);
  const [promptDoctorShot, setPromptDoctorShot] = useState<Shot | null>(null);

  // Render Execution & Telemetry State
  const [isRendering, setIsRendering] = useState(false);
  const [renderingShotId, setRenderingShotId] = useState<string | null>(null);
  const [activePromptId, setActivePromptId] = useState<string | null>(null);
  const [batchIndex, setBatchIndex] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Active scene object
  const activeScene = scenes.find((s) => s.id === activeSceneId) || scenes[0];

  // Fetch initial data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [scenesRes, charsRes, locsRes] = await Promise.all([
        fetch("/api/scenes"),
        fetch("/api/characters"),
        fetch("/api/locations"),
      ]);

      const scenesData = await scenesRes.json();
      const charsData = await charsRes.json();
      const locsData = await locsRes.json();

      if (scenesData.success && scenesData.scenes) {
        setScenes(scenesData.scenes);
        if (!activeSceneId && scenesData.scenes.length > 0) {
          setActiveSceneId(scenesData.scenes[0].id);
        }
      }

      if (charsData.success && charsData.characters) {
        setCharacters(charsData.characters);
      }

      if (locsData.success && locsData.locations) {
        setLocations(locsData.locations);
      }
    } catch (err) {
      console.error("Failed to load storyboard data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch shots when active scene changes
  const fetchShots = async (sceneId: string) => {
    if (!sceneId) return;
    try {
      const res = await fetch(`/api/shots?scene_id=${encodeURIComponent(sceneId)}`);
      const data = await res.json();
      if (data.success && data.shots) {
        setShots(data.shots);
        if (data.shots.length > 0 && !activeShotId) {
          setActiveShotId(data.shots[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load shots:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeSceneId) {
      fetchShots(activeSceneId);
    }
  }, [activeSceneId]);

  // Calculate Scene Totals
  const totalDuration = shots.reduce((acc, s) => acc + (s.duration || 5.0), 0);
  const totalFrames = shots.reduce(
    (acc, s) => acc + calculateFrameLength(s.duration || 5.0, 24),
    0
  );

  // Format seconds into MM:SS:FF
  const formatTimecode = (sec: number, fps = 24) => {
    const totalFrames = Math.round(sec * fps);
    const f = totalFrames % fps;
    const totalSeconds = Math.floor(sec);
    const s = totalSeconds % 60;
    const m = Math.floor(totalSeconds / 60) % 60;
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(m)}:${pad(s)}:${pad(f)}`;
  };

  // Single Shot Render
  const handleRenderShot = async (shot: Shot) => {
    setIsRendering(true);
    setRenderingShotId(shot.id);
    setStatusMessage(`Compiling graph and submitting Shot ${shot.shot_number}...`);

    try {
      // Find attached character & location
      let charIds: string[] = [];
      try {
        if (shot.character_ids) {
          charIds = shot.character_ids.startsWith("[")
            ? JSON.parse(shot.character_ids)
            : [shot.character_ids];
        }
      } catch {
        charIds = [];
      }

      const attachedChars = characters.filter((c) => charIds.includes(c.id));
      const attachedLoc = locations.find((l) => l.id === shot.location_id);

      const ref0 = attachedChars[0]?.ref_sheet_path || null;
      const ref1 = attachedChars[0]?.ref_body_path || attachedChars[0]?.ref_action_path || null;
      const ref2 = attachedLoc?.ref_main_path || attachedChars[1]?.ref_sheet_path || null;
      const ref3 = attachedLoc?.ref_alt_path || attachedChars[0]?.ref_expression_path || null;

      const compiledPrompt = [
        `${shot.framing || "Medium Shot"}, ${shot.camera_movement || "Static"}.`,
        shot.action_notes || "Cinematic anime shot.",
        attachedChars.length > 0
          ? `Cast: ${attachedChars.map((c) => `${c.name} (${c.role || "Character"})`).join(". ")}.`
          : "",
        attachedLoc ? `Environment: ${attachedLoc.name} (${attachedLoc.time_of_day || "Default"}).` : "",
        "Masterpiece anime, 8k resolution, crisp turnaround geometry, cinematic lighting.",
      ]
        .filter(Boolean)
        .join(" ");

      const res = await fetch("/api/engine/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shot_id: shot.id,
          prompt: compiledPrompt,
          duration: shot.duration || 3.0,
          fps: 24,
          ref_images: [ref0, ref1, ref2, ref3].filter(Boolean),
          steps: 4,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Render submission failed");
      }

      setActivePromptId(data.prompt_id);
      setStatusMessage(`Render submitted for Shot ${shot.shot_number} [Prompt ID: ${data.prompt_id}]`);

      // Refresh shots
      fetchShots(activeSceneId);
    } catch (err: any) {
      console.error("Render error:", err);
      setStatusMessage(`Error: ${err.message || "Failed to render"}`);
      setIsRendering(false);
      setRenderingShotId(null);
    }
  };

  // Custom Directorial Render from modal
  const handleDirectorialRender = async (payload: any) => {
    setIsRendering(true);
    setStatusMessage("Submitting custom directorial take...");

    try {
      const res = await fetch("/api/engine/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Directorial render failed");
      }

      setActivePromptId(data.prompt_id);
      setStatusMessage(`Render dispatched [Prompt ID: ${data.prompt_id}]`);
      if (payload.shot_id) {
        fetchShots(activeSceneId);
      }
    } catch (err: any) {
      console.error("Directorial render error:", err);
      setStatusMessage(`Error: ${err.message || "Render failed"}`);
      setIsRendering(false);
    }
  };

  // Batch Render All Shots in Current Scene
  const handleBatchRenderAll = async () => {
    if (shots.length === 0) return;
    if (!confirm(`Queue batch render for all ${shots.length} shots in Scene ${activeScene?.scene_number}?`)) return;

    setIsRendering(true);
    setStatusMessage(`Starting batch render for ${shots.length} shots...`);

    for (let i = 0; i < shots.length; i++) {
      const s = shots[i];
      setBatchIndex(i + 1);
      setStatusMessage(`Queueing shot ${i + 1}/${shots.length}: Shot ${s.shot_number}...`);
      await handleRenderShot(s);
      // Small pause between queuing
      await new Promise((r) => setTimeout(r, 1200));
    }

    setBatchIndex(null);
    setStatusMessage(`All ${shots.length} shots queued to ComfyUI execution queue.`);
  };

  // Interrupt active render
  const handleInterrupt = async () => {
    try {
      const res = await fetch("/api/engine/queue", { method: "DELETE" });
      const data = await res.json();
      setStatusMessage(data.message || "Interrupt signal sent to ComfyUI.");
      setIsRendering(false);
      setRenderingShotId(null);
    } catch (err: any) {
      console.error("Failed to interrupt:", err);
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6 max-w-[1800px] mx-auto w-full font-mono pb-24">
      {/* Top Banner & Multi-Shot Director Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-[#121215] border border-[#27272a]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-[#3b82f6]/20 border border-[#3b82f6]/40 text-[#3b82f6] text-[10px] font-bold uppercase tracking-wider">
              MULTI-SHOT DIRECTOR
            </span>
            <span className="text-xs text-[#71717a]">
              SCENE {activeScene?.scene_number?.toString().padStart(2, "0") || "01"} // {shots.length} SHOTS
            </span>
            <span className="text-[#3f3f46]">|</span>
            <span className="text-xs text-[#10b981]">
              TOTAL: {totalDuration.toFixed(1)}s ({totalFrames}f)
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#fafafa] mt-1 tracking-wide">
            STORYBOARD DIRECTOR & HUD
          </h1>
          <p className="text-xs text-[#a1a1aa] mt-0.5">
            Direct multi-shot sequences, anchor character/set references, and execute Turbo 4-step MiniMax H3 takes.
          </p>
        </div>

        {/* Global Director Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setEditingShot(null);
              setIsShotModalOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#18181b] hover:bg-[#27272a] border border-[#3f3f46] text-xs font-bold text-[#fafafa] transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-[#3b82f6]" />
            <span>APPEND SHOT</span>
          </button>

          <button
            type="button"
            onClick={handleBatchRenderAll}
            disabled={isRendering || shots.length === 0}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors shadow-lg",
              isRendering
                ? "bg-[#18181b] border border-[#3f3f46] text-[#71717a] cursor-not-allowed"
                : "bg-[#f59e0b] hover:bg-[#d97706] text-black"
            )}
          >
            <Flame className="w-4 h-4" />
            <span>
              {isRendering
                ? batchIndex
                  ? `BATCH RENDERING [${batchIndex}/${shots.length}]`
                  : "RENDERING..."
                : `BATCH RENDER ALL (${shots.length} SHOTS)`}
            </span>
          </button>
        </div>
      </div>

      {/* Status Alert if any */}
      {statusMessage && (
        <div className="p-3 bg-[#18181b] border border-[#27272a] text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#3b82f6] shrink-0" />
            <span className="text-[#fafafa]">{statusMessage}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-[10px] text-[#71717a] hover:text-[#fafafa]"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* Scene Navigator Bar */}
      <div className="p-4 bg-[#121215] border border-[#27272a] space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <Clapperboard className="w-4 h-4 text-[#3b82f6]" />
            <span className="text-xs font-bold text-[#fafafa] uppercase tracking-wider">
              SCENE NAVIGATOR
            </span>
          </div>

          <div className="flex items-center gap-2">
            {activeScene && (
              <button
                type="button"
                onClick={() => {
                  setEditingScene(activeScene);
                  setIsSceneModalOpen(true);
                }}
                className="flex items-center gap-1 px-2 py-1 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-[10px] text-[#a1a1aa] hover:text-[#fafafa] transition-colors"
              >
                <Edit2 className="w-3 h-3" />
                <span>EDIT SCENE METADATA</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setEditingScene(null);
                setIsSceneModalOpen(true);
              }}
              className="flex items-center gap-1 px-2.5 py-1 bg-[#3b82f6]/20 hover:bg-[#3b82f6]/30 border border-[#3b82f6]/40 text-[10px] font-bold text-[#3b82f6] transition-colors"
            >
              <FolderPlus className="w-3 h-3" />
              <span>NEW SCENE</span>
            </button>
          </div>
        </div>

        {/* Scene Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {scenes.map((scene) => {
            const isSelected = scene.id === activeSceneId;
            return (
              <button
                key={scene.id}
                type="button"
                onClick={() => {
                  setActiveSceneId(scene.id);
                  fetchShots(scene.id);
                }}
                className={cn(
                  "px-4 py-2 border text-xs font-bold uppercase transition-all flex items-center gap-2 shrink-0",
                  isSelected
                    ? "bg-[#18181b] border-[#3b82f6] text-[#fafafa] ring-1 ring-[#3b82f6]/50 shadow-md"
                    : "bg-[#09090b] border-[#27272a] text-[#71717a] hover:border-[#3f3f46] hover:text-[#a1a1aa]"
                )}
              >
                <span className={cn("text-[10px]", isSelected ? "text-[#3b82f6]" : "text-[#52525b]")}>
                  SCENE {scene.scene_number.toString().padStart(2, "0")}
                </span>
                <span className="truncate max-w-[160px]">{scene.title}</span>
              </button>
            );
          })}
        </div>

        {/* Active Scene Metadata Details Banner */}
        {activeScene && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-3 bg-[#09090b] border border-[#27272a] space-y-1">
              <span className="text-[9px] text-[#71717a] uppercase font-bold">NARRATIVE SYNOPSIS</span>
              <p className="text-[#a1a1aa] line-clamp-2">
                {activeScene.synopsis || "No scene synopsis specified."}
              </p>
            </div>

            <div className="p-3 bg-[#09090b] border border-[#27272a] space-y-1">
              <span className="text-[9px] text-[#71717a] uppercase font-bold">PROMPT SCRIPT NOTES</span>
              <p className="text-[#a1a1aa] line-clamp-2">
                {activeScene.prompt_script || "No prompt script notes recorded."}
              </p>
            </div>

            <div className="p-3 bg-[#09090b] border border-[#27272a] space-y-1">
              <span className="text-[9px] text-[#71717a] uppercase font-bold flex items-center gap-1">
                <Volume2 className="w-3 h-3 text-[#3b82f6]" />
                <span>SYNCHRONIZED AUDIO & FOLEY PROFILE</span>
              </span>
              <p className="text-[#10b981] line-clamp-2">
                {activeScene.audio_foley || "Ambient neon hum, cybernetic audio cues"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Storyboard Shots Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#fafafa]">
              SHOT SEQUENCE ({shots.length} TOTAL)
            </h2>
            <span className="text-xs text-[#71717a] font-mono">
              // Timeline sequence at 24fps
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingShot(null);
              setIsShotModalOpen(true);
            }}
            className="text-xs text-[#3b82f6] hover:underline flex items-center gap-1 font-bold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>ADD SHOT</span>
          </button>
        </div>

        {shots.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {shots.map((shot, idx) => {
              // Calculate cumulative start time
              let cumTime = 0;
              for (let i = 0; i < idx; i++) {
                cumTime += shots[i].duration || 5.0;
              }

              return (
                <ShotCard
                  key={shot.id}
                  shot={shot}
                  index={idx}
                  cumulativeStartTime={cumTime}
                  characters={characters}
                  locations={locations}
                  fps={24}
                  isActive={activeShotId === shot.id}
                  isRendering={isRendering && renderingShotId === shot.id}
                  onSelect={() => setActiveShotId(shot.id)}
                  onEdit={(s) => {
                    setEditingShot(s);
                    setIsShotModalOpen(true);
                  }}
                  onDelete={async (id) => {
                    if (!confirm(`Delete Shot ${shot.shot_number}?`)) return;
                    await fetch(`/api/shots?id=${encodeURIComponent(id)}`, { method: "DELETE" });
                    fetchShots(activeSceneId);
                  }}
                  onRender={handleRenderShot}
                  onOpenPromptDoctor={(s) => {
                    setPromptDoctorShot(s);
                    setIsPromptDoctorOpen(true);
                  }}
                />
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 bg-[#121215] border border-dashed border-[#27272a] space-y-3 text-center">
            <Film className="w-10 h-10 text-[#52525b]" />
            <h3 className="text-sm font-bold text-[#fafafa] uppercase">NO SHOTS IN SCENE</h3>
            <p className="text-xs text-[#71717a] max-w-md">
              This scene does not have any storyboard shots defined yet. Add your first shot to configure camera framing, duration, and 4-step Turbo takes.
            </p>
            <button
              type="button"
              onClick={() => {
                setEditingShot(null);
                setIsShotModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs font-bold uppercase tracking-wider transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>CREATE FIRST SHOT</span>
            </button>
          </div>
        )}
      </div>

      {/* Live Studio Console HUD */}
      <LiveStudioHUD
        activeShotName={
          shots.find((s) => s.id === activeShotId)
            ? `SHOT_${shots.find((s) => s.id === activeShotId)?.shot_number}`
            : "ACTIVE_SHOT"
        }
        isRendering={isRendering}
        onTriggerRender={() => {
          const targetShot = shots.find((s) => s.id === activeShotId) || shots[0];
          if (targetShot) {
            handleRenderShot(targetShot);
          } else {
            setStatusMessage("No shot selected to render. Append a shot first.");
          }
        }}
        onInterrupt={handleInterrupt}
        promptId={activePromptId}
      />

      {/* Modals */}
      <ShotEditorModal
        isOpen={isShotModalOpen}
        onClose={() => {
          setIsShotModalOpen(false);
          setEditingShot(null);
        }}
        shot={editingShot}
        sceneId={activeSceneId}
        characters={characters}
        locations={locations}
        onSaved={() => fetchShots(activeSceneId)}
        onDeleted={() => fetchShots(activeSceneId)}
        onRenderNow={handleDirectorialRender}
        fps={24}
      />

      <PromptDoctorModal
        isOpen={isPromptDoctorOpen}
        onClose={() => {
          setIsPromptDoctorOpen(false);
          setPromptDoctorShot(null);
        }}
        shot={promptDoctorShot}
        characters={characters}
        locations={locations}
        onApplyPrompt={async (newActionNotes) => {
          if (promptDoctorShot) {
            await fetch("/api/shots", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: promptDoctorShot.id,
                action_notes: newActionNotes,
              }),
            });
            fetchShots(activeSceneId);
          }
        }}
      />

      <SceneEditorModal
        isOpen={isSceneModalOpen}
        onClose={() => {
          setIsSceneModalOpen(false);
          setEditingScene(null);
        }}
        scene={editingScene}
        projectId="proj_neo_tokyo_2088"
        onSaved={fetchData}
        onDeleted={fetchData}
      />
    </div>
  );
}
