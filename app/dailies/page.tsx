"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Play,
  SlidersHorizontal,
  FolderSync,
  Star,
  Film,
  Sparkles,
  Layers,
  Filter,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  ExternalLink,
  Plus,
  Trash2,
  Eye,
  Sliders,
} from "lucide-react";
import { Take, Shot, Scene } from "@/lib/db/schema";
import { TakePlayerModal } from "@/components/dailies/TakePlayerModal";
import { TakeComparatorModal } from "@/components/dailies/TakeComparatorModal";
import { cn } from "@/lib/utils";

interface EnrichedTake extends Take {
  parsed_metadata?: Record<string, any>;
  shot?: Shot;
  scene?: Scene;
}

export default function DailiesPage() {
  const [takes, setTakes] = useState<EnrichedTake[]>([]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [shots, setShots] = useState<Shot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // Filters
  const [sceneFilter, setSceneFilter] = useState<string>("ALL");
  const [shotFilter, setShotFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [starredFilter, setStarredFilter] = useState<boolean>(false);

  // Modals & Selection
  const [activePlayerTake, setActivePlayerTake] = useState<EnrichedTake | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState<boolean>(false);

  const [isComparatorOpen, setIsComparatorOpen] = useState<boolean>(false);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);

  // Load all takes, scenes, and shots
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [takesRes, scenesRes, shotsRes] = await Promise.all([
        fetch("/api/takes"),
        fetch("/api/scenes"),
        fetch("/api/shots"),
      ]);

      const takesData = await takesRes.json();
      const scenesData = await scenesRes.json();
      const shotsData = await shotsRes.json();

      if (takesData.success && takesData.takes) {
        setTakes(takesData.takes);
      }

      if (scenesData.success && scenesData.scenes) {
        setScenes(scenesData.scenes);
      }

      if (shotsData.success && shotsData.shots) {
        setShots(shotsData.shots);
      }
    } catch (err) {
      console.error("Failed to load dailies data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Scan local directories
  const handleScanDisks = async () => {
    setIsScanning(true);
    setStatusNotification("Scanning /Users/mxc/ComfyUI-Shared/output/video/ for MP4 renders...");
    try {
      const res = await fetch("/api/takes/scan", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setStatusNotification(
          `Scan completed: Found ${data.scanned_count} files, registered ${data.registered_count} new takes.`
        );
        await loadData();
      } else {
        setStatusNotification(`Scan failed: ${data.error}`);
      }
    } catch (err: any) {
      setStatusNotification(`Scan error: ${err.message}`);
    } finally {
      setIsScanning(false);
      setTimeout(() => setStatusNotification(null), 5000);
    }
  };

  // Toggle compare selection
  const toggleCompareSelect = (takeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedForCompare((prev) => {
      if (prev.includes(takeId)) {
        return prev.filter((id) => id !== takeId);
      } else {
        if (prev.length >= 4) {
          return [...prev.slice(1), takeId];
        }
        return [...prev, takeId];
      }
    });
  };

  // Star / Favorite toggle
  const toggleStar = async (take: EnrichedTake, e: React.MouseEvent) => {
    e.stopPropagation();
    const meta = take.parsed_metadata || (take.metadata ? JSON.parse(take.metadata) : {});
    const nextStarred = !meta.starred;

    try {
      const res = await fetch("/api/takes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: take.id,
          starred: nextStarred,
        }),
      });
      const data = await res.json();
      if (data.success && data.take) {
        setTakes((prev) => prev.map((t) => (t.id === take.id ? data.take : t)));
      }
    } catch (err) {
      console.error("Failed to toggle star:", err);
    }
  };

  // Delete take
  const handleDeleteTake = async (takeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to remove this take from Dailies?")) return;

    try {
      const res = await fetch(`/api/takes?id=${encodeURIComponent(takeId)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setTakes((prev) => prev.filter((t) => t.id !== takeId));
        setSelectedForCompare((prev) => prev.filter((id) => id !== takeId));
      }
    } catch (err) {
      console.error("Failed to delete take:", err);
    }
  };

  // Filter takes
  const filteredTakes = takes.filter((take) => {
    if (sceneFilter !== "ALL") {
      if (take.scene?.id !== sceneFilter && take.shot?.scene_id !== sceneFilter) {
        return false;
      }
    }

    if (shotFilter !== "ALL") {
      if (take.shot_id !== shotFilter) {
        return false;
      }
    }

    if (statusFilter !== "ALL") {
      if (take.status !== statusFilter) {
        return false;
      }
    }

    if (starredFilter) {
      const meta = take.parsed_metadata || (take.metadata ? JSON.parse(take.metadata) : {});
      if (!meta.starred) {
        return false;
      }
    }

    return true;
  });

  const availableShotsForScene =
    sceneFilter === "ALL" ? shots : shots.filter((s) => s.scene_id === sceneFilter);

  return (
    <div className="flex-1 p-4 md:p-6 space-y-6 max-w-[1750px] mx-auto w-full">
      {/* Studio Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-[#121215] border border-[#27272a] shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-[#f59e0b]/20 border border-[#f59e0b]/40 text-[#f59e0b] text-[10px] font-mono font-bold uppercase tracking-wider">
              REVIEW & DAILIES
            </span>
            <span className="text-xs font-mono text-[#71717a]">MODULE 04</span>
          </div>
          <h1 className="text-2xl font-mono font-bold text-[#fafafa] mt-1">DAILIES & TAKE COMPARATOR</h1>
          <p className="text-xs text-[#a1a1aa] font-mono mt-0.5">
            Frame-accurate MP4 scrubbing, synchronized 2-up/4-up multi-take comparison, and master take timeline selection.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleScanDisks}
            disabled={isScanning}
            className="flex items-center gap-2 px-4 py-2 bg-[#18181b] hover:bg-[#27272a] border border-[#3f3f46] text-[#fafafa] text-xs font-mono font-bold uppercase tracking-wider transition-colors"
          >
            <FolderSync className={cn("w-4 h-4 text-[#f59e0b]", isScanning && "animate-spin")} />
            <span>{isScanning ? "SCANNING DISKS..." : "SCAN LOCAL TAKES"}</span>
          </button>

          <button
            onClick={() => setIsComparatorOpen(true)}
            disabled={takes.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors shadow-md disabled:opacity-50"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>
              {selectedForCompare.length > 0
                ? `COMPARE (${selectedForCompare.length} SELECTED)`
                : "MULTI-TAKE COMPARATOR"}
            </span>
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {statusNotification && (
        <div className="p-3 bg-[#18181b] border border-[#3b82f6] text-xs font-mono text-[#3b82f6] flex items-center justify-between animate-in fade-in">
          <span>{statusNotification}</span>
          <button onClick={() => setStatusNotification(null)} className="text-[#a1a1aa] hover:text-white">
            ×
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="p-4 bg-[#121215] border border-[#27272a] flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-mono text-[#a1a1aa]">
            <Filter className="w-3.5 h-3.5 text-[#3b82f6]" />
            <span className="uppercase font-bold">FILTERS:</span>
          </div>

          {/* Scene Filter */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-mono text-[#71717a]">SCENE:</span>
            <select
              value={sceneFilter}
              onChange={(e) => {
                setSceneFilter(e.target.value);
                setShotFilter("ALL");
              }}
              className="bg-[#18181b] border border-[#27272a] text-xs font-mono text-[#fafafa] px-2.5 py-1.5 focus:outline-none focus:border-[#3b82f6]"
            >
              <option value="ALL">ALL SCENES ({scenes.length})</option>
              {scenes.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  Scene {sc.scene_number}: {sc.title}
                </option>
              ))}
            </select>
          </div>

          {/* Shot Filter */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-mono text-[#71717a]">SHOT:</span>
            <select
              value={shotFilter}
              onChange={(e) => setShotFilter(e.target.value)}
              className="bg-[#18181b] border border-[#27272a] text-xs font-mono text-[#fafafa] px-2.5 py-1.5 focus:outline-none focus:border-[#3b82f6]"
            >
              <option value="ALL">ALL SHOTS ({availableShotsForScene.length})</option>
              {availableShotsForScene.map((sh) => (
                <option key={sh.id} value={sh.id}>
                  Shot {sh.shot_number} ({sh.framing || "Standard"})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-mono text-[#71717a]">STATUS:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#18181b] border border-[#27272a] text-xs font-mono text-[#fafafa] px-2.5 py-1.5 focus:outline-none focus:border-[#3b82f6]"
            >
              <option value="ALL">ALL STATUS</option>
              <option value="completed">COMPLETED</option>
              <option value="rendering">RENDERING</option>
              <option value="queued">QUEUED</option>
              <option value="failed">FAILED</option>
            </select>
          </div>

          {/* Starred Filter */}
          <button
            onClick={() => setStarredFilter(!starredFilter)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold uppercase border transition-colors",
              starredFilter
                ? "bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/40"
                : "bg-[#18181b] text-[#71717a] border-[#27272a] hover:text-[#fafafa]"
            )}
          >
            <Star className={cn("w-3.5 h-3.5", starredFilter && "fill-current")} />
            <span>STARRED ONLY</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[#a1a1aa]">
          <span>
            SHOWING <strong className="text-[#fafafa]">{filteredTakes.length}</strong> OF{" "}
            <strong>{takes.length}</strong> TAKES
          </span>
        </div>
      </div>

      {/* Takes Gallery Grid */}
      {isLoading ? (
        <div className="p-16 text-center space-y-3 bg-[#121215] border border-[#27272a]">
          <RefreshCw className="w-8 h-8 animate-spin text-[#3b82f6] mx-auto" />
          <p className="text-xs font-mono text-[#a1a1aa]">Loading dailies registry & video takes...</p>
        </div>
      ) : filteredTakes.length === 0 ? (
        <div className="p-16 text-center space-y-4 bg-[#121215] border border-[#27272a]">
          <Film className="w-12 h-12 text-[#3f3f46] mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-mono font-bold text-[#fafafa]">NO TAKES MATCH FILTER</h3>
            <p className="text-xs font-mono text-[#71717a] max-w-md mx-auto">
              Scan your local ComfyUI output directory to import generated video takes, or render shots from Storyboard.
            </p>
          </div>
          <button
            onClick={handleScanDisks}
            className="px-5 py-2.5 bg-[#f59e0b] hover:bg-[#d97706] text-black text-xs font-mono font-bold uppercase tracking-wider"
          >
            SCAN OUTPUT DIRECTORY NOW
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTakes.map((take) => {
            const meta =
              take.parsed_metadata || (take.metadata ? JSON.parse(take.metadata) : {});
            const isSelected = selectedForCompare.includes(take.id);
            const isStarred = Boolean(meta.starred);
            const videoSrc = take.video_path
              ? `/api/media?path=${encodeURIComponent(take.video_path)}`
              : "";

            return (
              <div
                key={take.id}
                onClick={() => {
                  setActivePlayerTake(take);
                  setIsPlayerOpen(true);
                }}
                className={cn(
                  "bg-[#121215] border transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden",
                  isSelected
                    ? "border-[#3b82f6] ring-1 ring-[#3b82f6]"
                    : "border-[#27272a] hover:border-[#3f3f46]"
                )}
              >
                {/* Take Header Bar */}
                <div className="p-3 bg-[#18181b] border-b border-[#27272a] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 bg-[#09090b] border border-[#27272a] text-[10px] font-mono font-bold text-[#fafafa]">
                      TAKE #{take.take_number.toString().padStart(2, "0")}
                    </span>
                    {take.shot && (
                      <span className="text-[10px] font-mono text-[#3b82f6]">
                        SHOT {take.shot.shot_number}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Compare Select Checkbox */}
                    <button
                      type="button"
                      onClick={(e) => toggleCompareSelect(take.id, e)}
                      title={isSelected ? "Remove from comparison" : "Select for multi-take comparison"}
                      className={cn(
                        "px-1.5 py-0.5 text-[9px] font-mono uppercase font-bold border transition-colors",
                        isSelected
                          ? "bg-[#3b82f6] text-white border-[#3b82f6]"
                          : "bg-[#09090b] text-[#71717a] border-[#27272a] hover:text-[#fafafa]"
                      )}
                    >
                      {isSelected ? "COMPARING" : "+ COMPARE"}
                    </button>

                    {/* Star Button */}
                    <button
                      type="button"
                      onClick={(e) => toggleStar(take, e)}
                      className={cn(
                        "p-1 border transition-colors",
                        isStarred
                          ? "bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/40"
                          : "bg-[#09090b] text-[#52525b] border-[#27272a] hover:text-[#f59e0b]"
                      )}
                    >
                      <Star className={cn("w-3.5 h-3.5", isStarred && "fill-current")} />
                    </button>
                  </div>
                </div>

                {/* Video Preview Viewport */}
                <div className="relative aspect-video bg-[#09090b] flex items-center justify-center overflow-hidden">
                  {videoSrc ? (
                    <video
                      src={videoSrc}
                      loop
                      muted
                      playsInline
                      preload="metadata"
                      onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                      onMouseLeave={(e) => {
                        e.currentTarget.pause();
                        e.currentTarget.currentTime = 0;
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <Film className="w-8 h-8 text-[#3f3f46] mx-auto mb-1" />
                      <span className="text-[10px] font-mono text-[#71717a]">
                        {take.status === "rendering" ? "RENDERING TAKE..." : "NO VIDEO FILE"}
                      </span>
                    </div>
                  )}

                  {/* Play Hover Indicator */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <div className="w-10 h-10 bg-[#3b82f6] text-white flex items-center justify-center shadow-lg">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>

                  {/* Top Left Status Badge */}
                  <div className="absolute top-2 left-2 pointer-events-none">
                    <span
                      className={cn(
                        "px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase",
                        take.status === "completed"
                          ? "bg-[#10b981]/80 text-white"
                          : take.status === "rendering"
                          ? "bg-[#3b82f6]/80 text-white animate-pulse"
                          : "bg-[#f59e0b]/80 text-black"
                      )}
                    >
                      {take.status}
                    </span>
                  </div>

                  {/* Bottom Right Duration & Resolution Badge */}
                  <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 text-[9px] font-mono text-[#fafafa] border border-[#27272a] pointer-events-none">
                    {take.duration}s • {take.resolution}
                  </div>
                </div>

                {/* Card Footer Technical Meta */}
                <div className="p-3 bg-[#121215] border-t border-[#27272a] space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[#71717a]">
                      SEED: <strong className="text-[#fafafa]">{take.seed}</strong>
                    </span>
                    <span className="text-[#10b981] font-bold">{take.steps} Turbo Steps</span>
                  </div>

                  {/* Notes / Rating preview */}
                  <div className="flex items-center justify-between text-[10px] font-mono pt-1.5 border-t border-[#1e1e22]">
                    <div className="flex items-center gap-0.5 text-[#f59e0b]">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={cn(
                            "w-2.5 h-2.5",
                            s <= (meta.rating || 0)
                              ? "text-[#f59e0b] fill-current"
                              : "text-[#3f3f46]"
                          )}
                        />
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteTake(take.id, e)}
                      title="Delete Take"
                      className="text-[#52525b] hover:text-[#ef4444] transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Take Player Modal */}
      <TakePlayerModal
        take={activePlayerTake}
        isOpen={isPlayerOpen}
        onClose={() => {
          setIsPlayerOpen(false);
          setActivePlayerTake(null);
        }}
        onTakeUpdated={(updated) => {
          setTakes((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
          setActivePlayerTake(updated);
        }}
        onSendToTimeline={(take) => {
          setStatusNotification(`Take #${take.take_number} assigned to NLE Timeline master track.`);
          setTimeout(() => setStatusNotification(null), 4000);
        }}
      />

      {/* Multi-Take Comparator Modal */}
      <TakeComparatorModal
        takes={takes}
        initialTakeIds={selectedForCompare}
        isOpen={isComparatorOpen}
        onClose={() => setIsComparatorOpen(false)}
        onSelectMaster={(masterTake) => {
          toggleStar(masterTake, { stopPropagation: () => {} } as any);
          setStatusNotification(
            `Marked Take #${masterTake.take_number} as selected master for Shot ${masterTake.shot?.shot_number || ""}`
          );
          setTimeout(() => setStatusNotification(null), 4000);
        }}
      />
    </div>
  );
}
