# CID Studios — Local-First AI Movie Studio

> **Architecture & Implementation Plan**

**Goal:** Build a production-grade, local-first AI filmmaking suite that turns multi-shot directorial scripts, character consistency sheets, and foley audio into finished movie scenes using local ComfyUI engines (MiniMax H3 / Flux) and an integrated FFmpeg timeline.

**Tech Stack:**
- **Frontend / Studio UI:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS (Swiss Brutalist dark aesthetic, high contrast, crisp typography).
- **Backend Bridge & Engine Control:** Node.js / TypeScript API routes + WebSocket client connected to ComfyUI (`ws://127.0.0.1:8188/ws` & `http://127.0.0.1:8188`).
- **Post-Production Video Engine:** Native `ffmpeg` bindings / CLI pipeline for clip slicing, audio layering, speed re-timing, transition stitching, and master export.
- **Local Storage / Persistence:** Local SQLite database (`better-sqlite3`) + file-system-first asset vault (direct links to `/Users/mxc/ComfyUI-Shared/` and project folders).
- **System Safeguards:** Automated macOS `caffeinate` process binding during active render batches.

---

## Architecture Blueprint

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           CID STUDIOS (Web UI)                           │
│ ┌──────────────┬──────────────────┬──────────────────┬─────────────────┐ │
│ │ 1. CASTING   │ 2. STORYBOARD    │ 3. TIMELINE      │ 4. DAILIES &    │ │
│ │ & LOCATIONS  │ & SHOT DIRECTOR  │ & NLE (FFMPEG)   │ BATCH QUEUE     │ │
│ └──────────────┴──────────────────┴──────────────────┴─────────────────┘ │
└─────────────────────────────┬────────────────────────────────────────────┘
                              │ REST / WebSockets / SQLite
                              ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                   CID ENGINE BRIDGE (Local Node Server)                  │
│  - Storyboard -> Workflow Graph Compiler                                 │
│  - WebSocket Progress Streaming (Step N/4, nodes, ETA)                   │
│  - Native FFmpeg Video/Audio Assembler & Exporter                        │
│  - macOS Anti-Sleep (`caffeinate`) Watchdog                              │
└─────────────────────────────┬────────────────────────────────────────────┘
                              │ HTTP / WS (127.0.0.1:8188)
                              ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                     COMFYUI HEADLESS WORKER                              │
│  - MiniMax H3 Ref2VA (INT8) + 4-Step Turbo LoRA                          │
│  - Qwen3-VL 32B Text Encoder + Multi-View Cross Attention                │
│  - Video VAE + Synchronized 32kHz Stereo Audio VAE                       │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Phase Breakdown & Milestone Schedule

### Phase 1: Foundation, File Vault & ComfyUI Engine Bridge
- Task 1.1: Next.js project setup with Swiss Brutalist dark theme & Tailwind configuration.
- Task 1.2: SQLite schema for Projects, Scenes, Shots, Characters, Locations, Takes, and Timeline tracks.
- Task 1.3: ComfyUI API & WebSocket client module (connection health, prompt submission, live progress listener, queue cancellation).
- Task 1.4: Workflow Graph Compiler: Convert storyboard parameters & reference image paths into validated ComfyUI execution payloads.
- Task 1.5: macOS `caffeinate` lifecycle manager (spawn on queue start, kill on queue complete).

### Phase 2: Casting Forge & Location Locker (Pre-Production)
- Task 2.1: Character Roster UI: 4-angle reference loader (Sheet, Full Body, Action, Expressions) + voice profile notes.
- Task 2.2: Location Locker UI: Multi-reference environmental sets (Day/Night, Wide, Close-up angles).
- Task 2.3: Asset management API: Image uploads, thumbnail caching, and auto-sync to `/Users/mxc/ComfyUI-Shared/input/`.

### Phase 3: Storyboard & Multi-Shot Director Studio (Production)
- Task 3.1: Scene & Storyboard Builder: Multi-shot cards (Shot 1 Intro, Shot 2 Action, Shot 3 Reaction).
- Task 3.2: Shot Director Drawer: Aspect ratio selection (16:9, 9:16, 2.39:1 Cinematic), Duration (s), Steps (Turbo 4 vs High 8), Resolution, Frame count math.
- Task 3.3: Script & Prompt Doctor: Structured prompt builder formatting Shot cuts, Camera directions, and Audio/Foley descriptions into MiniMax/Qwen-compliant formatting.
- Task 3.4: Live Render HUD: Real-time step progress bar, latency stats, GPU status, and live output stream.

### Phase 4: Dailies, Take Manager & Batch Queue
- Task 4.1: Take Reviewer: Instant playback of generated `.mp4` takes with frame scrubbing, audio waveform, and consistency tagging.
- Task 4.2: Side-by-Side Take Comparator: Compare 2-4 takes simultaneously to pick the best character consistency.
- Task 4.3: Overnight Batch Manager: Queue multiple shots/scenes sequentially with auto-recovery and completion alerts.

### Phase 5: Built-in Timeline NLE & Audio Layering (Post-Production)
- Task 5.1: Multi-track Timeline UI: Video track, Dialogue track, SFX/Foley track, Music track.
- Task 5.2: Clip manipulation: Drag-and-drop takes onto timeline, trim in/out points, split clips, re-order.
- Task 5.3: FFmpeg Stitcher Service: Splicing video segments, crossfading audio tracks, volume normalization.
- Task 5.4: Master Export Studio: Export finished film to 1080p / 4K / WebM / Pro-Res MP4 with burned-in title cards or subtitles.

---

## Detailed Task Matrix (Bite-Sized Implementation Plan)

### Task 1: Scaffolding Project & Design System
- **Files:**
  - Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`
- **Output:** Clean Swiss Brutalist base layout (monochrome dark palette `#0d0d0d`, high-contrast borders `#262626`, monospace data badges, flat panels).

### Task 2: Database Schema & Local Engine Bridge
- **Files:**
  - Create: `lib/db/schema.ts`, `lib/db/index.ts`
  - Create: `lib/comfy/client.ts`, `lib/comfy/graphCompiler.ts`, `lib/comfy/types.ts`
- **Output:** Fully typed ComfyUI communication bridge with automated health checks at `http://127.0.0.1:8188/system_stats`.

### Task 3: Character & Location Forge Components
- **Files:**
  - Create: `components/casting/CharacterCard.tsx`, `components/casting/CharacterModal.tsx`
  - Create: `components/casting/LocationCard.tsx`, `components/casting/LocationModal.tsx`
  - Create: `app/casting/page.tsx`, `app/api/assets/route.ts`
- **Output:** Working casting studio allowing character sheet uploads and persistent roster storage.

### Task 4: Storyboard Director & Live Studio Console
- **Files:**
  - Create: `components/director/SceneStoryboard.tsx`, `components/director/ShotCard.tsx`
  - Create: `components/director/PromptEditor.tsx`, `components/director/RenderControls.tsx`
  - Create: `components/director/LiveMonitor.tsx`
  - Create: `app/director/page.tsx`, `app/api/render/route.ts`, `app/api/ws/route.ts`
- **Output:** Full directorial storyboard editor capable of launching 4-step renders with live progress streaming.

### Task 5: Dailies Take Reel & Asset Browser
- **Files:**
  - Create: `components/dailies/TakeGallery.tsx`, `components/dailies/VideoPlayer.tsx`
  - Create: `components/dailies/TakeCompare.tsx`
  - Create: `app/dailies/page.tsx`, `app/api/takes/route.ts`
- **Output:** Dailies review hub with instant scrubbing, rating, and file inspection.

### Task 6: FFmpeg NLE Timeline & Master Video Assembler
- **Files:**
  - Create: `components/timeline/TimelineTrack.tsx`, `components/timeline/TimelineClip.tsx`
  - Create: `components/timeline/AudioMixer.tsx`, `components/timeline/ExportModal.tsx`
  - Create: `lib/ffmpeg/stitcher.ts`, `app/timeline/page.tsx`, `app/api/export/route.ts`
- **Output:** Operational timeline editor assembling multi-take clips into a final master movie.
