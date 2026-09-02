import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import {
  getAllTakes,
  getAllShots,
  createTake,
  getShotById,
  getTakesByShotId,
} from "@/lib/db";

const SCAN_DIRECTORIES = [
  "/Users/mxc/ComfyUI-Shared/output/video",
  "/Users/mxc/ComfyUI-Shared/output",
  "/Users/mxc/ComfyUI-Installs/ComfyUI/ComfyUI/output/video",
  path.join(process.cwd(), "public", "video"),
];

export async function POST(req: NextRequest) {
  return handleScan(req);
}

export async function GET(req: NextRequest) {
  return handleScan(req);
}

async function handleScan(req: NextRequest) {
  try {
    const existingTakes = getAllTakes();
    const existingPaths = new Set(
      existingTakes.flatMap((t) => [
        t.video_path,
        t.video_path ? path.basename(t.video_path) : null,
      ]).filter(Boolean)
    );

    const shots = getAllShots();
    const defaultShot = shots.length > 0 ? shots[0] : null;

    if (!defaultShot) {
      return NextResponse.json({
        success: false,
        error: "No storyboard shots found in database. Seed a shot before scanning.",
      }, { status: 400 });
    }

    const foundFiles: {
      filename: string;
      fullPath: string;
      size: number;
      createdTime: string;
    }[] = [];

    for (const dir of SCAN_DIRECTORIES) {
      if (!fs.existsSync(dir)) continue;

      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isFile() && entry.name.toLowerCase().endsWith(".mp4")) {
            const fullPath = path.join(dir, entry.name);
            const stat = fs.statSync(fullPath);
            foundFiles.push({
              filename: entry.name,
              fullPath,
              size: stat.size,
              createdTime: stat.birthtime ? stat.birthtime.toISOString() : stat.mtime.toISOString(),
            });
          }
        }
      } catch (err) {
        console.warn(`Error scanning directory ${dir}:`, err);
      }
    }

    // Sort found files by filename or modification time
    foundFiles.sort((a, b) => a.filename.localeCompare(b.filename));

    const newlyCreatedTakes = [];

    for (let i = 0; i < foundFiles.length; i++) {
      const file = foundFiles[i];
      // Check if already registered
      if (existingPaths.has(file.fullPath) || existingPaths.has(file.filename)) {
        continue;
      }

      // Distribute / associate takes across available shots
      // e.g. MiniMax_H3_00001 -> shot 1, MiniMax_H3_00002 -> shot 2, etc.
      const shotIndex = shots.length > 0 ? i % shots.length : 0;
      const targetShot = shots[shotIndex] || defaultShot;

      const currentShotTakes = getTakesByShotId(targetShot.id);
      const nextTakeNumber = currentShotTakes.length + 1;

      // Extract sequence or seed index from filename if available e.g. MiniMax_H3_00004_.mp4
      const numMatch = file.filename.match(/\d+/);
      const seedNum = numMatch ? 8820490000 + parseInt(numMatch[0], 10) : 8820491000 + i;

      const takeId = `take_scan_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`;

      const metadataObj = {
        fps: 24,
        total_frames: 73,
        lora_strength: 1.0,
        scheduler: "simple",
        sampler_name: "res_multistep",
        scanned_file: file.filename,
        file_size_bytes: file.size,
        rating: 4,
        starred: i === 0 || file.filename.includes("00004"), // star select take
        director_notes: `Auto-scanned master take from ${file.filename}. High visual fidelity.`,
      };

      const newTake = createTake({
        id: takeId,
        shot_id: targetShot.id,
        take_number: nextTakeNumber,
        prompt_id: `scanned_${file.filename}`,
        status: "completed",
        duration: targetShot.duration || 3.0,
        resolution: "1344x768",
        steps: 4,
        seed: seedNum,
        video_path: file.fullPath,
        audio_path: null,
        thumbnail_path: null,
        metadata: JSON.stringify(metadataObj),
      });

      existingPaths.add(file.fullPath);
      existingPaths.add(file.filename);
      newlyCreatedTakes.push(newTake);
    }

    const updatedAllTakes = getAllTakes();

    return NextResponse.json({
      success: true,
      scanned_count: foundFiles.length,
      files_found: foundFiles.map((f) => f.filename),
      registered_count: newlyCreatedTakes.length,
      new_takes: newlyCreatedTakes,
      total_takes: updatedAllTakes.length,
    });
  } catch (err: any) {
    console.error("POST /api/takes/scan error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to scan video takes" },
      { status: 500 }
    );
  }
}
