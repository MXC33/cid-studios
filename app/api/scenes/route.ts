import { NextRequest, NextResponse } from "next/server";
import {
  getAllScenes,
  getScenesByProjectId,
  getSceneById,
  createScene,
  updateScene,
  deleteScene,
  getAllProjects,
} from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const projectId = searchParams.get("project_id");

    if (id) {
      const scene = getSceneById(id);
      if (!scene) {
        return NextResponse.json(
          { success: false, error: "Scene not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, scene });
    }

    if (projectId) {
      const scenes = getScenesByProjectId(projectId);
      return NextResponse.json({ success: true, scenes });
    }

    // Default to active project scenes if exists, otherwise all
    const projects = getAllProjects();
    const activeProject = projects[0];
    const scenes = activeProject
      ? getScenesByProjectId(activeProject.id)
      : getAllScenes();

    return NextResponse.json({ success: true, scenes });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch scenes" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      project_id,
      scene_number,
      title,
      synopsis,
      prompt_script,
      audio_foley,
    } = body;

    if (!title) {
      return NextResponse.json(
        { success: false, error: "Scene title is required" },
        { status: 400 }
      );
    }

    let targetProjectId = project_id;
    if (!targetProjectId) {
      const projects = getAllProjects();
      targetProjectId = projects[0]?.id || "proj_neo_tokyo_2088";
    }

    // Calculate next scene number if omitted
    let resolvedSceneNumber = scene_number;
    if (resolvedSceneNumber === undefined || resolvedSceneNumber === null) {
      const existingScenes = getScenesByProjectId(targetProjectId);
      resolvedSceneNumber = existingScenes.length > 0
        ? Math.max(...existingScenes.map((s) => s.scene_number)) + 1
        : 1;
    }

    const id = body.id || `scene_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const scene = createScene({
      id,
      project_id: targetProjectId,
      scene_number: Number(resolvedSceneNumber),
      title,
      synopsis: synopsis || null,
      prompt_script: prompt_script || null,
      audio_foley: audio_foley || null,
    });

    return NextResponse.json({ success: true, scene });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create scene" },
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
        { success: false, error: "Scene ID is required for update" },
        { status: 400 }
      );
    }

    const existing = getSceneById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Scene not found" },
        { status: 404 }
      );
    }

    if (updates.scene_number !== undefined) {
      updates.scene_number = Number(updates.scene_number);
    }

    const updated = updateScene(id, updates);
    return NextResponse.json({ success: true, scene: updated });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update scene" },
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
        { success: false, error: "Scene ID is required for deletion" },
        { status: 400 }
      );
    }

    const deleted = deleteScene(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Scene not found or could not be deleted" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, deleted_id: id });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to delete scene" },
      { status: 500 }
    );
  }
}
