"use client";

import React from "react";
import { Users, Plus, Upload, Sparkles, Filter, CheckCircle2 } from "lucide-react";

export default function CastingPage() {
  return (
    <div className="flex-1 p-6 space-y-6 max-w-[1700px] mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-[#121215] border border-[#27272a]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 bg-[#10b981]/20 border border-[#10b981]/40 text-[#10b981] text-[10px] font-mono font-bold uppercase tracking-wider">
              PRE-PRODUCTION
            </span>
            <span className="text-xs font-mono text-[#71717a]">MODULE 01</span>
          </div>
          <h1 className="text-2xl font-mono font-bold text-[#fafafa] mt-1">CASTING FORGE</h1>
          <p className="text-xs text-[#a1a1aa] font-mono mt-0.5">
            Character consistency reference loader (4-angle views, expression sheet, voice profile notes).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-[#10b981] hover:bg-[#059669] text-black text-xs font-mono font-bold uppercase tracking-wider transition-colors">
            <Plus className="w-4 h-4" />
            <span>CREATE CHARACTER</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Character Card 1 */}
        <div className="bg-[#121215] border border-[#27272a] hover:border-[#3f3f46] transition-all p-4 space-y-3">
          <div className="aspect-[3/4] bg-[#18181b] border border-[#27272a] flex flex-col items-center justify-center p-4 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-transparent opacity-80" />
            <span className="text-4xl font-mono font-bold text-[#27272a]">K-01</span>
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <span className="px-1.5 py-0.5 bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40 text-[9px] font-mono">
                4/4 ANGLES
              </span>
              <span className="text-[10px] font-mono text-[#a1a1aa]">INT8 ANCHOR</span>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-mono font-bold text-sm text-[#fafafa]">KAITO (LEAD)</h3>
              <span className="text-[10px] font-mono text-[#3b82f6]">HERO</span>
            </div>
            <p className="text-xs font-mono text-[#71717a] mt-1">
              Cyberpunk operative, dark trench coat, cybernetic left eye, scarred cheek.
            </p>
          </div>
        </div>

        {/* Character Card 2 */}
        <div className="bg-[#121215] border border-[#27272a] hover:border-[#3f3f46] transition-all p-4 space-y-3">
          <div className="aspect-[3/4] bg-[#18181b] border border-[#27272a] flex flex-col items-center justify-center p-4 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-transparent opacity-80" />
            <span className="text-4xl font-mono font-bold text-[#27272a]">CY-09</span>
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <span className="px-1.5 py-0.5 bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40 text-[9px] font-mono">
                3/4 ANGLES
              </span>
              <span className="text-[10px] font-mono text-[#a1a1aa]">DRONE</span>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-mono font-bold text-sm text-[#fafafa]">SECURITY CY-09</h3>
              <span className="text-[10px] font-mono text-[#f59e0b]">ANTAGONIST</span>
            </div>
            <p className="text-xs font-mono text-[#71717a] mt-1">
              Autonomous searchlight surveillance drone, matte carbon chassis, red optical lens.
            </p>
          </div>
        </div>

        {/* Character Card 3 */}
        <div className="bg-[#121215] border border-[#27272a] hover:border-[#3f3f46] transition-all p-4 space-y-3">
          <div className="aspect-[3/4] bg-[#18181b] border border-[#27272a] flex flex-col items-center justify-center p-4 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-transparent opacity-80" />
            <span className="text-4xl font-mono font-bold text-[#27272a]">Y-03</span>
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <span className="px-1.5 py-0.5 bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40 text-[9px] font-mono">
                4/4 ANGLES
              </span>
              <span className="text-[10px] font-mono text-[#a1a1aa]">INT8 ANCHOR</span>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-mono font-bold text-sm text-[#fafafa]">YUKI (HANDLER)</h3>
              <span className="text-[10px] font-mono text-[#10b981]">SUPPORT</span>
            </div>
            <p className="text-xs font-mono text-[#71717a] mt-1">
              Tactical communications engineer, headset rig, cropped silver hair, neon techwear.
            </p>
          </div>
        </div>

        {/* Add Character Slot */}
        <button className="bg-[#121215] border-2 border-dashed border-[#27272a] hover:border-[#3b82f6] transition-all p-6 flex flex-col items-center justify-center text-center group cursor-pointer">
          <div className="p-3 bg-[#18181b] border border-[#27272a] group-hover:border-[#3b82f6] text-[#71717a] group-hover:text-[#3b82f6] transition-colors">
            <Plus className="w-6 h-6" />
          </div>
          <span className="font-mono text-xs font-bold text-[#fafafa] mt-3 group-hover:text-[#3b82f6]">
            ADD NEW CHARACTER
          </span>
          <span className="text-[10px] font-mono text-[#71717a] mt-1">
            Load Turnaround & Reference Sheets
          </span>
        </button>
      </div>
    </div>
  );
}
