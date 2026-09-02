"use client";

import React from "react";
import { SlidersHorizontal, Play, Download, Scissors, Volume2, Plus, Sparkles } from "lucide-react";

export default function TimelinePage() {
  return (
    <div className="flex-1 p-6 space-y-6 max-w-[1700px] mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-[#121215] border border-[#27272a]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 bg-[#f43f5e]/20 border border-[#f43f5e]/40 text-[#f43f5e] text-[10px] font-mono font-bold uppercase tracking-wider">
              POST-PRODUCTION
            </span>
            <span className="text-xs font-mono text-[#71717a]">MODULE 05</span>
          </div>
          <h1 className="text-2xl font-mono font-bold text-[#fafafa] mt-1">TIMELINE NLE (FFMPEG)</h1>
          <p className="text-xs text-[#a1a1aa] font-mono mt-0.5">
            Multi-track timeline editor, clip slicing, cross-fades, audio foley mixing, and lossless ProRes export.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-[#f43f5e] hover:bg-[#e11d48] text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors">
            <Download className="w-4 h-4" />
            <span>EXPORT MASTER (FFMPEG)</span>
          </button>
        </div>
      </div>

      {/* Multi-track Timeline Mockup */}
      <div className="bg-[#121215] border border-[#27272a] p-5 space-y-4">
        {/* Timeline Header / Controls */}
        <div className="flex items-center justify-between pb-3 border-b border-[#27272a] text-xs font-mono">
          <div className="flex items-center gap-4">
            <span className="text-[#3b82f6] font-bold text-sm">TC 00:01:24:12</span>
            <span className="text-[#71717a]">|</span>
            <span className="text-[#fafafa]">TOTAL: 02:44:00</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-1.5 bg-[#18181b] border border-[#27272a] hover:border-[#3f3f46]">
              <Scissors className="w-3.5 h-3.5 text-[#a1a1aa]" />
            </button>
            <button className="p-1.5 bg-[#18181b] border border-[#27272a] hover:border-[#3f3f46]">
              <Volume2 className="w-3.5 h-3.5 text-[#a1a1aa]" />
            </button>
          </div>
        </div>

        {/* Tracks */}
        <div className="space-y-2">
          {/* V1 Video Track */}
          <div className="flex items-stretch border border-[#27272a] bg-[#0c0c0e] h-16">
            <div className="w-28 bg-[#18181b] border-r border-[#27272a] p-2 flex flex-col justify-between text-[11px] font-mono text-[#a1a1aa]">
              <span className="font-bold text-[#fafafa]">V1 VIDEO</span>
              <span className="text-[9px] text-[#71717a]">1080P 24FPS</span>
            </div>
            <div className="flex-1 p-1 flex items-center gap-1 overflow-x-auto">
              <div className="h-full w-48 bg-[#3b82f6]/20 border border-[#3b82f6]/50 p-2 flex flex-col justify-between text-[10px] font-mono">
                <span className="text-[#fafafa] font-bold truncate">SHOT_04_01 (T1)</span>
                <span className="text-[#3b82f6]">00:00 - 04:00</span>
              </div>
              <div className="h-full w-40 bg-[#3b82f6]/20 border border-[#3b82f6]/50 p-2 flex flex-col justify-between text-[10px] font-mono">
                <span className="text-[#fafafa] font-bold truncate">SHOT_04_02 (T1)</span>
                <span className="text-[#3b82f6]">04:00 - 07:30</span>
              </div>
            </div>
          </div>

          {/* A1 Foley Track */}
          <div className="flex items-stretch border border-[#27272a] bg-[#0c0c0e] h-12">
            <div className="w-28 bg-[#18181b] border-r border-[#27272a] p-2 flex flex-col justify-between text-[11px] font-mono text-[#a1a1aa]">
              <span className="font-bold text-[#fafafa]">A1 FOLEY</span>
              <span className="text-[9px] text-[#71717a]">32kHz STEREO</span>
            </div>
            <div className="flex-1 p-1 flex items-center gap-1">
              <div className="h-full w-48 bg-[#10b981]/20 border border-[#10b981]/50 p-1.5 flex items-center text-[10px] font-mono text-[#10b981]">
                RAIN_SLICK_WIND.WAV
              </div>
            </div>
          </div>

          {/* A2 Score Track */}
          <div className="flex items-stretch border border-[#27272a] bg-[#0c0c0e] h-12">
            <div className="w-28 bg-[#18181b] border-r border-[#27272a] p-2 flex flex-col justify-between text-[11px] font-mono text-[#a1a1aa]">
              <span className="font-bold text-[#fafafa]">A2 SCORE</span>
              <span className="text-[9px] text-[#71717a]">48kHz MASTER</span>
            </div>
            <div className="flex-1 p-1 flex items-center gap-1">
              <div className="h-full w-96 bg-[#f59e0b]/20 border border-[#f59e0b]/50 p-1.5 flex items-center text-[10px] font-mono text-[#f59e0b]">
                CYBERPUNK_DRONE_TENSION_CUE.WAV
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
