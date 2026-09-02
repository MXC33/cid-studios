"use client";

import React, { useState, useRef } from "react";
import { Upload, X, Check, Image as ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReferenceSlotUploaderProps {
  label: string;
  subtitle: string;
  slotNumber: string;
  value?: string | null;
  onChange: (path: string | null) => void;
  aspectRatio?: string;
  compact?: boolean;
}

export function ReferenceSlotUploader({
  label,
  subtitle,
  slotNumber,
  value,
  onChange,
  aspectRatio = "aspect-[3/4]",
  compact = false,
}: ReferenceSlotUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!file) return;
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/assets/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Upload failed");
      }

      // Store clean filename or relative vault path
      onChange(data.filename);
    } catch (err: any) {
      console.error("Failed to upload reference:", err);
      setError(err.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  // Determine image source URL
  const getImageSrc = (val: string) => {
    if (val.startsWith("http://") || val.startsWith("https://") || val.startsWith("data:")) {
      return val;
    }
    if (val.startsWith("/vault/")) {
      return val;
    }
    return `/vault/${val}`;
  };

  return (
    <div className="flex flex-col space-y-1.5 font-mono">
      <div className="flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5">
          <span className="px-1 py-0.2 bg-[#27272a] text-[#a1a1aa] font-bold text-[9px]">
            {slotNumber}
          </span>
          <span className="font-bold text-[#fafafa] uppercase">{label}</span>
        </div>
        <span className="text-[9px] text-[#71717a] truncate max-w-[120px]">{subtitle}</span>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !value && !isUploading && fileInputRef.current?.click()}
        className={cn(
          "relative border transition-all overflow-hidden flex flex-col items-center justify-center text-center select-none group",
          aspectRatio,
          value ? "bg-[#09090b] border-[#27272a]" : "bg-[#121215] border-dashed cursor-pointer",
          dragOver ? "border-[#10b981] bg-[#10b981]/5" : "",
          !value && !dragOver ? "border-[#27272a] hover:border-[#3f3f46] hover:bg-[#18181b]" : ""
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {value ? (
          <div className="relative w-full h-full flex flex-col items-center justify-center bg-[#09090b]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getImageSrc(value)}
              alt={label}
              className="w-full h-full object-cover object-center"
              onError={(e) => {
                // If vault fails to load directly, fallback to placeholder styling
                (e.target as HTMLElement).style.display = "none";
              }}
            />

            {/* Overlay controls */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />

            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[9px] font-mono z-10">
              <span className="truncate max-w-[140px] text-[#fafafa] bg-[#09090b]/80 px-1.5 py-0.5 border border-[#27272a]">
                {value}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="p-1 bg-[#18181b] hover:bg-[#27272a] text-[#a1a1aa] hover:text-[#fafafa] border border-[#27272a] transition-colors"
                  title="Replace reference image"
                >
                  <Upload className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(null);
                  }}
                  className="p-1 bg-[#18181b] hover:bg-[#f43f5e] text-[#a1a1aa] hover:text-white border border-[#27272a] transition-colors"
                  title="Remove reference"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="absolute top-2 left-2 z-10">
              <span className="flex items-center gap-1 px-1.5 py-0.5 bg-[#10b981]/20 border border-[#10b981]/40 text-[#10b981] text-[8px] font-bold uppercase">
                <Check className="w-2.5 h-2.5" />
                SYNCED
              </span>
            </div>
          </div>
        ) : isUploading ? (
          <div className="flex flex-col items-center justify-center p-4 space-y-2 text-[#a1a1aa]">
            <Loader2 className="w-5 h-5 text-[#10b981] animate-spin" />
            <span className="text-[10px] uppercase font-bold text-[#fafafa]">SYNCING VAULT...</span>
            <span className="text-[8px] text-[#71717a]">Auto-routing to ComfyUI/input</span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-3 space-y-1.5 text-[#71717a] group-hover:text-[#a1a1aa]">
            <div className="p-2 bg-[#18181b] border border-[#27272a] group-hover:border-[#3b82f6] text-[#71717a] group-hover:text-[#3b82f6] transition-colors">
              <Upload className="w-4 h-4" />
            </div>
            <div className="text-center">
              <p className="text-[10px] font-bold text-[#fafafa] group-hover:text-[#3b82f6] uppercase">
                DROP OR CLICK
              </p>
              <p className="text-[8px] text-[#71717a]">PNG / JPG / WEBP</p>
            </div>
          </div>
        )}
      </div>

      {error && <span className="text-[9px] text-[#f43f5e] font-mono">{error}</span>}
    </div>
  );
}
