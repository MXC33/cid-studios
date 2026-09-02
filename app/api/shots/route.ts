import { NextRequest, NextResponse } from "next/server";
import {
  getAllShots,
  getShotsBySceneId,
  getShotById,
  createShot,
  updateShot,
  deleteShot,
  getSceneById,
} from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const sceneId = searchParams.get("scene_id");

    if (id) {
      const shot = getShotById(id);
      if (!shot) {
        return NextResponse.json(
          { success: false, error: "Shot not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, shot });
    }

    if (sceneId) {
      const shots = getShotsBySceneId(sceneId);
      return NextResponse.json({ success: true, shots });
    }

    const shots = getAllShots();
    return NextResponse.json({ success: true, shots });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch shots" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      scene_id,
      shot_number,
      duration = 5.0,
      framing,
      camera_movement,
      action_notes,
      character_ids,
      location_id,
    } = body;

    if (!scene_id) {
      return NextResponse.json(
        { success: false, error: "scene_id is required" },
        { status: 400 }
      );
    }

    const scene = getSceneById(scene_id);
    if (!scene) {
      return NextResponse.json(
        { success: false, error: "Referenced scene not found" },
        { status: 404 }
      );
    }

    let resolvedShotNumber = shot_number;
    if (resolvedShotNumber === undefined || resolvedShotNumber === null) {
      const existingShots = getShotsBySceneId(scene_id);
      resolvedShotNumber = existingShots.length > 0
        ? Math.max(...existingShots.map((s) => s.shot_number)) + 1
        : 1;
    }

    const id = body.id || `shot_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const shot = createShot({
      id,
      scene_id,
      shot_number: Number(resolvedShotNumber),
      duration: Number(duration),
      framing: framing || null,
      camera_movement: camera_movement || null,
      action_notes: action_notes || null,
      character_ids: typeof character_ids === "object" ? JSON.stringify(character_ids) : character_ids || null,
      location_id: location_id || null,
    });

    return NextResponse.json({ success: true, shot });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create shot" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Shot ID is required for update" },
        { status: 400 }
      );
    }

    const existing = getShotById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Shot not found" },
        { status: 404 }
      );
    }

    if (updates.shot_number !== undefined) {
      updates.shot_number = Number(updates.shot_number);
    }
    if (updates.duration !== undefined) {
      updates.duration = Number(updates.duration);
    }
    if (updates.character_ids !== undefined && typeof updates.character_ids === "object") {
      updates.character_ids = JSON.stringify(updates.character_ids);
    }

    const updated = updateShot(id, updates);
    return NextResponse.json({ success: true, shot: updated });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update shot" },
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
        id = body?.id;
      } catch {
        // no body
      }
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Shot ID is required for deletion" },
        { status: 400 }
      );
    }

    const deleted = deleteShot(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Shot not found or could not be deleted" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, deleted_id: id });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to delete shot" },
      { status: 500 }
    );
  }
}
