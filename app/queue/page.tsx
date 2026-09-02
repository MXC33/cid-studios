"use client";

import React from "react";
import { Layers, Play, Pause, Trash2, ShieldCheck, CheckCircle2, Flame, Clock } from "lucide-react";

export default function BatchQueuePage() {
  return (
    <div className="flex-1 p-6 space-y-6 max-w-[1700px] mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-[#121215] border border-[#27272a]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 bg-[#10b981]/20 border border-[#10b981]/40 text-[#10b981] text-[10px] font-mono font-bold uppercase tracking-wider">
              BATCH RUNNER
            </span>
            <span className="text-xs font-mono text-[#71717a]">MODULE 06</span>
          </div>
          <h1 className="text-2xl font-mono font-bold text-[#fafafa] mt-1">OVERNIGHT BATCH QUEUE</h1>
          <p className="text-xs text-[#a1a1aa] font-mono mt-0.5">
            Automated multi-shot take generation with macOS caffeinate power guard & WebSocket live telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#10b981]/10 border border-[#10b981]/30 text-[#10b981] text-xs font-mono">
            <ShieldCheck className="w-4 h-4" />
            <span>CAFFEINATE ACTIVE (PID: 49204)</span>
          </div>
        </div>
      </div>

      <div className="bg-[#121215] border border-[#27272a] p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
          <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-[#a1a1aa]">
            QUEUE JOBS (3 ENQUEUED)
          </h2>
          <span className="text-xs font-mono text-[#71717a]">EST. REMAINING: 42.6s</span>
        </div>

        <div className="space-y-2">
          <div className="p-3.5 bg-[#18181b] border border-[#3b82f6] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 bg-[#3b82f6] animate-pulse rounded-none" />
              <div>
                <div className="font-mono font-bold text-xs text-[#fafafa]">
                  JOB #8820494 — SHOT_04_03 (TAKE 1/3)
                </div>
                <div className="text-[10px] font-mono text-[#a1a1aa] mt-0.5">
                  MiniMax H3 (INT8) • 4-Step Turbo • Step 3/4 [75%]
                </div>
              </div>
            </div>
            <span className="text-xs font-mono text-[#3b82f6] font-bold">RENDERING</span>
          </div>

          <div className="p-3.5 bg-[#121215] border border-[#27272a] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 bg-[#71717a] rounded-none" />
              <div>
                <div className="font-mono font-bold text-xs text-[#fafafa]">
                  JOB #8820495 — SHOT_04_03 (TAKE 2/3)
                </div>
                <div className="text-[10px] font-mono text-[#71717a] mt-0.5">
                  MiniMax H3 (INT8) • 4-Step Turbo • Seed: 8820492
                </div>
              </div>
            </div>
            <span className="text-xs font-mono text-[#71717a]">QUEUED (NEXT)</span>
          </div>

          <div className="p-3.5 bg-[#121215] border border-[#27272a] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 bg-[#71717a] rounded-none" />
              <div>
                <div className="font-mono font-bold text-xs text-[#fafafa]">
                  JOB #8820496 — SHOT_04_03 (TAKE 3/3)
                </div>
                <div className="text-[10px] font-mono text-[#71717a] mt-0.5">
                  MiniMax H3 (INT8) • 4-Step Turbo • Seed: 8820493
                </div>
              </div>
            </div>
            <span className="text-xs font-mono text-[#71717a]">QUEUED</span>
          </div>
        </div>
      </div>
    </div>
  );
}
