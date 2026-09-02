import { NextResponse } from "next/server";
import { checkStatus } from "@/lib/comfy/client";
import { getCaffeinateStatus } from "@/lib/comfy/caffeinate";

export async function GET() {
  try {
    const status = await checkStatus();
    const caffeinate = getCaffeinateStatus();

    return NextResponse.json({
      success: true,
      engine: {
        online: status.online,
        stats: status.stats ?? null,
        error: status.error ?? null,
      },
      caffeinate,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to query engine status",
      },
      { status: 500 }
    );
  }
}
