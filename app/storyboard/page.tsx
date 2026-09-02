"use client";

import React, { useState } from "react";
import { 
  Plus, 
  Flame
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function StoryboardPage() {
  const [activeShot, setActiveShot] = useState<number>(1);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderProgress, setRenderProgress] = useState<number>(0);

  const startTestRender = () => {
    setIsRendering(true);
    setRenderProgress(10);
    const interval = setInterval(() => {
      setRenderProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsRendering(false);
          return 100;
        }
        return prev + 25;
      });
    }, 400);
  };

  return (
    <div className="flex-1 p-6 space-y-6 max-w-[1700px] mx-auto w-full">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-[#121215] border border-[#27272a]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 bg-[#3b82f6]/20 border border-[#3b82f6]/40 text-[#3b82f6] text-[10px] font-mono font-bold uppercase tracking-wider">
              MULTI-SHOT DIRECTOR
            </span>
            <span className="text-xs font-mono text-[#71717a]">SCENE 04 // 18 SHOTS</span>
          </div>
          <h1 className="text-2xl font-mono font-bold text-[#fafafa] mt-1">STORYBOARD STUDIO</h1>
          <p className="text-xs text-[#a1a1aa] font-mono mt-0.5">
            Direct multi-shot sequences, camera movement cues, and trigger 4-step Turbo MiniMax H3 generation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={startTestRender}
            disabled={isRendering}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-colors",
              isRendering 
                ? "bg-[#18181b] border border-[#3f3f46] text-[#a1a1aa] cursor-not-allowed" 
                : "bg-[#f59e0b] hover:bg-[#d97706] text-black"
            )}
          >
            <Flame className="w-4 h-4" />
            <span>{isRendering ? `RENDERING [${renderProgress}%]` : "RENDER ACTIVE SHOT (4-STEP)"}</span>
          </button>
        </div>
      </div>

      {/* Main Director Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Shot List Sidebar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-[#a1a1aa]">
              SHOT SEQUENCE (18 TOTAL)
            </h2>
            <button className="text-[10px] font-mono text-[#3b82f6] hover:underline flex items-center gap-1">
              <Plus className="w-3 h-3" />
              <span>APPEND SHOT</span>
            </button>
          </div>

          <div className="space-y-2">
            {[
              { id: 1, name: "SHOT_04_01", desc: "Wide establishing crane shot over rain rooftop.", status: "COMPLETE", takes: 4, dur: "4.0s" },
              { id: 2, name: "SHOT_04_02", desc: "Medium tracking sprint toward ledge.", status: "COMPLETE", takes: 3, dur: "3.5s" },
              { id: 3, name: "SHOT_04_03", desc: "Low-angle drone CY-09 searchlight intercept.", status: "PENDING", takes: 0, dur: "4.0s" },
              { id: 4, name: "SHOT_04_04", desc: "Close-up cybernetic eye HUD scanning exit vector.", status: "PENDING", takes: 0, dur: "2.5s" },
            ].map((shot) => (
              <div
                key={shot.id}
                onClick={() => setActiveShot(shot.id)}
                className={cn(
                  "p-3.5 border transition-all cursor-pointer",
                  activeShot === shot.id
                    ? "bg-[#18181b] border-[#3b82f6]"
                    : "bg-[#121215] border-[#27272a] hover:border-[#3f3f46]"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-[#fafafa]">{shot.name}</span>
                  <span className={cn(
                    "px-1.5 py-0.2 text-[9px] font-mono border",
                    shot.status === "COMPLETE" 
                      ? "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30" 
                      : "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30"
                  )}>
                    {shot.status === "COMPLETE" ? `${shot.takes} TAKES` : "PENDING"}
                  </span>
                </div>
                <p className="text-xs font-mono text-[#71717a] mt-1 line-clamp-1">{shot.desc}</p>
                <div className="flex items-center justify-between mt-2 text-[10px] font-mono text-[#71717a]">
                  <span>16:9 • 1080P</span>
                  <span>{shot.dur}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center/Right 2 Cols: Director Drawer & Prompt Doctor */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 bg-[#121215] border border-[#27272a] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono font-bold text-[#fafafa]">
                  DIRECTOR SETTINGS — SHOT_04_{activeShot.toString().padStart(2, "0")}
                </span>
                <span className="px-1.5 py-0.5 bg-[#3b82f6]/20 text-[#3b82f6] text-[10px] font-mono">
                  MiniMax H3 (INT8)
                </span>
              </div>
              <span className="text-xs font-mono text-[#71717a]">4 STEPS • 24 FPS</span>
            </div>

            {/* Prompt Doctor Textareas */}
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono font-bold text-[#a1a1aa] mb-1">
                  VISUAL ACTION & CAMERA DIRECTION
                </label>
                <textarea
                  rows={3}
                  defaultValue="Low-angle cinematic tracking shot looking up. Autonomous security drone CY-09 sweeps bright red searchlight across rain-soaked wet solar panels. Cyberpunk atmospheric fog, neon cyan reflections, high tension."
                  className="w-full bg-[#18181b] border border-[#27272a] p-3 text-xs font-mono text-[#fafafa] focus:outline-none focus:border-[#3b82f6] resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-[#a1a1aa] mb-1">
                  SYNCHRONIZED AUDIO & FOLEY PROMPT (32kHz)
                </label>
                <textarea
                  rows={2}
                  defaultValue="Heavy rain patter on glass solar panels, low oscillating mechanical hum of drone propulsion, electric servo click, distant city thunder."
                  className="w-full bg-[#18181b] border border-[#27272a] p-3 text-xs font-mono text-[#fafafa] focus:outline-none focus:border-[#3b82f6] resize-none"
                />
              </div>
            </div>

            {/* Consistency Cast & Environment Picker */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-[#18181b] border border-[#27272a]">
                <span className="text-[10px] font-mono text-[#71717a] block mb-1">CHARACTER CONSISTENCY</span>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#fafafa]">CY-09 (SECURITY DRONE)</span>
                  <span className="text-[10px] font-mono text-[#10b981]">INT8 ANCHOR</span>
                </div>
              </div>

              <div className="p-3 bg-[#18181b] border border-[#27272a]">
                <span className="text-[10px] font-mono text-[#71717a] block mb-1">ENVIRONMENT SET</span>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#fafafa]">ROOFTOP SOLAR (NIGHT RAIN)</span>
                  <span className="text-[10px] font-mono text-[#3b82f6]">16:9 4K</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
