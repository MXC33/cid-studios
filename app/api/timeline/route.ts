import { NextRequest, NextResponse } from "next/server";
import {
  getTimelineClips,
  saveTimelineClips,
  addTimelineClip,
  deleteTimelineClip,
  clearTimelineClips,
  getTakeById,
  getShotById,
  getSceneById,
} from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") || "proj_neo_tokyo_2088";

    const clips = getTimelineClips(projectId);

    // Enrich clips with take/shot/scene metadata if take_id is present
    const enrichedClips = clips.map((clip) => {
      let takeInfo = null;
      let shotInfo = null;
      let sceneInfo = null;

      if (clip.take_id) {
        const take = getTakeById(clip.take_id);
        if (take) {
          takeInfo = take;
          if (take.shot_id) {
            const shot = getShotById(take.shot_id);
            if (shot) {
              shotInfo = shot;
              if (shot.scene_id) {
                const scene = getSceneById(shot.scene_id);
                if (scene) {
                  sceneInfo = scene;
                }
              }
            }
          }
        }
      }

      return {
        ...clip,
        take: takeInfo,
        shot: shotInfo,
        scene: sceneInfo,
      };
    });

    return NextResponse.json({
      success: true,
      clips: enrichedClips,
    });
  } catch (error: any) {
    console.error("GET /api/timeline error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get timeline clips" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const projectId = body.projectId || "proj_neo_tokyo_2088";

    if (Array.isArray(body.clips)) {
      // Bulk save / replace full timeline sequence
      const saved = saveTimelineClips(projectId, body.clips);
      return NextResponse.json({
        success: true,
        clips: saved,
      });
    }

    if (body.clip) {
      // Single clip insert
      const newClip = addTimelineClip({
        ...body.clip,
        project_id: projectId,
        id: body.clip.id || `clip_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      });
      return NextResponse.json({
        success: true,
        clip: newClip,
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid payload: 'clips' array or 'clip' object required" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("POST /api/timeline error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save timeline" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const projectId = searchParams.get("projectId");

    if (id) {
      const deleted = deleteTimelineClip(id);
      return NextResponse.json({ success: deleted });
    }

    if (projectId) {
      const cleared = clearTimelineClips(projectId);
      return NextResponse.json({ success: cleared });
    }

    return NextResponse.json(
      { success: false, error: "id or projectId parameter required" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("DELETE /api/timeline error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete timeline clip" },
      { status: 500 }
    );
  }
}
