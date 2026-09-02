"use client";

import React from "react";
import { Plus, Sun, Moon } from "lucide-react";

export default function LocationsPage() {
  return (
    <div className="flex-1 p-6 space-y-6 max-w-[1700px] mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-[#121215] border border-[#27272a]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 bg-[#3b82f6]/20 border border-[#3b82f6]/40 text-[#3b82f6] text-[10px] font-mono font-bold uppercase tracking-wider">
              ENVIRONMENT
            </span>
            <span className="text-xs font-mono text-[#71717a]">MODULE 02</span>
          </div>
          <h1 className="text-2xl font-mono font-bold text-[#fafafa] mt-1">LOCATION LOCKER</h1>
          <p className="text-xs text-[#a1a1aa] font-mono mt-0.5">
            Multi-reference environmental sets (Day/Night, Wide, Close-up angles, atmosphere prompts).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors">
            <Plus className="w-4 h-4" />
            <span>CREATE LOCATION SET</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Location Card 1 */}
        <div className="bg-[#121215] border border-[#27272a] hover:border-[#3f3f46] transition-all p-4 space-y-3">
          <div className="aspect-video bg-[#18181b] border border-[#27272a] flex items-center justify-center relative overflow-hidden">
            <span className="text-3xl font-mono font-bold text-[#27272a]">LOC-01</span>
            <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 bg-[#09090b] border border-[#27272a] text-[9px] font-mono text-[#f59e0b]">
              <Moon className="w-3 h-3" />
              <span>NIGHT RAIN</span>
            </div>
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono text-[#a1a1aa] bg-[#09090b]/80 px-2 py-1 border border-[#27272a]">
              <span>ROOFTOP SOLAR ARRAY</span>
              <span className="text-[#3b82f6]">16:9 4K</span>
            </div>
          </div>
          <div>
            <h3 className="font-mono font-bold text-sm text-[#fafafa]">NEO TOKYO SOLAR ROOFTOP</h3>
            <p className="text-xs font-mono text-[#71717a] mt-1">
              Wet photovoltaic panels, holographic neon billboard reflections, high altitude fog.
            </p>
          </div>
        </div>

        {/* Location Card 2 */}
        <div className="bg-[#121215] border border-[#27272a] hover:border-[#3f3f46] transition-all p-4 space-y-3">
          <div className="aspect-video bg-[#18181b] border border-[#27272a] flex items-center justify-center relative overflow-hidden">
            <span className="text-3xl font-mono font-bold text-[#27272a]">LOC-02</span>
            <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 bg-[#09090b] border border-[#27272a] text-[9px] font-mono text-[#10b981]">
              <Sun className="w-3 h-3" />
              <span>INTERIOR CYAN</span>
            </div>
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono text-[#a1a1aa] bg-[#09090b]/80 px-2 py-1 border border-[#27272a]">
              <span>SERVER CORE VAULT</span>
              <span className="text-[#3b82f6]">16:9 4K</span>
            </div>
          </div>
          <div>
            <h3 className="font-mono font-bold text-sm text-[#fafafa]">MAINFRAME SUB-LEVEL 04</h3>
            <p className="text-xs font-mono text-[#71717a] mt-1">
              Submerged cooling towers, pulsing fiber optics, monolithic black server racks.
            </p>
          </div>
        </div>

        {/* Add Location Slot */}
        <button className="bg-[#121215] border-2 border-dashed border-[#27272a] hover:border-[#3b82f6] transition-all p-6 flex flex-col items-center justify-center text-center group cursor-pointer">
          <div className="p-3 bg-[#18181b] border border-[#27272a] group-hover:border-[#3b82f6] text-[#71717a] group-hover:text-[#3b82f6] transition-colors">
            <Plus className="w-6 h-6" />
          </div>
          <span className="font-mono text-xs font-bold text-[#fafafa] mt-3 group-hover:text-[#3b82f6]">
            ADD NEW ENVIRONMENT SET
          </span>
          <span className="text-[10px] font-mono text-[#71717a] mt-1">
            Day/Night Lighting & Environmental Anchors
          </span>
        </button>
      </div>
    </div>
  );
}
