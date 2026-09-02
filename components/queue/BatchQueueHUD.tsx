"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Play,
  Square,
  RefreshCw,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Layers,
  Cpu,
  Clock,
  CheckCircle2,
  AlertCircle,
  Film,
  Zap,
} from "lucide-react";
import { QueueJob, Take, Shot, Scene } from "@/lib/db/schema";
import { EnqueueModal } from "@/components/queue/EnqueueModal";
import { cn } from "@/lib/utils";

interface EnrichedJob extends QueueJob {
  take?: Take;
  shot?: Shot;
}

export function BatchQueueHUD() {
  const [jobs, setJobs] = useState<EnrichedJob[]>([]);
  const [activeJob, setActiveJob] = useState<EnrichedJob | null>(null);
  const [pendingJobs, setPendingJobs] = useState<EnrichedJob[]>([]);
  const [caffeinateStatus, setCaffeinateStatus] = useState<any>(null);
  const [comfyQueue, setComfyQueue] = useState<any>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [shots, setShots] = useState<Shot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnqueueModalOpen, setIsEnqueueModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Polling for live queue telemetry
  const fetchQueueData = useCallback(async () => {
    try {
      const [queueRes, scenesRes, shotsRes] = await Promise.all([
        fetch("/api/queue/batch"),
        fetch("/api/scenes"),
        fetch("/api/shots"),
      ]);

      const queueData = await queueRes.json();
      const scenesData = await scenesRes.json();
      const shotsData = await shotsRes.json();

      if (queueData.success) {
        setJobs(queueData.jobs || []);
        setActiveJob(queueData.active_job || null);
        setPendingJobs(queueData.pending_jobs || []);
        setCaffeinateStatus(queueData.caffeinate || null);
        setComfyQueue(queueData.comfy_queue || null);
      }

      if (scenesData.success && scenesData.scenes) {
        setScenes(scenesData.scenes);
      }

      if (shotsData.success && shotsData.shots) {
        setShots(shotsData.shots);
      }
    } catch (err) {
      console.error("Queue polling error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueueData();
    const interval = setInterval(fetchQueueData, 2500);
    return () => clearInterval(interval);
  }, [fetchQueueData]);

  // Remove single job
  const handleRemoveJob = async (jobId: string) => {
    try {
      const res = await fetch(`/api/queue/batch?job_id=${encodeURIComponent(jobId)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setJobs((prev) => prev.filter((j) => j.id !== jobId));
        setPendingJobs((prev) => prev.filter((j) => j.id !== jobId));
      }
    } catch (err) {
      console.error("Failed to remove job:", err);
    }
  };

  // Clear all pending jobs
  const handleClearQueue = async () => {
    if (!confirm("Clear all queued render jobs?")) return;
    try {
      const res = await fetch("/api/queue/batch?clear_all=true", {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setNotification(`Cleared ${data.cleared_count || 0} queue jobs`);
        await fetchQueueData();
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (err) {
      console.error("Failed to clear queue:", err);
    }
  };

  // Reorder job up or down
  const handleMoveJob = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === pendingJobs.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const reordered = [...pendingJobs];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    setPendingJobs(reordered);
  };

  // Cancel / Interrupt ComfyUI Execution
  const handleInterruptRender = async () => {
    try {
      const res = await fetch("/api/engine/queue", { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setNotification("Interrupt signal dispatched to ComfyUI.");
        await fetchQueueData();
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (err) {
      console.error("Failed to interrupt render:", err);
    }
  };

  // Total queue estimated remaining time
  const estRemainingSeconds = (activeJob ? (activeJob.eta_seconds || 25) : 0) + pendingJobs.length * 30;

  return (
    <div className="space-y-6">
      {/* Studio Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-[#121215] border border-[#27272a] shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-[#10b981]/20 border border-[#10b981]/40 text-[#10b981] text-[10px] font-mono font-bold uppercase tracking-wider">
              BATCH RUNNER
            </span>
            <span className="text-xs font-mono text-[#71717a]">MODULE 06</span>
          </div>
          <h1 className="text-2xl font-mono font-bold text-[#fafafa] mt-1">
            OVERNIGHT BATCH QUEUE
          </h1>
          <p className="text-xs text-[#a1a1aa] font-mono mt-0.5">
            Automated multi-shot take generation with macOS caffeinate power guard & WebSocket live telemetry.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* macOS Caffeinate Power Status Indicator */}
          <div
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 border text-xs font-mono font-bold uppercase tracking-wider",
              caffeinateStatus?.active
                ? "bg-[#10b981]/15 text-[#10b981] border-[#10b981]/40"
                : "bg-[#18181b] text-[#71717a] border-[#27272a]"
            )}
          >
            {caffeinateStatus?.active ? (
              <>
                <ShieldCheck className="w-4 h-4 text-[#10b981]" />
                <span>CAFFEINATE ACTIVE (NO SLEEP)</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4 text-[#71717a]" />
                <span>CAFFEINATE STANDBY</span>
              </>
            )}
          </div>

          <button
            onClick={() => setIsEnqueueModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#10b981] hover:bg-[#059669] text-black text-xs font-mono font-bold uppercase tracking-wider transition-colors shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>ENQUEUE SCENE</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="p-3 bg-[#18181b] border border-[#10b981] text-xs font-mono text-[#10b981] flex items-center justify-between">
          <span>{notification}</span>
          <button onClick={() => setNotification(null)} className="text-[#a1a1aa] hover:text-white">
            ×
          </button>
        </div>
      )}

      {/* Active Render Monitor (Live Telemetry Card) */}
      <div className="bg-[#121215] border border-[#27272a] p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#3b82f6]" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-[#fafafa]">
              ACTIVE RENDER MONITOR
            </h2>
          </div>
          {activeJob && (
            <button
              onClick={handleInterruptRender}
              className="flex items-center gap-1.5 px-3 py-1 bg-[#ef4444]/20 hover:bg-[#ef4444]/30 border border-[#ef4444]/40 text-[#ef4444] text-xs font-mono font-bold uppercase transition-colors"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>INTERRUPT RENDER</span>
            </button>
          )}
        </div>

        {activeJob ? (
          <div className="p-4 bg-[#18181b] border border-[#3b82f6] space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 bg-[#3b82f6] animate-ping" />
                <div>
                  <div className="font-mono font-bold text-sm text-[#fafafa]">
                    JOB #{activeJob.id.substring(0, 14)} — {activeJob.shot ? `SHOT ${activeJob.shot.shot_number}` : "TAKE GENERATION"}
                  </div>
                  <div className="text-xs font-mono text-[#3b82f6] mt-0.5">
                    Executing Node: <strong>{activeJob.current_node || "MiniMaxH3ReferenceToVideo"}</strong>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="text-right">
                  <span className="text-[#71717a] block text-[10px]">PROGRESS</span>
                  <span className="text-[#fafafa] font-bold">
                    Step {activeJob.current_step} / {activeJob.total_steps || 4} [
                    {Math.round((activeJob.current_step / (activeJob.total_steps || 4)) * 100)}%]
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[#71717a] block text-[10px]">EST. REMAINING</span>
                  <span className="text-[#10b981] font-bold">
                    {activeJob.eta_seconds ? `${activeJob.eta_seconds.toFixed(1)}s` : "24.0s"}
                  </span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-[#0c0c0e] h-3 border border-[#27272a] overflow-hidden">
              <div
                className="bg-[#3b82f6] h-full transition-all duration-300"
                style={{
                  width: `${Math.max(
                    15,
                    Math.round(((activeJob.current_step || 1) / (activeJob.total_steps || 4)) * 100)
                  )}%`,
                }}
              />
            </div>
          </div>
        ) : (
          <div className="p-8 text-center bg-[#0e0e11] border border-[#1e1e22] space-y-2">
            <Cpu className="w-8 h-8 text-[#3f3f46] mx-auto" />
            <div className="text-xs font-mono text-[#a1a1aa]">GPU RENDER ENGINE IDLE</div>
            <p className="text-[11px] font-mono text-[#71717a]">
              No active job running. Click "ENQUEUE SCENE" to dispatch sequential renders.
            </p>
          </div>
        )}
      </div>

      {/* Pending Queue List */}
      <div className="bg-[#121215] border border-[#27272a] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#10b981]" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-[#fafafa]">
              PENDING QUEUE ({pendingJobs.length} ENQUEUED)
            </h2>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-[#71717a]">
              TOTAL REMAINING EST: <strong className="text-[#fafafa]">{estRemainingSeconds.toFixed(1)}s</strong>
            </span>

            {pendingJobs.length > 0 && (
              <button
                onClick={handleClearQueue}
                className="flex items-center gap-1 px-2.5 py-1 bg-[#18181b] hover:bg-[#27272a] border border-[#3f3f46] text-[#ef4444] text-[11px] font-mono uppercase transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                <span>CLEAR QUEUE</span>
              </button>
            )}
          </div>
        </div>

        {pendingJobs.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Film className="w-8 h-8 text-[#3f3f46] mx-auto" />
            <p className="text-xs font-mono text-[#71717a]">The render queue is currently empty.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingJobs.map((job, idx) => (
              <div
                key={job.id}
                className="p-3.5 bg-[#121215] border border-[#27272a] hover:border-[#3f3f46] flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 bg-[#09090b] border border-[#27272a] text-[10px] font-mono font-bold text-[#a1a1aa]">
                    #{idx + 1}
                  </span>
                  <div>
                    <div className="font-mono font-bold text-xs text-[#fafafa]">
                      JOB #{job.id.substring(0, 14)} — {job.shot ? `SHOT ${job.shot.shot_number}` : "TAKE VARIATION"}
                    </div>
                    <div className="text-[10px] font-mono text-[#71717a] mt-0.5">
                      MiniMax H3 (INT8) • 4-Step Turbo • Seed: {job.take?.seed || "Auto"} • {job.take?.resolution || "1344x768"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <span className="px-2 py-0.5 bg-[#18181b] text-[#71717a] border border-[#27272a] text-[10px] font-mono uppercase">
                    {idx === 0 ? "NEXT UP" : "PENDING"}
                  </span>

                  {/* Move Up */}
                  <button
                    onClick={() => handleMoveJob(idx, "up")}
                    disabled={idx === 0}
                    title="Move Up in Queue"
                    className="p-1.5 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-[#a1a1aa] hover:text-[#fafafa] disabled:opacity-30"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>

                  {/* Move Down */}
                  <button
                    onClick={() => handleMoveJob(idx, "down")}
                    disabled={idx === pendingJobs.length - 1}
                    title="Move Down in Queue"
                    className="p-1.5 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-[#a1a1aa] hover:text-[#fafafa] disabled:opacity-30"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  {/* Remove */}
                  <button
                    onClick={() => handleRemoveJob(job.id)}
                    title="Remove Job"
                    className="p-1.5 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-[#71717a] hover:text-[#ef4444] transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enqueue Modal */}
      <EnqueueModal
        isOpen={isEnqueueModalOpen}
        scenes={scenes}
        shots={shots}
        onClose={() => setIsEnqueueModalOpen(false)}
        onEnqueued={(count) => {
          setNotification(`Successfully enqueued ${count} takes for batch rendering.`);
          fetchQueueData();
          setTimeout(() => setNotification(null), 4000);
        }}
      />
    </div>
  );
}
