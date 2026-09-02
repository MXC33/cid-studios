import { NextRequest, NextResponse } from "next/server";
import { compileMiniMaxH3Graph } from "@/lib/comfy/graphCompiler";
import { submitPrompt } from "@/lib/comfy/client";
import { startCaffeinate } from "@/lib/comfy/caffeinate";
import {
  createTake,
  createQueueJob,
  getTakesByShotId,
} from "@/lib/db";
import { StoryboardShotInput } from "@/lib/comfy/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      shot_id,
      prompt,
      duration = 5.0,
      width = 1344,
      height = 768,
      steps = 4,
      seed,
      fps = 24,
      ref_images = [],
      lora_strength = 1.0,
      scheduler = "simple",
      sampler_name = "res_multistep",
      filename_prefix = "video/MiniMax_H3",
      compile_only = false,
    } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { success: false, error: "Prompt string is required" },
        { status: 400 }
      );
    }

    const resolvedSeed =
      seed !== undefined ? Number(seed) : Math.floor(Math.random() * 1_000_000_000_000_000);

    const shotInput: StoryboardShotInput = {
      prompt,
      duration: Number(duration),
      width: Number(width),
      height: Number(height),
      steps: Number(steps),
      seed: resolvedSeed,
      fps: Number(fps),
      ref_images,
      lora_strength: Number(lora_strength),
      scheduler,
      sampler_name,
      filename_prefix,
    };

    // Compile into ComfyUI API Prompt graph
    const compiledGraph = compileMiniMaxH3Graph(shotInput);

    if (compile_only) {
      return NextResponse.json({
        success: true,
        compiled: true,
        graph: compiledGraph,
        specs: shotInput,
      });
    }

    // Submit to ComfyUI
    const clientId = `cid_${Date.now()}`;
    const submitResult = await submitPrompt(compiledGraph, clientId);

    // Prevent Mac sleep during render
    startCaffeinate();

    // If connected to a storyboard shot in the database, record take and queue entry
    let takeRecord = null;
    let jobRecord = null;

    if (shot_id) {
      const existingTakes = getTakesByShotId(shot_id);
      const nextTakeNumber = existingTakes.length + 1;
      const takeId = `take_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      takeRecord = createTake({
        id: takeId,
        shot_id,
        take_number: nextTakeNumber,
        prompt_id: submitResult.prompt_id,
        status: "rendering",
        duration: Number(duration),
        resolution: `${width}x${height}`,
        steps: Number(steps),
        seed: resolvedSeed,
        metadata: JSON.stringify({
          fps,
          ref_images,
          scheduler,
          sampler_name,
          lora_strength,
        }),
      });

      const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      jobRecord = createQueueJob({
        id: jobId,
        take_id: takeId,
        status: "rendering",
        progress: 0,
        current_step: 0,
        total_steps: Number(steps),
        current_node: "MiniMaxH3ReferenceToVideo",
        eta_seconds: 30.0,
      });
    }

    return NextResponse.json({
      success: true,
      prompt_id: submitResult.prompt_id,
      number: submitResult.number,
      take: takeRecord,
      job: jobRecord,
      specs: shotInput,
    });
  } catch (err: any) {
    console.error("[RenderAPI] Error submitting render:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to submit render to ComfyUI",
      },
      { status: 500 }
    );
  }
}
