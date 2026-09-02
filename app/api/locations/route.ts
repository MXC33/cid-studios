import { NextRequest, NextResponse } from "next/server";
import {
  getAllLocations,
  getLocationsByProjectId,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation,
  getAllProjects,
} from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const projectId = searchParams.get("project_id");

    if (id) {
      const location = getLocationById(id);
      if (!location) {
        return NextResponse.json(
          { success: false, error: "Location not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, location });
    }

    if (projectId) {
      const locations = getLocationsByProjectId(projectId);
      return NextResponse.json({ success: true, locations });
    }

    // Default to active project locations if exists, otherwise all
    const projects = getAllProjects();
    const activeProject = projects[0];
    const locations = activeProject
      ? getLocationsByProjectId(activeProject.id)
      : getAllLocations();

    return NextResponse.json({ success: true, locations });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch locations" },
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
      description,
      time_of_day,
      ref_main_path,
      ref_alt_path,
    } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Location name is required" },
        { status: 400 }
      );
    }

    let targetProjectId = project_id;
    if (!targetProjectId) {
      const projects = getAllProjects();
      targetProjectId = projects[0]?.id || "proj_neo_tokyo_2088";
    }

    const id = body.id || `loc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const location = createLocation({
      id,
      project_id: targetProjectId,
      name,
      description: description || null,
      time_of_day: time_of_day || null,
      ref_main_path: ref_main_path || null,
      ref_alt_path: ref_alt_path || null,
    });

    return NextResponse.json({ success: true, location });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create location" },
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
        { success: false, error: "Location ID is required for update" },
        { status: 400 }
      );
    }

    const existing = getLocationById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Location not found" },
        { status: 404 }
      );
    }

    const updated = updateLocation(id, updates);
    return NextResponse.json({ success: true, location: updated });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update location" },
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
        { success: false, error: "Location ID is required for deletion" },
        { status: 400 }
      );
    }

    const deleted = deleteLocation(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Location not found or could not be deleted" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, deleted_id: id });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to delete location" },
      { status: 500 }
    );
  }
}
