import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

// Sync target directories
const VAULT_DIR = path.join(process.cwd(), "public", "vault");
const COMFY_SHARED_INPUT = "/Users/mxc/ComfyUI-Shared/input";
const COMFY_LOCAL_INPUT = "/Users/mxc/ComfyUI-Installs/ComfyUI/ComfyUI/input";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided in form data" },
        { status: 400 }
      );
    }

    // Sanitize filename
    const originalName = file.name || "asset.png";
    const cleanName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
    // Ensure unique or recognizable filename
    const filename = cleanName;

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Ensure public vault directory exists
    if (!fs.existsSync(VAULT_DIR)) {
      fs.mkdirSync(VAULT_DIR, { recursive: true });
    }

    // Write to primary vault location
    const vaultFilePath = path.join(VAULT_DIR, filename);
    fs.writeFileSync(vaultFilePath, buffer);

    const syncedPaths: string[] = [vaultFilePath];

    // Auto-copy to ComfyUI Shared Input
    try {
      if (!fs.existsSync(COMFY_SHARED_INPUT)) {
        fs.mkdirSync(COMFY_SHARED_INPUT, { recursive: true });
      }
      const sharedInputPath = path.join(COMFY_SHARED_INPUT, filename);
      fs.writeFileSync(sharedInputPath, buffer);
      syncedPaths.push(sharedInputPath);
    } catch (err) {
      console.warn("Could not copy to ComfyUI Shared input:", err);
    }

    // Auto-copy to ComfyUI Local Install Input
    try {
      if (!fs.existsSync(COMFY_LOCAL_INPUT)) {
        fs.mkdirSync(COMFY_LOCAL_INPUT, { recursive: true });
      }
      const localInputPath = path.join(COMFY_LOCAL_INPUT, filename);
      fs.writeFileSync(localInputPath, buffer);
      syncedPaths.push(localInputPath);
    } catch (err) {
      console.warn("Could not copy to ComfyUI Local install input:", err);
    }

    return NextResponse.json({
      success: true,
      filename,
      path: filename,
      url: `/vault/${filename}`,
      size: buffer.length,
      synced_targets: syncedPaths,
    });
  } catch (err: any) {
    console.error("Asset upload error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to upload asset" },
      { status: 500 }
    );
  }
}
