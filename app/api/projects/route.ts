import { NextRequest, NextResponse } from "next/server";
import {
  getAllProjects,
  getProjectById,
  createProject,
  getCharactersByProjectId,
  getLocationsByProjectId,
  getScenesByProjectId,
  getShotsBySceneId,
} from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const project = getProjectById(id);
      if (!project) {
        return NextResponse.json(
          { success: false, error: "Project not found" },
          { status: 404 }
        );
      }

      const characters = getCharactersByProjectId(project.id);
      const locations = getLocationsByProjectId(project.id);
      const scenes = getScenesByProjectId(project.id).map((scene) => ({
        ...scene,
        shots: getShotsBySceneId(scene.id),
      }));

      return NextResponse.json({
        success: true,
        project: {
          ...project,
          characters,
          locations,
          scenes,
        },
      });
    }

    const projects = getAllProjects();
    const enrichedProjects = projects.map((p) => {
      const characters = getCharactersByProjectId(p.id);
      const locations = getLocationsByProjectId(p.id);
      const scenes = getScenesByProjectId(p.id).map((scene) => ({
        ...scene,
        shots: getShotsBySceneId(scene.id),
      }));

      return {
        ...p,
        characters,
        locations,
        scenes,
      };
    });

    return NextResponse.json({
      success: true,
      projects: enrichedProjects,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, slug, description, fps = 24, resolution = "1344x768" } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: "Name and slug are required" },
        { status: 400 }
      );
    }

    const id = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const project = createProject({
      id,
      name,
      slug,
      description: description || null,
      fps: Number(fps),
      resolution,
    });

    return NextResponse.json({
      success: true,
      project,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create project" },
      { status: 500 }
    );
  }
}
