"use client";

import React, { useState } from "react";
import { Film, Play, Star, Check, Sparkles, Filter, SlidersHorizontal, Download } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DailiesPage() {
  const [selectedTake, setSelectedTake] = useState<number>(1);

  return (
    <div className="flex-1 p-6 space-y-6 max-w-[1700px] mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-[#121215] border border-[#27272a]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 bg-[#f59e0b]/20 border border-[#f59e0b]/40 text-[#f59e0b] text-[10px] font-mono font-bold uppercase tracking-wider">
              REVIEW & DAILIES
            </span>
            <span className="text-xs font-mono text-[#71717a]">MODULE 04</span>
          </div>
          <h1 className="text-2xl font-mono font-bold text-[#fafafa] mt-1">DAILIES & TAKE COMPARATOR</h1>
          <p className="text-xs text-[#a1a1aa] font-mono mt-0.5">
            Scrub generated MP4 takes, side-by-side consistency check, and mark select takes for NLE timeline assembly.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-[#18181b] hover:bg-[#27272a] border border-[#3f3f46] text-[#fafafa] text-xs font-mono font-bold uppercase tracking-wider transition-colors">
            <SlidersHorizontal className="w-4 h-4" />
            <span>2-WAY SPLIT VIEW</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Player Display */}
        <div className="lg:col-span-2 space-y-3">
          <div className="aspect-video bg-[#0c0c0e] border border-[#27272a] flex flex-col justify-between p-4 relative">
            <div className="flex items-center justify-between z-10">
              <span className="px-2 py-0.5 bg-[#09090b]/80 border border-[#27272a] text-xs font-mono text-[#3b82f6]">
                SHOT_04_01_TAKE_{selectedTake.toString().padStart(2, "0")}.MP4
              </span>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40 text-[10px] font-mono">
                  ★ SELECTED MASTER
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="w-16 h-16 bg-[#18181b]/90 border border-[#3f3f46] flex items-center justify-center text-[#fafafa] hover:text-[#3b82f6] cursor-pointer transition-colors">
                <Play className="w-8 h-8 fill-current ml-1" />
              </div>
            </div>

            <div className="z-10 bg-[#09090b]/90 p-2.5 border border-[#27272a] flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-3">
                <span className="text-[#3b82f6] font-bold">00:02:14 / 00:04:00</span>
                <span className="text-[#71717a]">24.00 FPS</span>
                <span className="text-[#71717a]">1920x1080</span>
              </div>
              <span className="text-[#10b981]">32kHz FOLEY AUDIO ACTIVE</span>
            </div>
          </div>
        </div>

        {/* Take List */}
        <div className="space-y-3">
          <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-[#a1a1aa]">
            SHOT 04_01 TAKES (4 GENERATED)
          </h2>

          <div className="space-y-2">
            {[1, 2, 3, 4].map((take) => (
              <div
                key={take}
                onClick={() => setSelectedTake(take)}
                className={cn(
                  "p-3.5 border transition-all cursor-pointer",
                  selectedTake === take
                    ? "bg-[#18181b] border-[#3b82f6]"
                    : "bg-[#121215] border-[#27272a] hover:border-[#3f3f46]"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-[#fafafa]">
                    TAKE #{take.toString().padStart(2, "0")}
                  </span>
                  {take === 1 ? (
                    <span className="px-1.5 py-0.2 bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/30 text-[9px] font-mono">
                      ★ SELECT
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-[#71717a]">ALT TAKE</span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-2 text-[10px] font-mono text-[#71717a]">
                  <span>SEED: 882049{take}</span>
                  <span>14.1s RENDER</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
