"use client";

import React from "react";
import { Shield, FolderCheck, Cpu, CheckCircle2 } from "lucide-react";

export function StatusBar() {
  return (
    <footer className="w-full bg-[#09090b] border-t border-[#27272a] px-4 py-1.5 flex flex-wrap items-center justify-between text-[11px] font-mono text-[#a1a1aa] select-none">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 text-[#fafafa]">
          <Shield className="w-3.5 h-3.5 text-[#10b981]" />
          <span className="text-[#71717a]">SYSTEM GUARD:</span>
          <span className="text-[#10b981]">CAFFEINATE ARMED</span>
          <span className="text-[9px] text-[#71717a] font-normal">(NO SLEEP DURING RENDER)</span>
        </div>

        <span className="text-[#27272a] hidden md:inline">|</span>

        <div className="items-center gap-1.5 hidden md:flex">
          <FolderCheck className="w-3.5 h-3.5 text-[#3b82f6]" />
          <span className="text-[#71717a]">VAULT PATH:</span>
          <span className="text-[#fafafa] bg-[#18181b] px-1 py-0.5 border border-[#27272a] text-[10px]">
            /Users/mxc/ComfyUI-Shared/
          </span>
        </div>

        <span className="text-[#27272a] hidden lg:inline">|</span>

        <div className="items-center gap-1.5 hidden lg:flex">
          <Cpu className="w-3.5 h-3.5 text-[#f59e0b]" />
          <span className="text-[#71717a]">ACTIVE STACK:</span>
          <span className="text-[#fafafa]">MiniMax H3 Ref2VA</span>
          <span className="text-[#71717a]">+</span>
          <span className="text-[#fafafa]">Qwen3-VL 32B</span>
          <span className="text-[#71717a]">+</span>
          <span className="text-[#3b82f6]">32kHz Foley VAE</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[#71717a] text-[10px]">KEYMAP:</span>
          <span className="bg-[#18181b] border border-[#27272a] text-[#a1a1aa] px-1 py-0.2 text-[9px] font-bold">SPACE</span>
          <span className="text-[10px] text-[#71717a]">PLAY</span>
          <span className="bg-[#18181b] border border-[#27272a] text-[#a1a1aa] px-1 py-0.2 text-[9px] font-bold">⌘R</span>
          <span className="text-[10px] text-[#71717a]">RENDER</span>
          <span className="bg-[#18181b] border border-[#27272a] text-[#a1a1aa] px-1 py-0.2 text-[9px] font-bold">⌘E</span>
          <span className="text-[10px] text-[#71717a]">EXPORT</span>
        </div>

        <div className="flex items-center gap-1.5 text-[#10b981]">
          <CheckCircle2 className="w-3 h-3" />
          <span className="text-[10px] tracking-wider font-semibold">ALL ENGINES READY</span>
        </div>
      </div>
    </footer>
  );
}
