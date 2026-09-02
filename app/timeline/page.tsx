"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Download,
  Scissors,
  Volume2,
  Plus,
  Play,
  Pause,
  Layers,
  Sparkles,
  Save,
  RotateCcw,
  Film,
  Music,
  SlidersHorizontal,
  FolderDown,
  Clock,
  History,
  Check,
} from "lucide-react";
import { ProgramMonitor } from "@/components/timeline/ProgramMonitor";
import { TimelineCanvas } from "@/components/timeline/TimelineCanvas";
import { TakeBinDrawer } from "@/components/timeline/TakeBinDrawer";
import { ExportModal } from "@/components/timeline/ExportModal";
import {
  TimelineClipUI,
  TrackState,
  PlayheadState,
  TimelineSettings,
} from "@/components/timeline/types";
import { cn } from "@/lib/utils";

const INITIAL_TRACKS: TrackState[] = [
  {
    id: "track_v1",
    name: "V1",
    type: "video",
    label: "V1 VIDEO CUTS",
    subLabel: "MASTER 24FPS",
    color: "#3b82f6",
    muted: false,
    solo: false,
    volume: 1.0,
  },
  {
    id: "track_a1",
    name: "A1",
    type: "audio_dialogue",
    label: "A1 DIALOGUE & VOICE",
    subLabel: "48kHz STEREO",
    color: "#10b981",
    muted: false,
    solo: false,
    volume: 1.0,
  },
  {
    id: "track_a2",
    name: "A2",
    type: "audio_foley",
    label: "A2 FOLEY & SFX",
    subLabel: "48kHz MASTER",
    color: "#06b6d4",
    muted: false,
    solo: false,
    volume: 1.0,
  },
  {
    id: "track_a3",
    name: "A3",
    type: "audio_music",
    label: "A3 SCORE & OST",
    subLabel: "48kHz MASTER",
    color: "#f59e0b",
    muted: false,
    solo: false,
    volume: 0.8,
  },
];

export default function TimelinePage() {
  const [projectId] = useState("proj_neo_tokyo_2088");

  // Timeline Clips state
  const [videoClips, setVideoClips] = useState<TimelineClipUI[]>([]);
  const [audioClips, setAudioClips] = useState<TimelineClipUI[]>([]);
  const [tracks, setTracks] = useState<TrackState[]>(INITIAL_TRACKS);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);

  // Playhead & Playback state
  const [playhead, setPlayhead] = useState<PlayheadState>({
    currentTime: 0,
    isPlaying: false,
    duration: 0,
    fps: 24,
    loop: true,
  });

  // Settings state
  const [settings, setSettings] = useState<TimelineSettings>({
    zoom: 65,
    snapToCuts: true,
    showWaveforms: true,
    aspectRatioGuide: "none",
  });

  // Modals & Drawers state
  const [isTakeBinOpen, setIsTakeBinOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [pastExports, setPastExports] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [savedBadge, setSavedBadge] = useState(false);

  // Calculate total timeline duration across all tracks
  const totalVideoDuration = videoClips.reduce(
    (max, c) => Math.max(max, c.start_time + c.duration),
    0
  );
  const totalAudioDuration = audioClips.reduce(
    (max, c) => Math.max(max, c.start_time + c.duration),
    0
  );
  const totalDuration = Math.max(0.1, totalVideoDuration, totalAudioDuration);

  // Load saved timeline from backend DB
  useEffect(() => {
    const loadTimeline = async () => {
      try {
        const res = await fetch(`/api/timeline?projectId=${projectId}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.clips) && data.clips.length > 0) {
          const vClips: TimelineClipUI[] = [];
          const aClips: TimelineClipUI[] = [];

          data.clips.forEach((c: any) => {
            const clipUI: TimelineClipUI = {
              ...c,
              muted: Boolean(c.muted),
            };
            if (c.track_type === "video") {
              vClips.push(clipUI);
            } else {
              aClips.push(clipUI);
            }
          });

          // Recalculate contiguous start_time for video clips
          let curTime = 0;
          const normalizedVClips = vClips.map((vc, i) => {
            const clip = { ...vc, start_time: curTime, order_index: i };
            curTime += vc.duration;
            return clip;
          });

          setVideoClips(normalizedVClips);
          setAudioClips(aClips);
        } else {
          // If empty, auto-populate from existing takes if available
          const takesRes = await fetch(`/api/takes?projectId=${projectId}`);
          const takesData = await takesRes.json();
          const takes = takesData.takes || [];

          if (takes.length > 0) {
            let offset = 0;
            const initialVClips: TimelineClipUI[] = takes.slice(0, 3).map((t: any, idx: number) => {
              const dur = t.duration || 3.0;
              const clip: TimelineClipUI = {
                id: `clip_${Date.now()}_${idx}`,
                project_id: projectId,
                take_id: t.id,
                track_type: "video",
                track_index: 0,
                name: `SHOT_${t.shot_id?.replace("shot_", "") || "01"} (TAKE ${t.take_number})`,
                file_path: t.video_path || "/vault/Shampoo-action.jpg",
                trim_in: 0,
                trim_out: dur,
                start_time: offset,
                duration: dur,
                volume: 1.0,
                muted: false,
                speed: 1.0,
                order_index: idx,
                take: t,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };
              offset += dur;
              return clip;
            });

            // Initial audio tracks
            const initialAClips: TimelineClipUI[] = [
              {
                id: `audio_foley_1`,
                project_id: projectId,
                track_type: "audio_foley",
                track_index: 2,
                name: "Neo-Akiba Store Chime",
                file_path: "/audio/store_chime.wav",
                trim_in: 0,
                trim_out: 2.0,
                start_time: 0.0,
                duration: 2.0,
                volume: 1.0,
                muted: false,
                speed: 1.0,
                order_index: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              {
                id: `audio_music_1`,
                project_id: projectId,
                track_type: "audio_music",
                track_index: 3,
                name: "Cyberpunk Tension Drone Score",
                file_path: "/audio/cyberpunk_drone_score.wav",
                trim_in: 0,
                trim_out: Math.max(6.0, offset),
                start_time: 0.0,
                duration: Math.max(6.0, offset),
                volume: 0.8,
                muted: false,
                speed: 1.0,
                order_index: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ];

            setVideoClips(initialVClips);
            setAudioClips(initialAClips);
          }
        }
      } catch (err) {
        console.error("Error initializing timeline:", err);
      }
    };

    loadTimeline();
  }, [projectId]);

  // Recalculate video start times whenever clips list changes
  const recalculateVideoStartTimes = (clips: TimelineClipUI[]): TimelineClipUI[] => {
    let cur = 0;
    return clips.map((c, i) => {
      const updated = { ...c, start_time: cur, order_index: i };
      cur += c.duration;
      return updated;
    });
  };

  // Playhead ticking loop
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  const tickPlayhead = useCallback(() => {
    const now = performance.now();
    const delta = (now - lastTimeRef.current) / 1000;
    lastTimeRef.current = now;

    setPlayhead((prev) => {
      if (!prev.isPlaying) return prev;
      let nextTime = prev.currentTime + delta;
      if (nextTime >= totalDuration) {
        if (prev.loop) {
          nextTime = 0;
        } else {
          return { ...prev, currentTime: totalDuration, isPlaying: false };
        }
      }
      return { ...prev, currentTime: nextTime };
    });

    animationFrameRef.current = requestAnimationFrame(tickPlayhead);
  }, [totalDuration]);

  useEffect(() => {
    if (playhead.isPlaying) {
      lastTimeRef.current = performance.now();
      animationFrameRef.current = requestAnimationFrame(tickPlayhead);
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [playhead.isPlaying, tickPlayhead]);

  // Identify active video clip at playhead
  let activeClip: TimelineClipUI | null = null;
  let activeClipOffset = 0;

  for (const c of videoClips) {
    if (playhead.currentTime >= c.start_time && playhead.currentTime < c.start_time + c.duration) {
      activeClip = c;
      activeClipOffset = playhead.currentTime - c.start_time;
      break;
    }
  }

  // Handle Seek
  const handleSeek = (time: number) => {
    setPlayhead((prev) => ({
      ...prev,
      currentTime: Math.max(0, Math.min(totalDuration, time)),
    }));
  };

  // Handle Play/Pause
  const handleTogglePlay = () => {
    setPlayhead((prev) => ({
      ...prev,
      isPlaying: !prev.isPlaying,
    }));
  };

  // Save full timeline to backend DB
  const handleSaveTimeline = async () => {
    setIsSaving(true);
    try {
      const allClipsToSave = [...videoClips, ...audioClips].map((c) => ({
        ...c,
        muted: c.muted ? 1 : 0,
      }));

      await fetch("/api/timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          clips: allClipsToSave,
        }),
      });

      setSavedBadge(true);
      setTimeout(() => setSavedBadge(false), 2500);
    } catch (err) {
      console.error("Failed to save timeline:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Add Take to V1
  const handleAddTake = (take: any) => {
    const dur = take.duration || 3.0;
    const newClip: TimelineClipUI = {
      id: `clip_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      project_id: projectId,
      take_id: take.id,
      track_type: "video",
      track_index: 0,
      name: `${take.shot?.framing || `Shot ${take.shot?.shot_number || "1"}`} (T#${take.take_number})`,
      file_path: take.video_path || "/vault/Shampoo-action.jpg",
      trim_in: 0,
      trim_out: dur,
      start_time: totalVideoDuration,
      duration: dur,
      volume: 1.0,
      muted: false,
      speed: 1.0,
      order_index: videoClips.length,
      take,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updated = recalculateVideoStartTimes([...videoClips, newClip]);
    setVideoClips(updated);
    setIsTakeBinOpen(false);
  };

  // Add Audio to Track
  const handleAddAudio = (
    audioItem: any,
    trackType: "audio_dialogue" | "audio_foley" | "audio_music"
  ) => {
    const newAudioClip: TimelineClipUI = {
      id: `audio_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      project_id: projectId,
      track_type: trackType,
      track_index: trackType === "audio_dialogue" ? 1 : trackType === "audio_foley" ? 2 : 3,
      name: audioItem.name,
      file_path: audioItem.filePath,
      trim_in: 0,
      trim_out: audioItem.duration,
      start_time: playhead.currentTime,
      duration: audioItem.duration,
      volume: 1.0,
      muted: false,
      speed: 1.0,
      order_index: audioClips.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setAudioClips((prev) => [...prev, newAudioClip]);
    setIsTakeBinOpen(false);
  };

  // Update clip
  const handleUpdateClip = (clipId: string, updates: Partial<TimelineClipUI>) => {
    if (videoClips.some((c) => c.id === clipId)) {
      const updated = videoClips.map((c) => (c.id === clipId ? { ...c, ...updates } : c));
      setVideoClips(recalculateVideoStartTimes(updated));
    } else {
      setAudioClips((prev) =>
        prev.map((c) => (c.id === clipId ? { ...c, ...updates } : c))
      );
    }
  };

  // Delete clip
  const handleDeleteClip = (clipId: string) => {
    if (videoClips.some((c) => c.id === clipId)) {
      const updated = videoClips.filter((c) => c.id !== clipId);
      setVideoClips(recalculateVideoStartTimes(updated));
    } else {
      setAudioClips((prev) => prev.filter((c) => c.id !== clipId));
    }
    if (selectedClipId === clipId) setSelectedClipId(null);
  };

  // Reorder video cuts
  const handleReorderVideoClips = (startIndex: number, endIndex: number) => {
    const result = Array.from(videoClips);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    setVideoClips(recalculateVideoStartTimes(result));
  };

  // Razor cut / Split clip at playhead
  const handleSplitClipAtPlayhead = (clipId: string, splitTime: number) => {
    const clip = videoClips.find((c) => c.id === clipId);
    if (!clip) return;

    if (splitTime <= clip.start_time + 0.1 || splitTime >= clip.start_time + clip.duration - 0.1) {
      return; // too close to edge
    }

    const firstDuration = splitTime - clip.start_time;
    const secondDuration = clip.duration - firstDuration;

    const firstPart: TimelineClipUI = {
      ...clip,
      duration: firstDuration,
      trim_out: (clip.trim_in || 0) + firstDuration,
    };

    const secondPart: TimelineClipUI = {
      ...clip,
      id: `clip_${Date.now()}_split`,
      name: `${clip.name} (Part 2)`,
      trim_in: (clip.trim_in || 0) + firstDuration,
      trim_out: (clip.trim_in || 0) + clip.duration,
      duration: secondDuration,
      start_time: splitTime,
      order_index: clip.order_index + 1,
    };

    const index = videoClips.findIndex((c) => c.id === clipId);
    const newClips = [...videoClips];
    newClips.splice(index, 1, firstPart, secondPart);
    setVideoClips(recalculateVideoStartTimes(newClips));
  };

  // Update track volume/mute/solo
  const handleUpdateTrack = (trackId: string, updates: Partial<TrackState>) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, ...updates } : t))
    );
  };

  // Load past exports list
  const loadPastExports = async () => {
    try {
      const res = await fetch("/api/export");
      const data = await res.json();
      if (data.success && Array.isArray(data.exports)) {
        setPastExports(data.exports);
      }
    } catch (err) {
      console.error("Failed to load past exports:", err);
    }
  };

  return (
    <div className="flex-1 p-4 md:p-6 space-y-6 max-w-[1700px] mx-auto w-full select-none">
      {/* NLE Studio Command Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-[#121215] border border-[#27272a] shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 bg-[#f43f5e]/20 border border-[#f43f5e]/40 text-[#f43f5e] text-[10px] font-mono font-bold uppercase tracking-wider">
              POST-PRODUCTION NLE
            </span>
            <span className="text-xs font-mono text-[#71717a]">MODULE 05</span>
            <span className="text-[#3f3f46]">|</span>
            <span className="text-xs font-mono text-[#3b82f6]">FFMPEG MASTER PIPELINE</span>
          </div>
          <h1 className="text-2xl font-mono font-bold text-[#fafafa] mt-1 tracking-tight">
            TIMELINE NLE & MASTER EXPORTER
          </h1>
          <p className="text-xs text-[#a1a1aa] font-mono mt-0.5">
            Multi-track sequence assembly, frame-accurate trimming, multi-channel audio mixing, and lossless ProRes / H.264 master film export.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              loadPastExports();
              setIsHistoryOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-[#a1a1aa] hover:text-[#fafafa] text-xs font-mono font-bold uppercase transition-colors"
          >
            <History className="w-4 h-4 text-[#3b82f6]" />
            <span>RENDER HISTORY</span>
          </button>

          <button
            onClick={handleSaveTimeline}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-[#a1a1aa] hover:text-[#fafafa] text-xs font-mono font-bold uppercase transition-colors"
          >
            {savedBadge ? (
              <>
                <Check className="w-4 h-4 text-[#10b981]" />
                <span className="text-[#10b981]">SAVED TO DB</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-[#f59e0b]" />
                <span>SAVE TIMELINE</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2 bg-[#f43f5e] hover:bg-[#e11d48] text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors shadow-lg"
          >
            <Download className="w-4 h-4" />
            <span>EXPORT MASTER (FFMPEG)</span>
          </button>
        </div>
      </div>

      {/* Program Monitor Section */}
      <div className="w-full">
        <ProgramMonitor
          playhead={playhead}
          onSeek={handleSeek}
          onTogglePlay={handleTogglePlay}
          videoClips={videoClips}
          activeClip={activeClip}
          activeClipOffset={activeClipOffset}
          aspectRatioGuide={settings.aspectRatioGuide}
          onAspectRatioChange={(ratio) =>
            setSettings((prev) => ({ ...prev, aspectRatioGuide: ratio }))
          }
          totalDuration={totalDuration}
        />
      </div>

      {/* Multi-Track Timeline Canvas Section */}
      <div className="w-full">
        <TimelineCanvas
          playhead={playhead}
          onSeek={handleSeek}
          videoClips={videoClips}
          audioClips={audioClips}
          tracks={tracks}
          selectedClipId={selectedClipId}
          onSelectClip={setSelectedClipId}
          onUpdateClip={handleUpdateClip}
          onDeleteClip={handleDeleteClip}
          onReorderVideoClips={handleReorderVideoClips}
          onSplitClipAtPlayhead={handleSplitClipAtPlayhead}
          onUpdateTrack={handleUpdateTrack}
          settings={settings}
          onUpdateSettings={(up) => setSettings((prev) => ({ ...prev, ...up }))}
          totalDuration={totalDuration}
          onOpenTakeBin={() => setIsTakeBinOpen(true)}
          onOpenAudioBin={() => setIsTakeBinOpen(true)}
          onClearTimeline={() => {
            if (confirm("Clear all clips from the current timeline?")) {
              setVideoClips([]);
              setAudioClips([]);
              setSelectedClipId(null);
            }
          }}
        />
      </div>

      {/* Media & Take Bin Drawer */}
      <TakeBinDrawer
        isOpen={isTakeBinOpen}
        onClose={() => setIsTakeBinOpen(false)}
        projectId={projectId}
        onAddTakeToTimeline={handleAddTake}
        onAddAudioToTimeline={handleAddAudio}
      />

      {/* Master Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        videoClips={videoClips}
        audioClips={audioClips}
        tracks={tracks}
        projectId={projectId}
        totalDuration={totalDuration}
      />

      {/* Past Renders History Drawer / Modal */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-[#121215] border border-[#27272a] shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-[#18181b] border-b border-[#27272a]">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#3b82f6]" />
                <h3 className="text-sm font-mono font-bold text-[#fafafa] uppercase">
                  MASTER RENDER EXPORT ARCHIVE
                </h3>
              </div>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="p-1 hover:bg-[#27272a] text-[#a1a1aa] hover:text-[#fafafa]"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs">
              {pastExports.length === 0 ? (
                <div className="p-8 text-center text-[#71717a]">
                  No master cut exports rendered yet. Execute a master render to build your archive.
                </div>
              ) : (
                pastExports.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[#18181b] border border-[#27272a] hover:border-[#3b82f6] transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="flex flex-col overflow-hidden">
                      <span className="font-bold text-[#fafafa] truncate">{item.filename}</span>
                      <div className="flex items-center gap-3 text-[10px] text-[#71717a] mt-1">
                        <span>{item.resolution || "1080P"}</span>
                        <span>•</span>
                        <span>{item.duration ? `${item.duration.toFixed(1)}s` : "Master"}</span>
                        <span>•</span>
                        <span>{(item.size / (1024 * 1024)).toFixed(2)} MB</span>
                        <span>•</span>
                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={item.publicUrl}
                        download
                        className="px-3 py-1.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>DOWNLOAD</span>
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
