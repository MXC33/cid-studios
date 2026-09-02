import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import {
  MediaMetadata,
  TimelineClipInput,
  AudioTrackInput,
  ExportSettings,
  ExportProgress,
  ExportResult,
} from "./types";

/**
 * Resolves a given media file path to an absolute path on the filesystem.
 */
export function resolveMediaFilePath(inputPath: string): string {
  if (!inputPath) {
    throw new Error("Empty media path provided");
  }

  // If already absolute and exists
  if (path.isAbsolute(inputPath) && fs.existsSync(inputPath)) {
    return inputPath;
  }

  // Handle URL query path e.g. /api/media?path=...
  if (inputPath.includes("path=")) {
    try {
      const parsedUrl = new URL(inputPath, "http://localhost:3000");
      const subPath = parsedUrl.searchParams.get("path") || parsedUrl.searchParams.get("file");
      if (subPath) {
        return resolveMediaFilePath(subPath);
      }
    } catch {
      // ignore
    }
  }

  // Strip leading slash if checking relative
  const cleanPath = inputPath.startsWith("/") ? inputPath.slice(1) : inputPath;

  const candidatePaths = [
    inputPath,
    path.join(process.cwd(), cleanPath),
    path.join(process.cwd(), "public", cleanPath),
    path.join(process.cwd(), "public", "vault", path.basename(inputPath)),
    path.join("/Users/mxc/ComfyUI-Shared/output", cleanPath),
    path.join("/Users/mxc/ComfyUI-Shared/output/video", path.basename(inputPath)),
    path.join("/Users/mxc/ComfyUI-Shared/input", cleanPath),
    path.join("/Users/mxc/ComfyUI-Installs/ComfyUI/ComfyUI/output", cleanPath),
  ];

  for (const cand of candidatePaths) {
    if (fs.existsSync(cand)) {
      return cand;
    }
  }

  // If file doesn't exist, return original if absolute or resolved under public
  return path.isAbsolute(inputPath)
    ? inputPath
    : path.join(process.cwd(), "public", cleanPath);
}

/**
 * Extracts comprehensive media metadata using ffprobe.
 */
export async function getMediaMetadata(filePath: string): Promise<MediaMetadata> {
  const resolvedPath = resolveMediaFilePath(filePath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`File not found for ffprobe: ${resolvedPath}`);
  }

  return new Promise((resolve, reject) => {
    const ffprobe = spawn("ffprobe", [
      "-v",
      "quiet",
      "-print_format",
      "json",
      "-show_format",
      "-show_streams",
      resolvedPath,
    ]);

    let stdoutData = "";
    let stderrData = "";

    ffprobe.stdout.on("data", (chunk) => {
      stdoutData += chunk.toString();
    });

    ffprobe.stderr.on("data", (chunk) => {
      stderrData += chunk.toString();
    });

    ffprobe.on("close", (code) => {
      if (code !== 0) {
        return reject(
          new Error(`ffprobe exited with code ${code}: ${stderrData}`)
        );
      }

      try {
        const data = JSON.parse(stdoutData);
        const format = data.format || {};
        const videoStream = (data.streams || []).find(
          (s: any) => s.codec_type === "video"
        );
        const audioStream = (data.streams || []).find(
          (s: any) => s.codec_type === "audio"
        );

        let fps = 24;
        if (videoStream?.r_frame_rate) {
          const parts = videoStream.r_frame_rate.split("/");
          if (parts.length === 2 && parseFloat(parts[1]) > 0) {
            fps = Math.round(parseFloat(parts[0]) / parseFloat(parts[1]));
          } else if (!isNaN(parseFloat(videoStream.r_frame_rate))) {
            fps = Math.round(parseFloat(videoStream.r_frame_rate));
          }
        }

        const duration = parseFloat(
          format.duration ||
            videoStream?.duration ||
            audioStream?.duration ||
            "0"
        );

        const metadata: MediaMetadata = {
          duration: isNaN(duration) ? 0 : duration,
          width: videoStream ? parseInt(videoStream.width, 10) : undefined,
          height: videoStream ? parseInt(videoStream.height, 10) : undefined,
          aspectRatio: videoStream?.display_aspect_ratio || (videoStream?.width && videoStream?.height ? `${videoStream.width}:${videoStream.height}` : undefined),
          fps,
          videoCodec: videoStream?.codec_name,
          audioCodec: audioStream?.codec_name,
          audioSampleRate: audioStream?.sample_rate ? parseInt(audioStream.sample_rate, 10) : undefined,
          audioChannels: audioStream?.channels,
          bitrate: format.bit_rate ? parseInt(format.bit_rate, 10) : undefined,
          size: format.size ? parseInt(format.size, 10) : undefined,
          format: format.format_name,
        };

        resolve(metadata);
      } catch (err: any) {
        reject(new Error(`Failed to parse ffprobe output: ${err.message}`));
      }
    });

    ffprobe.on("error", (err) => {
      reject(err);
    });
  });
}

/**
 * Frame-accurate slicing and trimming of an individual video/audio clip.
 */
export async function sliceAndTrimClip(
  inputPath: string,
  trimIn: number,
  trimOut: number,
  outputPath: string
): Promise<string> {
  const resolvedInput = resolveMediaFilePath(inputPath);
  if (!fs.existsSync(resolvedInput)) {
    throw new Error(`Input file not found: ${resolvedInput}`);
  }

  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const duration = Math.max(0.04, trimOut - trimIn);

  return new Promise((resolve, reject) => {
    const args = [
      "-y",
      "-ss",
      trimIn.toFixed(4),
      "-t",
      duration.toFixed(4),
      "-i",
      resolvedInput,
      "-c:v",
      "libx264",
      "-preset",
      "fast",
      "-crf",
      "18",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-avoid_negative_ts",
      "make_zero",
      outputPath,
    ];

    const ffmpeg = spawn("ffmpeg", args);
    let stderr = "";

    ffmpeg.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    ffmpeg.on("close", (code) => {
      if (code === 0 && fs.existsSync(outputPath)) {
        resolve(outputPath);
      } else {
        reject(new Error(`ffmpeg slice failed with code ${code}: ${stderr}`));
      }
    });

    ffmpeg.on("error", (err) => reject(err));
  });
}

/**
 * Calculates target dimensions according to export preset.
 */
function getPresetDimensions(preset: string, customResolution?: { width: number; height: number }): { width: number; height: number } {
  if (customResolution && customResolution.width > 0 && customResolution.height > 0) {
    return customResolution;
  }

  switch (preset) {
    case "4k":
      return { width: 3840, height: 2160 };
    case "scope":
      return { width: 1920, height: 804 }; // 2.39:1 CinemaScope
    case "social_9_16":
      return { width: 1080, height: 1920 }; // 9:16 Vertical
    case "1080p":
    default:
      return { width: 1920, height: 1080 };
  }
}

/**
 * Stitches multi-track video and audio timeline into a master render.
 */
export async function stitchTimeline(
  videoClips: TimelineClipInput[],
  audioTracks: (TimelineClipInput | AudioTrackInput)[] = [],
  exportSettings: ExportSettings,
  outputPath: string,
  onProgress?: (progress: ExportProgress) => void
): Promise<ExportResult> {
  if (!videoClips || videoClips.length === 0) {
    throw new Error("Cannot render timeline: No video clips provided");
  }

  onProgress?.({
    percentage: 5,
    stage: "preparing",
    details: "Resolving media paths and validating timeline sequence...",
  });

  const targetRes = getPresetDimensions(exportSettings.preset, exportSettings.resolution);
  const targetFps = exportSettings.fps || 24;
  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Normalize and resolve video clips
  const validVideoClips: Array<{
    clip: TimelineClipInput;
    resolvedPath: string;
    trimIn: number;
    duration: number;
  }> = [];

  for (const c of videoClips) {
    const resolved = resolveMediaFilePath(c.file_path);
    if (!fs.existsSync(resolved)) {
      throw new Error(`Video clip not found: ${c.file_path} (resolved: ${resolved})`);
    }
    const trimIn = Math.max(0, c.trim_in || 0);
    const trimOut = c.trim_out && c.trim_out > trimIn ? c.trim_out : trimIn + (c.duration || 3.0);
    const duration = Math.max(0.04, trimOut - trimIn);
    validVideoClips.push({
      clip: c,
      resolvedPath: resolved,
      trimIn,
      duration,
    });
  }

  // Calculate total timeline video duration
  const totalDuration = validVideoClips.reduce((sum, item) => sum + item.duration, 0);

  // Normalize audio tracks
  const flattenedAudioClips: Array<{
    resolvedPath: string;
    trimIn: number;
    duration: number;
    startTime: number;
    volume: number;
    muted: boolean;
  }> = [];

  for (const item of audioTracks) {
    if ("clips" in item && Array.isArray(item.clips)) {
      // It is an AudioTrackInput
      const trackVol = item.muted ? 0 : item.volume ?? 1.0;
      for (const ac of item.clips) {
        try {
          const resolved = resolveMediaFilePath(ac.file_path);
          if (fs.existsSync(resolved)) {
            const trimIn = Math.max(0, ac.trim_in || 0);
            const trimOut = ac.trim_out && ac.trim_out > trimIn ? ac.trim_out : trimIn + (ac.duration || 3.0);
            const dur = Math.max(0.04, trimOut - trimIn);
            const clipVol = ac.muted ? 0 : (ac.volume ?? 1.0) * trackVol;
            flattenedAudioClips.push({
              resolvedPath: resolved,
              trimIn,
              duration: dur,
              startTime: Math.max(0, ac.start_time || 0),
              volume: clipVol,
              muted: ac.muted || item.muted,
            });
          }
        } catch {
          // ignore missing audio clip
        }
      }
    } else {
      // It is a direct TimelineClipInput
      const ac = item as TimelineClipInput;
      try {
        const resolved = resolveMediaFilePath(ac.file_path);
        if (fs.existsSync(resolved)) {
          const trimIn = Math.max(0, ac.trim_in || 0);
          const trimOut = ac.trim_out && ac.trim_out > trimIn ? ac.trim_out : trimIn + (ac.duration || 3.0);
          const dur = Math.max(0.04, trimOut - trimIn);
          flattenedAudioClips.push({
            resolvedPath: resolved,
            trimIn,
            duration: dur,
            startTime: Math.max(0, ac.start_time || 0),
            volume: ac.muted ? 0 : (ac.volume ?? 1.0),
            muted: Boolean(ac.muted),
          });
        }
      } catch {
        // ignore missing audio clip
      }
    }
  }

  onProgress?.({
    percentage: 15,
    stage: "encoding",
    details: `Constructing FFmpeg filtergraph for ${validVideoClips.length} video cuts and ${flattenedAudioClips.length} audio cues...`,
  });

  // Construct FFmpeg command
  const inputArgs: string[] = [];
  const filterChains: string[] = [];

  // 1. Add video inputs
  validVideoClips.forEach((vc, index) => {
    inputArgs.push("-ss", vc.trimIn.toFixed(4), "-t", vc.duration.toFixed(4), "-i", vc.resolvedPath);
    // Scale and letterbox/pillarbox to exact target canvas dimensions, set framerate and SAR
    filterChains.push(
      `[${index}:v]scale=${targetRes.width}:${targetRes.height}:force_original_aspect_ratio=decrease,pad=${targetRes.width}:${targetRes.height}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=${targetFps}[v${index}]`
    );
  });

  // 2. Concat video filter
  const concatInputs = validVideoClips.map((_, i) => `[v${i}]`).join("");
  filterChains.push(`${concatInputs}concat=n=${validVideoClips.length}:v=1:a=0[vmaster]`);

  // 3. Audio inputs & mixing
  const audioInputOffset = validVideoClips.length;
  let finalAudioLabel = "[amaster]";

  if (flattenedAudioClips.length > 0) {
    const audioMixLabels: string[] = [];
    flattenedAudioClips.forEach((ac, idx) => {
      const inputIdx = audioInputOffset + idx;
      inputArgs.push("-ss", ac.trimIn.toFixed(4), "-t", ac.duration.toFixed(4), "-i", ac.resolvedPath);

      const delayMs = Math.round(ac.startTime * 1000);
      const vol = ac.muted ? 0 : Math.max(0, ac.volume);

      filterChains.push(
        `[${inputIdx}:a]adelay=${delayMs}|${delayMs},volume=${vol.toFixed(2)},aformat=sample_rates=48000:channel_layouts=stereo[a${idx}]`
      );
      audioMixLabels.push(`[a${idx}]`);
    });

    if (audioMixLabels.length === 1) {
      if (exportSettings.normalizeAudio) {
        filterChains.push(`${audioMixLabels[0]}loudnorm=I=-16:TP=-1.5:LRA=11[amaster]`);
      } else {
        filterChains.push(`${audioMixLabels[0]}aformat=sample_rates=48000:channel_layouts=stereo[amaster]`);
      }
    } else {
      const mixInputs = audioMixLabels.join("");
      const mixedLabel = exportSettings.normalizeAudio ? "[amixed]" : "[amaster]";
      filterChains.push(
        `${mixInputs}amix=inputs=${audioMixLabels.length}:duration=longest:dropout_transition=2${mixedLabel}`
      );
      if (exportSettings.normalizeAudio) {
        filterChains.push(`[amixed]loudnorm=I=-16:TP=-1.5:LRA=11[amaster]`);
      }
    }
  } else {
    // Generate silent stereo audio track matching video duration
    filterChains.push(
      `aevalsrc=0:d=${Math.max(1, totalDuration).toFixed(2)}:s=48000:c=stereo[amaster]`
    );
  }

  // Codec and container parameters
  const codecArgs: string[] = [];
  const format = exportSettings.format || "mp4";

  if (format === "prores") {
    // Apple ProRes 422 HQ
    codecArgs.push(
      "-c:v",
      "prores_ks",
      "-profile:v",
      "3",
      "-vendor",
      "apl0",
      "-pix_fmt",
      "yuv422p10le",
      "-c:a",
      "pcm_s16le",
      "-ar",
      "48000"
    );
  } else if (format === "webm") {
    // VP9 / Opus
    codecArgs.push(
      "-c:v",
      "libvpx-vp9",
      "-b:v",
      exportSettings.videoBitrate || "0",
      "-crf",
      "22",
      "-c:a",
      "libopus",
      "-b:a",
      exportSettings.audioBitrate || "192k",
      "-ar",
      "48000"
    );
  } else {
    // H.264 / AAC MP4 Master
    codecArgs.push(
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "18",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-b:a",
      exportSettings.audioBitrate || "320k",
      "-ar",
      "48000",
      "-movflags",
      "+faststart"
    );
  }

  const finalFilterGraph = filterChains.join(";");

  const fullArgs = [
    "-y",
    ...inputArgs,
    "-filter_complex",
    finalFilterGraph,
    "-map",
    "[vmaster]",
    "-map",
    finalAudioLabel,
    ...codecArgs,
    "-t",
    totalDuration.toFixed(4),
    outputPath,
  ];

  return new Promise((resolve, reject) => {
    onProgress?.({
      percentage: 30,
      stage: "encoding",
      details: "Spawning FFmpeg master render pipeline...",
    });

    const ffmpeg = spawn("ffmpeg", fullArgs);
    let stderr = "";

    ffmpeg.stderr.on("data", (chunk) => {
      const line = chunk.toString();
      stderr += line;

      // Extract time from ffmpeg output for live progress calculation
      const match = line.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
      if (match) {
        const hours = parseFloat(match[1]);
        const mins = parseFloat(match[2]);
        const secs = parseFloat(match[3]);
        const currentTime = hours * 3600 + mins * 60 + secs;
        const pct = Math.min(
          95,
          Math.max(30, Math.round(30 + (currentTime / (totalDuration || 1)) * 65))
        );
        onProgress?.({
          percentage: pct,
          stage: "encoding",
          details: `Rendering Master Cut (${currentTime.toFixed(1)}s / ${totalDuration.toFixed(1)}s)...`,
        });
      }
    });

    ffmpeg.on("close", async (code) => {
      if (code !== 0 || !fs.existsSync(outputPath)) {
        onProgress?.({
          percentage: 100,
          stage: "failed",
          error: `FFmpeg failed with exit code ${code}`,
        });
        return reject(new Error(`FFmpeg stitching failed (exit code ${code}): ${stderr.slice(-1000)}`));
      }

      try {
        onProgress?.({
          percentage: 96,
          stage: "finalizing",
          details: "Analyzing exported master metadata and finalizing paths...",
        });

        const stats = fs.statSync(outputPath);
        const metadata = await getMediaMetadata(outputPath);

        // Copy to Shared output directory if requested or available
        let sharedPath: string | null = null;
        const sharedDir = "/Users/mxc/ComfyUI-Shared/output";
        if (exportSettings.exportToShared !== false && fs.existsSync(sharedDir)) {
          const sharedTarget = path.join(sharedDir, path.basename(outputPath));
          try {
            fs.copyFileSync(outputPath, sharedTarget);
            sharedPath = sharedTarget;
          } catch (copyErr) {
            console.warn("Could not copy to ComfyUI-Shared output:", copyErr);
          }
        }

        // Relative public URL for frontend preview
        let publicUrl = `/api/media?path=${encodeURIComponent(outputPath)}`;
        if (outputPath.includes("/public/")) {
          const relPublic = outputPath.split("/public/")[1];
          publicUrl = `/${relPublic}`;
        }

        onProgress?.({
          percentage: 100,
          stage: "completed",
          details: "Master export completed successfully.",
          outputPath,
          fileSize: stats.size,
          duration: metadata.duration,
        });

        resolve({
          success: true,
          outputPath,
          publicUrl,
          sharedPath,
          duration: metadata.duration,
          fileSize: stats.size,
          metadata,
          settings: exportSettings,
        });
      } catch (err: any) {
        reject(err);
      }
    });

    ffmpeg.on("error", (err) => {
      onProgress?.({
        percentage: 100,
        stage: "failed",
        error: err.message,
      });
      reject(err);
    });
  });
}
