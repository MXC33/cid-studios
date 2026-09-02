import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { stitchTimeline, getMediaMetadata } from "@/lib/ffmpeg/stitcher";
import { ExportSettings, TimelineClipInput, AudioTrackInput } from "@/lib/ffmpeg/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const projectId = body.projectId || "proj_neo_tokyo_2088";
    const exportSettings: ExportSettings = body.exportSettings || {
      preset: "1080p",
      format: "mp4",
      fps: 24,
      normalizeAudio: true,
      exportToShared: true,
    };

    let videoClips: TimelineClipInput[] = body.videoClips || body.clips || [];
    let audioTracks: (TimelineClipInput | AudioTrackInput)[] = body.audioTracks || [];

    // Filter video clips if all tracks were passed in one flat array
    if (body.clips && !body.videoClips) {
      videoClips = body.clips.filter(
        (c: any) => !c.track_type || c.track_type === "video"
      );
      const nonVideoClips = body.clips.filter(
        (c: any) => c.track_type && c.track_type !== "video"
      );
      if (nonVideoClips.length > 0 && (!audioTracks || audioTracks.length === 0)) {
        audioTracks = nonVideoClips;
      }
    }

    if (videoClips.length === 0) {
      return NextResponse.json(
        { success: false, error: "No video clips provided for export." },
        { status: 400 }
      );
    }

    // Determine extension based on format
    let ext = "mp4";
    if (exportSettings.format === "prores") {
      ext = "mov";
    } else if (exportSettings.format === "webm") {
      ext = "webm";
    }

    const exportsDir = path.join(process.cwd(), "public", "exports");
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    const timestamp = Date.now();
    const cleanTitle = (exportSettings.customTitle || projectId || "master")
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "_");
    const filename = `${cleanTitle}_${timestamp}_${exportSettings.preset}.${ext}`;
    const outputPath = path.join(exportsDir, filename);

    const result = await stitchTimeline(
      videoClips,
      audioTracks,
      exportSettings,
      outputPath
    );

    return NextResponse.json({
      success: true,
      export: result,
    });
  } catch (error: any) {
    console.error("POST /api/export error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Master export render failed",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const exportsDir = path.join(process.cwd(), "public", "exports");
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
      return NextResponse.json({ success: true, exports: [] });
    }

    const files = fs.readdirSync(exportsDir).filter((f) => {
      const ext = path.extname(f).toLowerCase();
      return ext === ".mp4" || ext === ".mov" || ext === ".webm";
    });

    const exportsList = await Promise.all(
      files.map(async (filename) => {
        const fullPath = path.join(exportsDir, filename);
        const stats = fs.statSync(fullPath);
        let metadata = null;
        try {
          metadata = await getMediaMetadata(fullPath);
        } catch {
          // ignore if metadata fails
        }

        return {
          filename,
          fullPath,
          publicUrl: `/exports/${filename}`,
          size: stats.size,
          created_at: stats.birthtime.toISOString(),
          duration: metadata?.duration || 0,
          resolution: metadata?.width && metadata?.height ? `${metadata.width}x${metadata.height}` : null,
          fps: metadata?.fps || 24,
          format: path.extname(filename).replace(".", "").toUpperCase(),
        };
      })
    );

    // Sort descending by creation date
    exportsList.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json({
      success: true,
      exports: exportsList,
    });
  } catch (error: any) {
    console.error("GET /api/export error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to list exports" },
      { status: 500 }
    );
  }
}
