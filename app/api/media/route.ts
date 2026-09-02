import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { Readable } from "stream";

const ALLOWED_EXTENSIONS = new Set([
  ".mp4",
  ".webm",
  ".mov",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".wav",
  ".mp3",
]);

const ALLOWED_ROOTS = [
  "/Users/mxc/ComfyUI-Shared/output",
  "/Users/mxc/ComfyUI-Shared/input",
  "/Users/mxc/ComfyUI-Installs/ComfyUI/ComfyUI/output",
  "/Users/mxc/ComfyUI-Installs/ComfyUI/ComfyUI/input",
  path.join(process.cwd(), "public"),
];

function resolveFilePath(filePath: string): string | null {
  if (!filePath) return null;

  // Direct absolute path
  if (path.isAbsolute(filePath) && fs.existsSync(filePath)) {
    return filePath;
  }

  // Check in ComfyUI Shared output
  const inSharedVideo = path.join("/Users/mxc/ComfyUI-Shared/output/video", path.basename(filePath));
  if (fs.existsSync(inSharedVideo)) return inSharedVideo;

  const inSharedOutput = path.join("/Users/mxc/ComfyUI-Shared/output", filePath);
  if (fs.existsSync(inSharedOutput)) return inSharedOutput;

  // Check in public directory
  const inPublic = path.join(process.cwd(), "public", filePath);
  if (fs.existsSync(inPublic)) return inPublic;

  const inPublicVault = path.join(process.cwd(), "public", "vault", path.basename(filePath));
  if (fs.existsSync(inPublicVault)) return inPublicVault;

  return null;
}

function getContentType(ext: string): string {
  switch (ext.toLowerCase()) {
    case ".mp4":
      return "video/mp4";
    case ".webm":
      return "video/webm";
    case ".mov":
      return "video/quicktime";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".wav":
      return "audio/wav";
    case ".mp3":
      return "audio/mpeg";
    default:
      return "application/octet-stream";
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawPath = searchParams.get("path") || searchParams.get("file") || "";

    if (!rawPath) {
      return NextResponse.json(
        { success: false, error: "Missing path parameter" },
        { status: 400 }
      );
    }

    const fullPath = resolveFilePath(rawPath);
    if (!fullPath || !fs.existsSync(fullPath)) {
      return NextResponse.json(
        { success: false, error: "Media file not found", path: rawPath },
        { status: 404 }
      );
    }

    const ext = path.extname(fullPath).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { success: false, error: "File type not supported" },
        { status: 403 }
      );
    }

    const stat = fs.statSync(fullPath);
    const fileSize = stat.size;
    const contentType = getContentType(ext);

    const rangeHeader = req.headers.get("range");

    if (rangeHeader && contentType.startsWith("video/")) {
      const parts = rangeHeader.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize || start > end) {
        return new NextResponse("Requested range not satisfiable", {
          status: 416,
          headers: {
            "Content-Range": `bytes */${fileSize}`,
          },
        });
      }

      const chunkSize = end - start + 1;
      const nodeStream = fs.createReadStream(fullPath, { start, end });
      const webStream = Readable.toWeb(nodeStream) as any;

      return new NextResponse(webStream, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": String(chunkSize),
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    // Full file stream
    const nodeStream = fs.createReadStream(fullPath);
    const webStream = Readable.toWeb(nodeStream) as any;

    return new NextResponse(webStream, {
      status: 200,
      headers: {
        "Content-Length": String(fileSize),
        "Content-Type": contentType,
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err: any) {
    console.error("GET /api/media error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to serve media" },
      { status: 500 }
    );
  }
}
