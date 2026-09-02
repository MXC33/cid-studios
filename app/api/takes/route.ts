import { NextRequest, NextResponse } from "next/server";
import {
  getAllTakes,
  getTakesByProjectId,
  getTakesByShotId,
  getTakeById,
  createTake,
  updateTake,
  deleteTake,
  getShotById,
  getSceneById,
} from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const takeId = searchParams.get("take_id") || searchParams.get("id");
    const shotId = searchParams.get("shot_id");
    const projectId = searchParams.get("project_id");
    const status = searchParams.get("status");
    const starredOnly = searchParams.get("starred") === "true";

    if (takeId) {
      const take = getTakeById(takeId);
      if (!take) {
        return NextResponse.json(
          { success: false, error: "Take not found" },
          { status: 404 }
        );
      }
      const shot = getShotById(take.shot_id);
      const scene = shot ? getSceneById(shot.scene_id) : undefined;
      return NextResponse.json({
        success: true,
        take: {
          ...take,
          shot,
          scene,
        },
      });
    }

    let takes = [];
    if (shotId) {
      takes = getTakesByShotId(shotId);
    } else if (projectId) {
      takes = getTakesByProjectId(projectId);
    } else {
      takes = getAllTakes();
    }

    if (status) {
      takes = takes.filter((t) => t.status === status);
    }

    // Enrich takes with shot & scene metadata for convenient UI rendering
    const enrichedTakes = takes.map((t) => {
      let parsedMetadata: Record<string, any> = {};
      try {
        if (t.metadata) {
          parsedMetadata = JSON.parse(t.metadata);
        }
      } catch (e) {
        // ignore json parse error
      }

      const shot = getShotById(t.shot_id);
      const scene = shot ? getSceneById(shot.scene_id) : undefined;

      return {
        ...t,
        parsed_metadata: parsedMetadata,
        shot,
        scene,
      };
    });

    const filtered = starredOnly
      ? enrichedTakes.filter((t) => Boolean(t.parsed_metadata?.starred))
      : enrichedTakes;

    return NextResponse.json({
      success: true,
      takes: filtered,
      count: filtered.length,
    });
  } catch (err: any) {
    console.error("GET /api/takes error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch takes" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      shot_id,
      take_number,
      prompt_id,
      status = "completed",
      duration = 5.0,
      resolution = "1344x768",
      steps = 4,
      seed,
      video_path,
      audio_path,
      thumbnail_path,
      metadata,
    } = body;

    if (!shot_id) {
      return NextResponse.json(
        { success: false, error: "shot_id is required" },
        { status: 400 }
      );
    }

    const resolvedTakeNumber =
      take_number !== undefined
        ? Number(take_number)
        : getTakesByShotId(shot_id).length + 1;

    const resolvedSeed =
      seed !== undefined
        ? Number(seed)
        : Math.floor(Math.random() * 1_000_000_000_000_000);

    const takeId = `take_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const metadataStr =
      typeof metadata === "object" && metadata !== null
        ? JSON.stringify(metadata)
        : metadata || null;

    const newTake = createTake({
      id: takeId,
      shot_id,
      take_number: resolvedTakeNumber,
      prompt_id: prompt_id ?? null,
      status,
      duration: Number(duration),
      resolution,
      steps: Number(steps),
      seed: resolvedSeed,
      video_path: video_path ?? null,
      audio_path: audio_path ?? null,
      thumbnail_path: thumbnail_path ?? null,
      metadata: metadataStr,
    });

    const shot = getShotById(newTake.shot_id);
    const scene = shot ? getSceneById(shot.scene_id) : undefined;

    return NextResponse.json({
      success: true,
      take: {
        ...newTake,
        shot,
        scene,
      },
    });
  } catch (err: any) {
    console.error("POST /api/takes error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create take" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      status,
      video_path,
      audio_path,
      thumbnail_path,
      metadata,
      rating,
      starred,
      director_notes,
      timeline_index,
      ...rest
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Take id is required" },
        { status: 400 }
      );
    }

    const existingTake = getTakeById(id);
    if (!existingTake) {
      return NextResponse.json(
        { success: false, error: "Take not found" },
        { status: 404 }
      );
    }

    // Merge metadata if special fields (rating, starred, director_notes, timeline_index) are passed
    let finalMetadata = existingTake.metadata;
    let metaObj: Record<string, any> = {};
    if (existingTake.metadata) {
      try {
        metaObj = JSON.parse(existingTake.metadata);
      } catch (e) {}
    }

    if (typeof metadata === "object" && metadata !== null) {
      metaObj = { ...metaObj, ...metadata };
    } else if (typeof metadata === "string") {
      try {
        metaObj = { ...metaObj, ...JSON.parse(metadata) };
      } catch (e) {
        metaObj.raw = metadata;
      }
    }

    if (rating !== undefined) metaObj.rating = Number(rating);
    if (starred !== undefined) metaObj.starred = Boolean(starred);
    if (director_notes !== undefined) metaObj.director_notes = String(director_notes);
    if (timeline_index !== undefined) metaObj.timeline_index = timeline_index;

    finalMetadata = JSON.stringify(metaObj);

    const updates: Record<string, any> = {
      ...rest,
      metadata: finalMetadata,
    };

    if (status !== undefined) updates.status = status;
    if (video_path !== undefined) updates.video_path = video_path;
    if (audio_path !== undefined) updates.audio_path = audio_path;
    if (thumbnail_path !== undefined) updates.thumbnail_path = thumbnail_path;

    const updated = updateTake(id, updates);
    const shot = updated ? getShotById(updated.shot_id) : undefined;
    const scene = shot ? getSceneById(shot.scene_id) : undefined;

    return NextResponse.json({
      success: true,
      take: {
        ...updated,
        parsed_metadata: metaObj,
        shot,
        scene,
      },
    });
  } catch (err: any) {
    console.error("PUT /api/takes error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update take" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id");

    if (!id) {
      try {
        const body = await req.json();
        id = body.id;
      } catch (e) {}
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Take id is required" },
        { status: 400 }
      );
    }

    const deleted = deleteTake(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Take not found or could not be deleted" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Take ${id} deleted successfully`,
    });
  } catch (err: any) {
    console.error("DELETE /api/takes error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to delete take" },
      { status: 500 }
    );
  }
}
