"use client";

import React from "react";
import Link from "next/link";
import { 
  Users, 
  MapPin, 
  Clapperboard, 
  Film, 
  SlidersHorizontal, 
  Layers, 
  Plus, 
  ArrowUpRight, 
  Activity, 
  Clock, 
  Flame, 
  ChevronRight,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";

export default function StudioHubPage() {
  return (
    <div className="flex-1 flex flex-col p-6 space-y-6 max-w-[1700px] mx-auto w-full">
      {/* Studio Header / Project Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-[#121215] border border-[#27272a]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 bg-[#3b82f6]/20 border border-[#3b82f6]/40 text-[#3b82f6] text-[10px] font-mono font-bold uppercase tracking-wider">
              ACTIVE PRODUCTION
            </span>
            <span className="text-xs font-mono text-[#71717a]">ID: PRJ-88204</span>
          </div>
          <h1 className="text-2xl font-mono font-bold tracking-tight text-[#fafafa] flex items-center gap-3">
            <span>NEO_TOKYO_2088</span>
            <span className="text-[#71717a] font-normal text-lg">{"//"}</span>
            <span className="text-[#a1a1aa] font-normal text-lg">SCENE 04: THE ROOFTOP EXTRACTION</span>
          </h1>
          <p className="text-xs text-[#a1a1aa] font-mono">
            Local MiniMax H3 Ref2VA pipeline with 4-step Turbo LoRA & 32kHz synchronized audio foley.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/storyboard"
            className="flex items-center gap-2 px-4 py-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>NEW SHOT</span>
          </Link>

          <Link
            href="/casting"
            className="flex items-center gap-2 px-3.5 py-2 bg-[#18181b] hover:bg-[#27272a] border border-[#3f3f46] text-[#fafafa] text-xs font-mono font-bold tracking-wider transition-colors"
          >
            <Users className="w-4 h-4 text-[#10b981]" />
            <span>CAST ROSTER</span>
          </Link>

          <Link
            href="/timeline"
            className="flex items-center gap-2 px-3.5 py-2 bg-[#18181b] hover:bg-[#27272a] border border-[#3f3f46] text-[#fafafa] text-xs font-mono font-bold tracking-wider transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#f59e0b]" />
            <span>NLE TIMELINE</span>
          </Link>
        </div>
      </div>

      {/* Metric Telemetry Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Metric 1 */}
        <div className="p-3.5 bg-[#121215] border border-[#27272a] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#71717a]">
            <span>ENGINE LATENCY</span>
            <Activity className="w-3.5 h-3.5 text-[#10b981]" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-mono font-bold text-[#fafafa] tabular-nums">14.2<span className="text-xs font-normal text-[#71717a]">s</span></div>
            <div className="text-[10px] font-mono text-[#10b981] mt-0.5">4-STEP TURBO / TAKE</div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-3.5 bg-[#121215] border border-[#27272a] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#71717a]">
            <span>STORYBOARD SHOTS</span>
            <Clapperboard className="w-3.5 h-3.5 text-[#3b82f6]" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-mono font-bold text-[#fafafa] tabular-nums">18 <span className="text-xs font-normal text-[#71717a]">/ 24</span></div>
            <div className="text-[10px] font-mono text-[#3b82f6] mt-0.5">12 COMPLETED • 6 PENDING</div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-3.5 bg-[#121215] border border-[#27272a] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#71717a]">
            <span>DAILIES & TAKES</span>
            <Film className="w-3.5 h-3.5 text-[#f59e0b]" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-mono font-bold text-[#fafafa] tabular-nums">46 <span className="text-xs font-normal text-[#71717a]">TAKES</span></div>
            <div className="text-[10px] font-mono text-[#f59e0b] mt-0.5">18 MARKED SELECT [★]</div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-3.5 bg-[#121215] border border-[#27272a] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#71717a]">
            <span>CASTING ROSTER</span>
            <Users className="w-3.5 h-3.5 text-[#10b981]" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-mono font-bold text-[#fafafa] tabular-nums">8 <span className="text-xs font-normal text-[#71717a]">ACTORS</span></div>
            <div className="text-[10px] font-mono text-[#a1a1aa] mt-0.5">32 MULTI-ANGLE SHEETS</div>
          </div>
        </div>

        {/* Metric 5 */}
        <div className="p-3.5 bg-[#121215] border border-[#27272a] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#71717a]">
            <span>LOCATION SETS</span>
            <MapPin className="w-3.5 h-3.5 text-[#a1a1aa]" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-mono font-bold text-[#fafafa] tabular-nums">5 <span className="text-xs font-normal text-[#71717a]">SETS</span></div>
            <div className="text-[10px] font-mono text-[#a1a1aa] mt-0.5">DAY / NIGHT ANCHORS</div>
          </div>
        </div>

        {/* Metric 6 */}
        <div className="p-3.5 bg-[#121215] border border-[#27272a] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#71717a]">
            <span>MASTER RUNTIME</span>
            <Clock className="w-3.5 h-3.5 text-[#3b82f6]" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-mono font-bold text-[#fafafa] tabular-nums">02:44<span className="text-xs font-normal text-[#71717a]">.12</span></div>
            <div className="text-[10px] font-mono text-[#3b82f6] mt-0.5">1080P @ 24FPS (PRORES)</div>
          </div>
        </div>
      </div>

      {/* Main Studio Modules Navigation Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-[#a1a1aa] flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#3b82f6]"></span>
            <span>PRODUCTION MODULES & WORKFLOW APPS</span>
          </h2>
          <span className="text-[10px] font-mono text-[#71717a]">6 APPS READY</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Module 1: Casting */}
          <Link
            href="/casting"
            className="p-5 bg-[#121215] hover:bg-[#18181b] border border-[#27272a] hover:border-[#3b82f6] transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-[#10b981]/10 border border-[#10b981]/30 text-[#10b981]">
                  <Users className="w-5 h-5" />
                </div>
                <span className="font-mono text-[10px] text-[#71717a] px-2 py-0.5 bg-[#09090b] border border-[#27272a]">
                  MODULE 01 // PRE-PROD
                </span>
              </div>
              <h3 className="text-base font-mono font-bold text-[#fafafa] group-hover:text-[#3b82f6] transition-colors">
                CASTING FORGE
              </h3>
              <p className="text-xs text-[#a1a1aa] font-mono mt-1.5 line-clamp-2">
                4-angle character consistency reference loader (Turnaround, Action, Emotion, Full Body) with voice profiles.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#27272a] flex items-center justify-between text-xs font-mono text-[#71717a] group-hover:text-[#fafafa]">
              <span>8 CHARACTERS SAVED</span>
              <ArrowUpRight className="w-4 h-4 text-[#71717a] group-hover:text-[#3b82f6]" />
            </div>
          </Link>

          {/* Module 2: Locations */}
          <Link
            href="/locations"
            className="p-5 bg-[#121215] hover:bg-[#18181b] border border-[#27272a] hover:border-[#3b82f6] transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-[#3b82f6]/10 border border-[#3b82f6]/30 text-[#3b82f6]">
                  <MapPin className="w-5 h-5" />
                </div>
                <span className="font-mono text-[10px] text-[#71717a] px-2 py-0.5 bg-[#09090b] border border-[#27272a]">
                  MODULE 02 // ENVIRONMENT
                </span>
              </div>
              <h3 className="text-base font-mono font-bold text-[#fafafa] group-hover:text-[#3b82f6] transition-colors">
                LOCATION LOCKER
              </h3>
              <p className="text-xs text-[#a1a1aa] font-mono mt-1.5 line-clamp-2">
                Multi-reference environmental sets with day/night variations, interior lighting cues, and prompt anchors.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#27272a] flex items-center justify-between text-xs font-mono text-[#71717a] group-hover:text-[#fafafa]">
              <span>5 MASTER SETS</span>
              <ArrowUpRight className="w-4 h-4 text-[#71717a] group-hover:text-[#3b82f6]" />
            </div>
          </Link>

          {/* Module 3: Storyboard */}
          <Link
            href="/storyboard"
            className="p-5 bg-[#121215] hover:bg-[#18181b] border border-[#27272a] hover:border-[#3b82f6] transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-[#3b82f6]/10 border border-[#3b82f6]/30 text-[#3b82f6]">
                  <Clapperboard className="w-5 h-5" />
                </div>
                <span className="font-mono text-[10px] text-[#71717a] px-2 py-0.5 bg-[#09090b] border border-[#27272a]">
                  MODULE 03 // DIRECTOR
                </span>
              </div>
              <h3 className="text-base font-mono font-bold text-[#fafafa] group-hover:text-[#3b82f6] transition-colors">
                STORYBOARD DIRECTOR
              </h3>
              <p className="text-xs text-[#a1a1aa] font-mono mt-1.5 line-clamp-2">
                Multi-shot directorial planner, camera movement cues, audio foley prompts, and real-time 4-step Turbo render HUD.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#27272a] flex items-center justify-between text-xs font-mono text-[#71717a] group-hover:text-[#fafafa]">
              <span>18 SHOTS IN SEQUENCE</span>
              <ArrowUpRight className="w-4 h-4 text-[#71717a] group-hover:text-[#3b82f6]" />
            </div>
          </Link>

          {/* Module 4: Dailies */}
          <Link
            href="/dailies"
            className="p-5 bg-[#121215] hover:bg-[#18181b] border border-[#27272a] hover:border-[#3b82f6] transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-[#f59e0b]/10 border border-[#f59e0b]/30 text-[#f59e0b]">
                  <Film className="w-5 h-5" />
                </div>
                <span className="font-mono text-[10px] text-[#71717a] px-2 py-0.5 bg-[#09090b] border border-[#27272a]">
                  MODULE 04 // REVIEW
                </span>
              </div>
              <h3 className="text-base font-mono font-bold text-[#fafafa] group-hover:text-[#3b82f6] transition-colors">
                DAILIES & TAKE COMPARE
              </h3>
              <p className="text-xs text-[#a1a1aa] font-mono mt-1.5 line-clamp-2">
                Frame-accurate player, side-by-side consistency comparison, take tagging [SELECT/NG], and audio waveform inspect.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#27272a] flex items-center justify-between text-xs font-mono text-[#71717a] group-hover:text-[#fafafa]">
              <span>46 TAKES REVIEWABLE</span>
              <ArrowUpRight className="w-4 h-4 text-[#71717a] group-hover:text-[#3b82f6]" />
            </div>
          </Link>

          {/* Module 5: Timeline */}
          <Link
            href="/timeline"
            className="p-5 bg-[#121215] hover:bg-[#18181b] border border-[#27272a] hover:border-[#3b82f6] transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-[#f43f5e]/10 border border-[#f43f5e]/30 text-[#f43f5e]">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <span className="font-mono text-[10px] text-[#71717a] px-2 py-0.5 bg-[#09090b] border border-[#27272a]">
                  MODULE 05 // POST-PROD
                </span>
              </div>
              <h3 className="text-base font-mono font-bold text-[#fafafa] group-hover:text-[#3b82f6] transition-colors">
                TIMELINE NLE (FFMPEG)
              </h3>
              <p className="text-xs text-[#a1a1aa] font-mono mt-1.5 line-clamp-2">
                Multi-track video and dialogue/foley editing, cross-dissolve transitions, clip trimming, and lossless ProRes master export.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#27272a] flex items-center justify-between text-xs font-mono text-[#71717a] group-hover:text-[#fafafa]">
              <span>4 TRACKS ACTIVE (V1, A1, A2, A3)</span>
              <ArrowUpRight className="w-4 h-4 text-[#71717a] group-hover:text-[#3b82f6]" />
            </div>
          </Link>

          {/* Module 6: Batch Queue */}
          <Link
            href="/queue"
            className="p-5 bg-[#121215] hover:bg-[#18181b] border border-[#27272a] hover:border-[#3b82f6] transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-[#10b981]/10 border border-[#10b981]/30 text-[#10b981]">
                  <Layers className="w-5 h-5" />
                </div>
                <span className="font-mono text-[10px] text-[#71717a] px-2 py-0.5 bg-[#09090b] border border-[#27272a]">
                  MODULE 06 // BATCH RUNNER
                </span>
              </div>
              <h3 className="text-base font-mono font-bold text-[#fafafa] group-hover:text-[#3b82f6] transition-colors">
                BATCH RENDER QUEUE
              </h3>
              <p className="text-xs text-[#a1a1aa] font-mono mt-1.5 line-clamp-2">
                Overnight automated multi-take generator with macOS caffeinate power lock, auto-recovery, and progress streaming.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#27272a] flex items-center justify-between text-xs font-mono text-[#71717a] group-hover:text-[#fafafa]">
              <span>IDLE (READY FOR JOBS)</span>
              <ArrowUpRight className="w-4 h-4 text-[#71717a] group-hover:text-[#3b82f6]" />
            </div>
          </Link>
        </div>
      </div>

      {/* Two-Column Layout: Active Scene Storyboard & Engine Diagnostic Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Scene Storyboard Shots */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-[#a1a1aa] flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#10b981]"></span>
              <span>ACTIVE SCENE SHOTS (SCENE 04)</span>
            </h2>
            <Link href="/storyboard" className="text-xs font-mono text-[#3b82f6] hover:underline flex items-center gap-1">
              <span>VIEW ALL IN DIRECTOR</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2">
            {/* Shot 1 */}
            <div className="p-4 bg-[#121215] border border-[#27272a] hover:border-[#3f3f46] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#18181b] border border-[#27272a] flex items-center justify-center font-mono font-bold text-xs text-[#3b82f6] shrink-0">
                  01
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#fafafa]">SHOT_04_01: ESTABLISHING ROOFTOP</span>
                    <span className="px-1.5 py-0.2 bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/30 font-mono text-[9px]">
                      READY (4 TAKES)
                    </span>
                  </div>
                  <p className="text-xs font-mono text-[#a1a1aa] mt-1">
                    Wide crane shot over rain-drenched solar panels. Cyberpunk neon skyline in background.
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-[#71717a]">
                    <span>CAST: KAITO</span>
                    <span>•</span>
                    <span>LOC: ROOFTOP_NIGHT</span>
                    <span>•</span>
                    <span>4.0s @ 24FPS</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href="/dailies"
                  className="px-3 py-1.5 bg-[#18181b] hover:bg-[#27272a] border border-[#3f3f46] text-xs font-mono text-[#fafafa] transition-colors"
                >
                  TAKES [4]
                </Link>
                <Link
                  href="/storyboard"
                  className="px-3 py-1.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs font-mono font-bold transition-colors"
                >
                  DIRECT
                </Link>
              </div>
            </div>

            {/* Shot 2 */}
            <div className="p-4 bg-[#121215] border border-[#27272a] hover:border-[#3f3f46] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#18181b] border border-[#27272a] flex items-center justify-center font-mono font-bold text-xs text-[#3b82f6] shrink-0">
                  02
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#fafafa]">SHOT_04_02: MEDIUM TRACKING SPRINT</span>
                    <span className="px-1.5 py-0.2 bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/30 font-mono text-[9px]">
                      READY (3 TAKES)
                    </span>
                  </div>
                  <p className="text-xs font-mono text-[#a1a1aa] mt-1">
                    Medium tracking profile. Kaito sprints toward edge, trench coat billowing in high wind.
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-[#71717a]">
                    <span>CAST: KAITO</span>
                    <span>•</span>
                    <span>LOC: ROOFTOP_NIGHT</span>
                    <span>•</span>
                    <span>3.5s @ 24FPS</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href="/dailies"
                  className="px-3 py-1.5 bg-[#18181b] hover:bg-[#27272a] border border-[#3f3f46] text-xs font-mono text-[#fafafa] transition-colors"
                >
                  TAKES [3]
                </Link>
                <Link
                  href="/storyboard"
                  className="px-3 py-1.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs font-mono font-bold transition-colors"
                >
                  DIRECT
                </Link>
              </div>
            </div>

            {/* Shot 3 */}
            <div className="p-4 bg-[#121215] border border-[#27272a] hover:border-[#3f3f46] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#18181b] border border-[#27272a] flex items-center justify-center font-mono font-bold text-xs text-[#f59e0b] shrink-0">
                  03
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#fafafa]">SHOT_04_03: DRONE INTERCEPT HOVER</span>
                    <span className="px-1.5 py-0.2 bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/30 font-mono text-[9px]">
                      PENDING GENERATION
                    </span>
                  </div>
                  <p className="text-xs font-mono text-[#a1a1aa] mt-1">
                    Low-angle shot looking up. Security drone CY-09 sweeps red searchlight across ledge.
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-[#71717a]">
                    <span>CAST: CY-09</span>
                    <span>•</span>
                    <span>LOC: ROOFTOP_NIGHT</span>
                    <span>•</span>
                    <span>4.0s @ 24FPS</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href="/storyboard"
                  className="px-3 py-1.5 bg-[#f59e0b] hover:bg-[#d97706] text-black text-xs font-mono font-bold transition-colors flex items-center gap-1.5"
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>RENDER SHOT</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Local Engine & Vault Diagnostics */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-[#a1a1aa] flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#3b82f6]"></span>
              <span>ENGINE & VAULT DIAGNOSTICS</span>
            </h2>
            <span className="text-[10px] font-mono text-[#10b981]">SYSTEM NORMAL</span>
          </div>

          <div className="p-4 bg-[#121215] border border-[#27272a] space-y-4">
            {/* Model Stack Status */}
            <div className="space-y-2">
              <div className="text-[11px] font-mono font-semibold text-[#fafafa] flex items-center justify-between">
                <span>COMFYUI MODEL VAULT</span>
                <span className="text-[10px] text-[#10b981]">LOCAL VERIFIED</span>
              </div>

              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between p-2 bg-[#18181b] border border-[#27272a]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981]" />
                    <span className="text-[#fafafa]">MiniMax H3 Ref2VA (INT8)</span>
                  </div>
                  <span className="text-[#71717a] text-[10px]">INT8 OPT</span>
                </div>

                <div className="flex items-center justify-between p-2 bg-[#18181b] border border-[#27272a]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981]" />
                    <span className="text-[#fafafa]">4-Step Turbo LoRA</span>
                  </div>
                  <span className="text-[#10b981] text-[10px]">TURBO</span>
                </div>

                <div className="flex items-center justify-between p-2 bg-[#18181b] border border-[#27272a]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981]" />
                    <span className="text-[#fafafa]">Qwen3-VL 32B Text Encoder</span>
                  </div>
                  <span className="text-[#71717a] text-[10px]">PROMPT-DOC</span>
                </div>

                <div className="flex items-center justify-between p-2 bg-[#18181b] border border-[#27272a]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981]" />
                    <span className="text-[#fafafa]">Synchronized 32kHz Audio VAE</span>
                  </div>
                  <span className="text-[#3b82f6] text-[10px]">FOLEY VAE</span>
                </div>
              </div>
            </div>

            {/* System Hardware & Storage */}
            <div className="pt-3 border-t border-[#27272a] space-y-2">
              <div className="text-[11px] font-mono font-semibold text-[#fafafa]">
                HOST SYSTEM RESOURCES
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 bg-[#18181b] border border-[#27272a]">
                  <span className="text-[10px] text-[#71717a]">UNIFIED MEMORY</span>
                  <div className="text-[#fafafa] font-bold mt-1">96.4 GB / 128 GB</div>
                  <div className="w-full bg-[#27272a] h-1.5 mt-1.5 overflow-hidden">
                    <div className="bg-[#3b82f6] h-full" style={{ width: "75%" }} />
                  </div>
                </div>

                <div className="p-2.5 bg-[#18181b] border border-[#27272a]">
                  <span className="text-[10px] text-[#71717a]">SHARED VAULT DISK</span>
                  <div className="text-[#fafafa] font-bold mt-1">1.4 TB FREE</div>
                  <div className="w-full bg-[#27272a] h-1.5 mt-1.5 overflow-hidden">
                    <div className="bg-[#10b981] h-full" style={{ width: "42%" }} />
                  </div>
                </div>
              </div>
            </div>

            {/* macOS Anti-Sleep Watchdog Status */}
            <div className="pt-3 border-t border-[#27272a] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#10b981]" />
                <div>
                  <div className="text-xs font-mono font-bold text-[#fafafa]">macOS Caffeinate Watchdog</div>
                  <div className="text-[10px] font-mono text-[#71717a]">PID auto-binding active</div>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/30 text-[10px] font-mono">
                ACTIVE
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
