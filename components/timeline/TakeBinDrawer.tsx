"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Film,
  Play,
  Pause,
  Music,
  Mic,
  Wind,
  Layers,
  Sparkles,
  Volume2,
  Check,
  Search,
} from "lucide-react";
import { Take, Shot, Scene } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

interface EnrichedTake extends Take {
  shot?: Shot;
  scene?: Scene;
}

interface AudioLibraryItem {
  id: string;
  name: string;
  category: "dialogue" | "foley" | "music";
  filePath: string;
  duration: number;
  description: string;
}

const DEFAULT_AUDIO_LIBRARY: AudioLibraryItem[] = [
  {
    id: "sfx_store_chime",
    name: "Neo-Akiba Store Chime",
    category: "foley",
    filePath: "/audio/store_chime.wav",
    duration: 2.0,
    description: "Futuristic digital entrance chime for anime store",
  },
  {
    id: "sfx_rain_neon",
    name: "Rain & Neon Night Hum",
    category: "foley",
    filePath: "/audio/rain_neon_ambience.wav",
    duration: 8.0,
    description: "Atmospheric cybernetic rain slick and neon street hum",
  },
  {
    id: "ost_cyberpunk_drone",
    name: "Cyberpunk Tension Drone Score",
    category: "music",
    filePath: "/audio/cyberpunk_drone_score.wav",
    duration: 12.0,
    description: "Low-frequency analogue synth cue for suspense and retrieval",
  },
];

interface TakeBinDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onAddTakeToTimeline: (take: EnrichedTake) => void;
  onAddAudioToTimeline: (item: AudioLibraryItem, trackType: "audio_dialogue" | "audio_foley" | "audio_music") => void;
}

export function TakeBinDrawer({
  isOpen,
  onClose,
  projectId,
  onAddTakeToTimeline,
  onAddAudioToTimeline,
}: TakeBinDrawerProps) {
  const [activeTab, setActiveTab] = useState<"takes" | "audio">("takes");
  const [takes, setTakes] = useState<EnrichedTake[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewAudioId, setPreviewAudioId] = useState<string | null>(null);
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Load project takes
  useEffect(() => {
    if (!isOpen) return;

    const loadTakes = async () => {
      setLoading(true);
      try {
        const [takesRes, shotsRes, scenesRes] = await Promise.all([
          fetch(`/api/takes?projectId=${projectId}`),
          fetch(`/api/shots?projectId=${projectId}`),
          fetch(`/api/scenes?projectId=${projectId}`),
        ]);

        const takesData = await takesRes.json();
        const shotsData = await shotsRes.json();
        const scenesData = await scenesRes.json();

        const shotsMap = new Map<string, Shot>();
        (shotsData.shots || []).forEach((s: Shot) => shotsMap.set(s.id, s));

        const scenesMap = new Map<string, Scene>();
        (scenesData.scenes || []).forEach((sc: Scene) => scenesMap.set(sc.id, sc));

        const enriched: EnrichedTake[] = (takesData.takes || []).map((t: Take) => {
          const shot = shotsMap.get(t.shot_id);
          const scene = shot ? scenesMap.get(shot.scene_id) : undefined;
          return { ...t, shot, scene };
        });

        // Filter for completed or valid takes with video
        setTakes(enriched);
      } catch (err) {
        console.error("Failed to load takes for timeline bin:", err);
      } finally {
        setLoading(false);
      }
    };

    loadTakes();
  }, [isOpen, projectId]);

  // Audio preview toggle
  const handleToggleAudioPreview = (item: AudioLibraryItem) => {
    if (previewAudioId === item.id) {
      audioEl?.pause();
      setPreviewAudioId(null);
    } else {
      audioEl?.pause();
      const newAudio = new Audio(item.filePath);
      newAudio.play().catch(() => {});
      newAudio.onended = () => setPreviewAudioId(null);
      setAudioEl(newAudio);
      setPreviewAudioId(item.id);
    }
  };

  if (!isOpen) return null;

  const filteredTakes = takes.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.shot?.framing?.toLowerCase().includes(q) ||
      t.scene?.title?.toLowerCase().includes(q) ||
      `take ${t.take_number}`.includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#121215] border-l border-[#27272a] flex flex-col h-full shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 bg-[#18181b] border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#3b82f6]" />
            <h2 className="text-sm font-mono font-bold text-[#fafafa] uppercase">
              STUDIO MEDIA BIN & ASSETS
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#27272a] text-[#a1a1aa] hover:text-[#fafafa] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center border-b border-[#27272a] bg-[#0c0c0e] text-xs font-mono">
          <button
            onClick={() => setActiveTab("takes")}
            className={cn(
              "flex-1 py-2.5 flex items-center justify-center gap-2 font-bold transition-colors border-b-2",
              activeTab === "takes"
                ? "border-[#3b82f6] text-[#3b82f6] bg-[#18181b]"
                : "border-transparent text-[#a1a1aa] hover:text-[#fafafa]"
            )}
          >
            <Film className="w-3.5 h-3.5" />
            <span>RENDERED TAKES (V1)</span>
          </button>

          <button
            onClick={() => setActiveTab("audio")}
            className={cn(
              "flex-1 py-2.5 flex items-center justify-center gap-2 font-bold transition-colors border-b-2",
              activeTab === "audio"
                ? "border-[#10b981] text-[#10b981] bg-[#18181b]"
                : "border-transparent text-[#a1a1aa] hover:text-[#fafafa]"
            )}
          >
            <Music className="w-3.5 h-3.5" />
            <span>AUDIO & SFX (A1/A2/A3)</span>
          </button>
        </div>

        {/* Drawer Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* TAB 1: TAKES */}
          {activeTab === "takes" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 bg-[#18181b] border border-[#27272a] px-3 py-1.5 text-xs font-mono">
                <Search className="w-3.5 h-3.5 text-[#71717a]" />
                <input
                  type="text"
                  placeholder="Filter takes by shot, framing, scene..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-[#fafafa] placeholder-[#71717a] w-full"
                />
              </div>

              {loading ? (
                <div className="p-8 text-center text-xs font-mono text-[#71717a]">
                  Loading project takes...
                </div>
              ) : filteredTakes.length === 0 ? (
                <div className="p-8 text-center bg-[#18181b] border border-[#27272a] space-y-2">
                  <Film className="w-8 h-8 text-[#3f3f46] mx-auto" />
                  <p className="text-xs font-mono text-[#a1a1aa]">NO RENDERED TAKES FOUND</p>
                  <p className="text-[10px] font-mono text-[#71717a]">
                    Render shots in Storyboard or Dailies to populate your timeline bin.
                  </p>
                </div>
              ) : (
                filteredTakes.map((take) => (
                  <div
                    key={take.id}
                    className="p-3 bg-[#18181b] border border-[#27272a] hover:border-[#3b82f6] transition-colors flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-16 h-12 bg-black border border-[#27272a] flex items-center justify-center shrink-0 overflow-hidden relative">
                        {take.video_path ? (
                          <video
                            src={take.video_path.startsWith("/") ? take.video_path : `/api/media?path=${encodeURIComponent(take.video_path)}`}
                            className="w-full h-full object-cover"
                            muted
                            playsInline
                          />
                        ) : (
                          <Film className="w-4 h-4 text-[#52525b]" />
                        )}
                        <span className="absolute bottom-0.5 right-0.5 px-1 bg-black/80 text-[8px] font-mono text-[#38bdf8]">
                          {(take.duration || 3.0).toFixed(1)}s
                        </span>
                      </div>

                      <div className="flex flex-col overflow-hidden">
                        <span className="text-xs font-mono font-bold text-[#fafafa] truncate">
                          {take.shot?.framing || `Shot ${take.shot?.shot_number || "1"}`} (Take #{take.take_number})
                        </span>
                        <span className="text-[10px] font-mono text-[#71717a] truncate">
                          {take.scene?.title || "Scene 01"} | {take.resolution || "1344x768"}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onAddTakeToTimeline(take)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs font-mono font-bold transition-colors shrink-0 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>INSERT</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: AUDIO LIBRARY */}
          {activeTab === "audio" && (
            <div className="space-y-3">
              <p className="text-[11px] font-mono text-[#71717a]">
                High-fidelity studio audio elements, Foley sound design, and cyberpunk background cues:
              </p>

              {DEFAULT_AUDIO_LIBRARY.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-[#18181b] border border-[#27272a] hover:border-[#10b981] transition-colors space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleAudioPreview(item)}
                        className={cn(
                          "p-2 rounded border transition-colors",
                          previewAudioId === item.id
                            ? "bg-[#10b981] text-black border-[#10b981]"
                            : "bg-[#27272a] text-[#a1a1aa] hover:text-[#fafafa] border-[#3f3f46]"
                        )}
                        title="Preview audio cue"
                      >
                        {previewAudioId === item.id ? (
                          <Pause className="w-3.5 h-3.5" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current" />
                        )}
                      </button>

                      <div className="flex flex-col">
                        <span className="text-xs font-mono font-bold text-[#fafafa]">
                          {item.name}
                        </span>
                        <span className="text-[10px] font-mono text-[#a1a1aa]">
                          {item.description}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono text-[#10b981] font-semibold">
                      {item.duration.toFixed(1)}s
                    </span>
                  </div>

                  {/* Add to Tracks Buttons */}
                  <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-[#27272a] text-[10px] font-mono">
                    <span className="text-[#71717a] mr-1">ADD TO:</span>
                    <button
                      onClick={() => onAddAudioToTimeline(item, "audio_dialogue")}
                      className="px-2 py-1 bg-[#10b981]/20 hover:bg-[#10b981]/40 border border-[#10b981]/50 text-[#10b981] font-bold"
                    >
                      A1 (VOICE)
                    </button>
                    <button
                      onClick={() => onAddAudioToTimeline(item, "audio_foley")}
                      className="px-2 py-1 bg-[#06b6d4]/20 hover:bg-[#06b6d4]/40 border border-[#06b6d4]/50 text-[#06b6d4] font-bold"
                    >
                      A2 (FOLEY)
                    </button>
                    <button
                      onClick={() => onAddAudioToTimeline(item, "audio_music")}
                      className="px-2 py-1 bg-[#f59e0b]/20 hover:bg-[#f59e0b]/40 border border-[#f59e0b]/50 text-[#f59e0b] font-bold"
                    >
                      A3 (SCORE)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
