import { NextRequest, NextResponse } from "next/server";
import {
  getAllCharacters,
  getCharactersByProjectId,
  getCharacterById,
  createCharacter,
  updateCharacter,
  deleteCharacter,
  getAllProjects,
} from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const projectId = searchParams.get("project_id");

    if (id) {
      const character = getCharacterById(id);
      if (!character) {
        return NextResponse.json(
          { success: false, error: "Character not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, character });
    }

    if (projectId) {
      const characters = getCharactersByProjectId(projectId);
      return NextResponse.json({ success: true, characters });
    }

    // Default to active project characters if exists, otherwise all
    const projects = getAllProjects();
    const activeProject = projects[0];
    const characters = activeProject
      ? getCharactersByProjectId(activeProject.id)
      : getAllCharacters();

    return NextResponse.json({ success: true, characters });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch characters" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      project_id,
      role,
      description,
      voice_profile,
      ref_sheet_path,
      ref_body_path,
      ref_action_path,
      ref_expression_path,
    } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Character name is required" },
        { status: 400 }
      );
    }

    let targetProjectId = project_id;
    if (!targetProjectId) {
      const projects = getAllProjects();
      targetProjectId = projects[0]?.id || "proj_neo_tokyo_2088";
    }

    const id = body.id || `char_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const character = createCharacter({
      id,
      project_id: targetProjectId,
      name,
      role: role || null,
      description: description || null,
      voice_profile: voice_profile || null,
      ref_sheet_path: ref_sheet_path || null,
      ref_body_path: ref_body_path || null,
      ref_action_path: ref_action_path || null,
      ref_expression_path: ref_expression_path || null,
    });

    return NextResponse.json({ success: true, character });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create character" },
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
        { success: false, error: "Character ID is required for update" },
        { status: 400 }
      );
    }

    const existing = getCharacterById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Character not found" },
        { status: 404 }
      );
    }

    const updated = updateCharacter(id, updates);
    return NextResponse.json({ success: true, character: updated });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update character" },
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
        { success: false, error: "Character ID is required for deletion" },
        { status: 400 }
      );
    }

    const deleted = deleteCharacter(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Character not found or could not be deleted" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, deleted_id: id });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to delete character" },
      { status: 500 }
    );
  }
}
