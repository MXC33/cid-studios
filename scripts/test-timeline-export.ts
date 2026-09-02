import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import {
  getMediaMetadata,
  sliceAndTrimClip,
  stitchTimeline,
  resolveMediaFilePath,
} from "../lib/ffmpeg/stitcher";
import {
  TimelineClipInput,
  AudioTrackInput,
  ExportSettings,
} from "../lib/ffmpeg/types";
import {
  getDb,
  getAllProjects,
  getTimelineClips,
  saveTimelineClips,
  addTimelineClip,
  updateTimelineClip,
  deleteTimelineClip,
  clearTimelineClips,
} from "../lib/db";

async function runTimelineAndExportTests() {
  console.log("==========================================================");
  console.log("   CID STUDIOS: NLE TIMELINE & FFMPEG MASTER EXPORT TESTS ");
  console.log("==========================================================\n");

  const testDir = path.join(process.cwd(), "public", "test_assets");
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  const exportDir = path.join(process.cwd(), "public", "exports");
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  // -------------------------------------------------------------
  // STEP 1: GENERATE SYNTHETIC TEST VIDEO & AUDIO CLIPS
  // -------------------------------------------------------------
  console.log("--- STEP 1: GENERATING SYNTHETIC TEST ASSETS ---");
  const clip1Path = path.join(testDir, "test_clip_cyan.mp4");
  const clip2Path = path.join(testDir, "test_clip_magenta.mp4");
  const sfxPath = path.join(testDir, "test_sfx_chime.wav");
  const musicPath = path.join(testDir, "test_music_drone.wav");

  // Clip 1: 3 seconds of cyan color bar video @ 24fps with tone
  console.log("[+] Generating Clip 1 (Cyan test video 3.0s)...");
  spawnSync(
    "ffmpeg",
    [
      "-y",
      "-f",
      "lavfi",
      "-i",
      "testsrc=duration=3:size=1280x720:rate=24",
      "-f",
      "lavfi",
      "-i",
      "sine=frequency=440:duration=3",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      clip1Path,
    ],
    { stdio: "pipe" }
  );

  // Clip 2: 3 seconds of magenta color bar video @ 24fps
  console.log("[+] Generating Clip 2 (Magenta test video 3.0s)...");
  spawnSync(
    "ffmpeg",
    [
      "-y",
      "-f",
      "lavfi",
      "-i",
      "testsrc2=duration=3:size=1280x720:rate=24",
      "-f",
      "lavfi",
      "-i",
      "sine=frequency=880:duration=3",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      clip2Path,
    ],
    { stdio: "pipe" }
  );

  // SFX: 1.5 second high beep
  console.log("[+] Generating Foley SFX (1.5s WAV)...");
  spawnSync(
    "ffmpeg",
    [
      "-y",
      "-f",
      "lavfi",
      "-i",
      "sine=frequency=1200:duration=1.5",
      "-c:a",
      "pcm_s16le",
      sfxPath,
    ],
    { stdio: "pipe" }
  );

  // Music: 5 second ambient synth drone
  console.log("[+] Generating Background Score (5.0s WAV)...");
  spawnSync(
    "ffmpeg",
    [
      "-y",
      "-f",
      "lavfi",
      "-i",
      "anoisesrc=d=5:c=pink:r=48000:a=0.08,lowpass=f=800",
      "-c:a",
      "pcm_s16le",
      musicPath,
    ],
    { stdio: "pipe" }
  );

  console.log("[✓] Synthetic test media generation complete.\n");

  // -------------------------------------------------------------
  // STEP 2: METADATA EXTRACTION (FFPROBE)
  // -------------------------------------------------------------
  console.log("--- STEP 2: FFPROBE METADATA EXTRACTION ---");
  const meta1 = await getMediaMetadata(clip1Path);
  console.log(`[✓] Clip 1 Metadata:`, {
    dimensions: `${meta1.width}x${meta1.height}`,
    fps: meta1.fps,
    duration: `${meta1.duration.toFixed(2)}s`,
    videoCodec: meta1.videoCodec,
    audioCodec: meta1.audioCodec,
  });

  if (!meta1.width || !meta1.height || meta1.fps !== 24) {
    throw new Error("Metadata extraction failed validation for Clip 1");
  }

  // -------------------------------------------------------------
  // STEP 3: FRAME-ACCURATE SLICING & TRIMMING
  // -------------------------------------------------------------
  console.log("\n--- STEP 3: FRAME-ACCURATE CLIP SLICING ---");
  const slicedOut = path.join(testDir, "test_slice_1_to_2.mp4");
  console.log(`[+] Trimming Clip 1 from 0.5s to 2.0s (1.5s duration)...`);
  await sliceAndTrimClip(clip1Path, 0.5, 2.0, slicedOut);

  if (!fs.existsSync(slicedOut)) {
    throw new Error("Slice output file was not created");
  }

  const sliceMeta = await getMediaMetadata(slicedOut);
  console.log(`[✓] Sliced Clip Verified: Duration = ${sliceMeta.duration.toFixed(2)}s`);
  if (Math.abs(sliceMeta.duration - 1.5) > 0.3) {
    throw new Error(`Slice duration expected ~1.5s, got ${sliceMeta.duration}s`);
  }

  // -------------------------------------------------------------
  // STEP 4: MULTI-TRACK NLE TIMELINE STITCHING (H.264 MP4 MASTER)
  // -------------------------------------------------------------
  console.log("\n--- STEP 4: MULTI-TRACK TIMELINE STITCHING (1080P MASTER MP4) ---");
  const masterMp4Out = path.join(exportDir, "test_master_1080p.mp4");

  const videoClips: TimelineClipInput[] = [
    {
      id: "clip_v1_01",
      track_type: "video",
      name: "SHOT_01_CYAN",
      file_path: clip1Path,
      trim_in: 0.0,
      trim_out: 2.0,
      start_time: 0.0,
      duration: 2.0,
      volume: 1.0,
    },
    {
      id: "clip_v1_02",
      track_type: "video",
      name: "SHOT_02_MAGENTA",
      file_path: clip2Path,
      trim_in: 0.5,
      trim_out: 2.5,
      start_time: 2.0,
      duration: 2.0,
      volume: 1.0,
    },
  ];

  const audioTracks: AudioTrackInput[] = [
    {
      id: "track_a2_foley",
      type: "foley",
      volume: 1.0,
      muted: false,
      solo: false,
      clips: [
        {
          id: "sfx_chime_01",
          track_type: "audio_foley",
          name: "Chime SFX",
          file_path: sfxPath,
          trim_in: 0.0,
          trim_out: 1.5,
          start_time: 0.5,
          duration: 1.5,
          volume: 1.2,
        },
      ],
    },
    {
      id: "track_a3_music",
      type: "music",
      volume: 0.8,
      muted: false,
      solo: false,
      clips: [
        {
          id: "score_drone_01",
          track_type: "audio_music",
          name: "OST Drone",
          file_path: musicPath,
          trim_in: 0.0,
          trim_out: 4.0,
          start_time: 0.0,
          duration: 4.0,
          volume: 0.7,
        },
      ],
    },
  ];

  const exportSettings1080p: ExportSettings = {
    preset: "1080p",
    format: "mp4",
    fps: 24,
    normalizeAudio: true,
    exportToShared: true,
    customTitle: "test_director_master",
  };

  console.log(`[+] Executing stitchTimeline with 2 video cuts + 2 audio tracks...`);
  const result1080p = await stitchTimeline(
    videoClips,
    audioTracks,
    exportSettings1080p,
    masterMp4Out,
    (p) => console.log(`    [Progress] ${p.percentage}% - ${p.details || p.stage}`)
  );

  console.log(`[✓] Master 1080p MP4 Export Succeeded!`);
  console.log(`    - Output Path: ${result1080p.outputPath}`);
  console.log(`    - Duration: ${result1080p.duration.toFixed(2)}s`);
  console.log(`    - File Size: ${(result1080p.fileSize / 1024).toFixed(1)} KB`);
  console.log(`    - Shared Copy: ${result1080p.sharedPath || "N/A"}`);
  console.log(`    - Dimensions: ${result1080p.metadata.width}x${result1080p.metadata.height} @ ${result1080p.metadata.fps}fps`);

  if (!fs.existsSync(result1080p.outputPath)) {
    throw new Error("Master MP4 output file does not exist on disk");
  }

  // -------------------------------------------------------------
  // STEP 5: PRORES 422 MASTER RENDER TEST
  // -------------------------------------------------------------
  console.log("\n--- STEP 5: PRORES 422 HQ MASTER RENDER ---");
  const masterProResOut = path.join(exportDir, "test_master_prores.mov");
  const exportSettingsProRes: ExportSettings = {
    preset: "1080p",
    format: "prores",
    fps: 24,
    normalizeAudio: false,
    exportToShared: false,
    customTitle: "test_prores_master",
  };

  const resultProRes = await stitchTimeline(
    videoClips,
    audioTracks,
    exportSettingsProRes,
    masterProResOut
  );

  console.log(`[✓] Master ProRes 422 HQ Export Succeeded!`);
  console.log(`    - Output Path: ${resultProRes.outputPath}`);
  console.log(`    - Video Codec: ${resultProRes.metadata.videoCodec}`);
  console.log(`    - File Size: ${(resultProRes.fileSize / (1024 * 1024)).toFixed(2)} MB`);

  // -------------------------------------------------------------
  // STEP 6: TIMELINE SQLITE DATABASE CRUD VERIFICATION
  // -------------------------------------------------------------
  console.log("\n--- STEP 6: TIMELINE SQLITE DB PERSISTENCE TESTS ---");
  const projects = getAllProjects();
  const project = projects[0];
  const projectId = project ? project.id : "proj_neo_tokyo_2088";

  console.log(`[+] Testing database CRUD for project: ${projectId}`);

  // 1. Clear existing
  clearTimelineClips(projectId);
  const initialClips = getTimelineClips(projectId);
  console.log(`[✓] Clear Timeline: Count = ${initialClips.length}`);

  // 2. Add single clip
  const clipA = addTimelineClip({
    id: `clip_db_test_1`,
    project_id: projectId,
    take_id: null,
    track_type: "video",
    track_index: 0,
    name: "Scene 01 Cut 01",
    file_path: clip1Path,
    trim_in: 0.0,
    trim_out: 2.5,
    start_time: 0.0,
    duration: 2.5,
    volume: 1.0,
    muted: 0,
    speed: 1.0,
    order_index: 0,
    metadata: JSON.stringify({ tag: "hero_entrance" }),
  });
  console.log(`[✓] Added Timeline Clip: ${clipA.name} (${clipA.id})`);

  // 3. Update clip
  const updatedClip = updateTimelineClip(clipA.id, {
    duration: 3.5,
    name: "Scene 01 Cut 01 (Director Cut)",
  });
  console.log(`[✓] Updated Clip Duration to: ${updatedClip?.duration}s, Name: ${updatedClip?.name}`);

  // 4. Batch save full sequence
  const batchClips = [
    {
      id: `clip_batch_1`,
      project_id: projectId,
      take_id: null,
      track_type: "video" as const,
      track_index: 0,
      name: "Cut A",
      file_path: clip1Path,
      trim_in: 0.0,
      trim_out: 3.0,
      start_time: 0.0,
      duration: 3.0,
      volume: 1.0,
      muted: 0,
      speed: 1.0,
      order_index: 0,
      metadata: null,
    },
    {
      id: `clip_batch_2`,
      project_id: projectId,
      take_id: null,
      track_type: "audio_foley" as const,
      track_index: 2,
      name: "Rain Foley",
      file_path: sfxPath,
      trim_in: 0.0,
      trim_out: 3.0,
      start_time: 0.0,
      duration: 3.0,
      volume: 0.9,
      muted: 0,
      speed: 1.0,
      order_index: 0,
      metadata: null,
    },
  ];

  const savedSequence = saveTimelineClips(projectId, batchClips);
  console.log(`[✓] Batch Saved Timeline Sequence: Count = ${savedSequence.length}`);

  const fetchedSequence = getTimelineClips(projectId);
  if (fetchedSequence.length !== 2) {
    throw new Error(`Expected 2 saved clips, found ${fetchedSequence.length}`);
  }
  console.log(`[✓] Fetched Persisted Sequence: V1 = ${fetchedSequence[0].name}, A2 = ${fetchedSequence[1].name}`);

  // 5. Delete clip
  const deleteResult = deleteTimelineClip("clip_batch_1");
  console.log(`[✓] Deleted single clip (clip_batch_1): Success = ${deleteResult}`);
  const afterDelete = getTimelineClips(projectId);
  console.log(`[✓] Clips remaining after delete: ${afterDelete.length}`);

  console.log("\n==========================================================");
  console.log("   ALL TIMELINE & FFMPEG EXPORT TESTS PASSED SUCCESSFULLY!  ");
  console.log("==========================================================");
}

runTimelineAndExportTests().catch((err) => {
  console.error("\n[!] TEST SUITE FAILED:", err);
  process.exit(1);
});
