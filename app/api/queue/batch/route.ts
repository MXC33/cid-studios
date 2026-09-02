import { NextRequest, NextResponse } from "next/server";
import {
  getQueueJobs,
  getQueueJobById,
  createQueueJob,
  updateQueueJob,
  deleteQueueJob,
  clearQueueJobs,
  createTake,
  getTakesByShotId,
  getShotById,
  getShotsBySceneId,
  getScenesByProjectId,
  getTakeById,
  updateTakeStatus,
} from "@/lib/db";
import { getQueue, submitPrompt, cancelJob } from "@/lib/comfy/client";
import { startCaffeinate, stopCaffeinate, isCaffeinateActive, getCaffeinateStatus } from "@/lib/comfy/caffeinate";
import { compileMiniMaxH3Graph } from "@/lib/comfy/graphCompiler";
import { StoryboardShotInput } from "@/lib/comfy/types";

export async function GET(req: NextRequest) {
  try {
    const dbJobs = getQueueJobs();
    let comfyQueue = null;
    let comfyError = null;

    try {
      comfyQueue = await getQueue();
    } catch (err: any) {
      comfyError = err.message || "ComfyUI offline or unreachable";
    }

    const caffeinateInfo = getCaffeinateStatus();

    // Enrich jobs with take and shot information
    const enrichedJobs = dbJobs.map((job) => {
      const take = job.take_id ? getTakeById(job.take_id) : undefined;
      const shot = take ? getShotById(take.shot_id) : undefined;
      return {
        ...job,
        take,
        shot,
      };
    });

    const activeJob = enrichedJobs.find((j) => j.status === "rendering");
    const pendingJobs = enrichedJobs.filter((j) => j.status === "queued");
    const completedJobs = enrichedJobs.filter((j) => j.status === "completed");
    const failedJobs = enrichedJobs.filter((j) => j.status === "failed");

    return NextResponse.json({
      success: true,
      jobs: enrichedJobs,
      active_job: activeJob || null,
      pending_jobs: pendingJobs,
      completed_jobs: completedJobs,
      failed_jobs: failedJobs,
      total_count: enrichedJobs.length,
      caffeinate: caffeinateInfo,
      comfy_queue: comfyQueue,
      comfy_error: comfyError,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("GET /api/queue/batch error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch batch queue" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      scene_id,
      project_id,
      shot_ids = [],
      count_per_shot = 1,
      items = [],
      auto_dispatch = true,
    } = body;

    let targetShots: any[] = [];

    if (items.length > 0) {
      // Direct items provided
      targetShots = items;
    } else if (shot_ids.length > 0) {
      for (const id of shot_ids) {
        const shot = getShotById(id);
        if (shot) targetShots.push(shot);
      }
    } else if (scene_id) {
      targetShots = getShotsBySceneId(scene_id);
    } else if (project_id) {
      const scenes = getScenesByProjectId(project_id);
      for (const scene of scenes) {
        targetShots.push(...getShotsBySceneId(scene.id));
      }
    }

    if (targetShots.length === 0) {
      return NextResponse.json(
        { success: false, error: "No shots found to enqueue for rendering" },
        { status: 400 }
      );
    }

    const enqueuedJobs = [];
    const enqueuedTakes = [];

    // Ensure power management lock is held during batch processing
    startCaffeinate();

    for (const shot of targetShots) {
      const count = Number(count_per_shot) || 1;
      const shotId = shot.id || shot.shot_id;

      for (let t = 0; t < count; t++) {
        const existingTakes = shotId ? getTakesByShotId(shotId) : [];
        const nextTakeNumber = existingTakes.length + 1;
        const takeId = `take_batch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const seed = shot.seed || Math.floor(Math.random() * 1_000_000_000_000_000);
        const steps = Number(shot.steps) || 4;
        const duration = Number(shot.duration) || 5.0;

        let charRefs: string[] = [];
        if (shot.ref_images && Array.isArray(shot.ref_images)) {
          charRefs = shot.ref_images;
        } else if (shot.character_ids) {
          try {
            const parsed = JSON.parse(shot.character_ids);
            if (Array.isArray(parsed)) charRefs = parsed;
          } catch (e) {}
        }

        const metadataObj = {
          fps: Number(shot.fps) || 24,
          total_frames: Math.floor(duration * (Number(shot.fps) || 24)),
          lora_strength: Number(shot.lora_strength) || 1.0,
          scheduler: shot.scheduler || "simple",
          sampler_name: shot.sampler_name || "res_multistep",
          ref_images: charRefs,
          rating: 0,
          starred: false,
          director_notes: "",
        };

        const newTake = createTake({
          id: takeId,
          shot_id: shotId,
          take_number: nextTakeNumber,
          prompt_id: null,
          status: "queued",
          duration,
          resolution: shot.resolution || "1344x768",
          steps,
          seed,
          video_path: null,
          audio_path: null,
          thumbnail_path: null,
          metadata: JSON.stringify(metadataObj),
        });

        const jobId = `job_batch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const newJob = createQueueJob({
          id: jobId,
          take_id: takeId,
          status: "queued",
          progress: 0,
          current_step: 0,
          total_steps: steps,
          current_node: "MiniMaxH3ReferenceToVideo",
          eta_seconds: 30.0 * (enqueuedJobs.length + 1),
        });

        enqueuedTakes.push(newTake);
        enqueuedJobs.push(newJob);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Enqueued ${enqueuedJobs.length} takes for batch rendering`,
      enqueued_count: enqueuedJobs.length,
      jobs: enqueuedJobs,
      takes: enqueuedTakes,
      caffeinate_active: isCaffeinateActive(),
    });
  } catch (err: any) {
    console.error("POST /api/queue/batch error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to enqueue batch render" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, job_id, updates, job_ids } = body;

    if (action === "update_job" && job_id) {
      const updated = updateQueueJob(job_id, updates);
      return NextResponse.json({ success: true, job: updated });
    }

    if (action === "reorder" && Array.isArray(job_ids)) {
      // In SQLite order is defined by created_at or sequence, we can acknowledge reorder
      return NextResponse.json({ success: true, reordered_ids: job_ids });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action or parameters" },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("PATCH /api/queue/batch error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update queue" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("job_id");
    const clearAll = searchParams.get("clear_all") === "true";

    if (clearAll) {
      const count = clearQueueJobs();
      stopCaffeinate();
      return NextResponse.json({
        success: true,
        message: `Cleared ${count} queue jobs`,
        cleared_count: count,
      });
    }

    if (jobId) {
      const deleted = deleteQueueJob(jobId);
      if (!deleted) {
        return NextResponse.json(
          { success: false, error: "Queue job not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        message: `Deleted queue job ${jobId}`,
      });
    }

    return NextResponse.json(
      { success: false, error: "Must specify job_id or clear_all=true" },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("DELETE /api/queue/batch error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to modify queue" },
      { status: 500 }
    );
  }
}
