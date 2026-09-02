import { NextRequest, NextResponse } from "next/server";
import { getQueue, cancelJob } from "@/lib/comfy/client";
import { stopCaffeinate } from "@/lib/comfy/caffeinate";
import { getQueueJobs } from "@/lib/db";

export async function GET() {
  try {
    let comfyQueue = null;
    let comfyError = null;

    try {
      comfyQueue = await getQueue();
    } catch (err: any) {
      comfyError = err.message;
    }

    const localJobs = getQueueJobs();

    return NextResponse.json({
      success: true,
      comfy: comfyQueue,
      comfy_error: comfyError,
      db_jobs: localJobs,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch queue" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const promptId = searchParams.get("prompt_id") || undefined;

    const cancelResult = await cancelJob(promptId);
    stopCaffeinate();

    return NextResponse.json({
      success: cancelResult.success,
      message: cancelResult.message,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to cancel job" },
      { status: 500 }
    );
  }
}
