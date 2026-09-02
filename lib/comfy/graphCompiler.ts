import { ComfyApiPrompt, StoryboardShotInput } from "./types";

/**
 * Calculates MiniMax H3 frame count with 17-frame alignment constraint.
 * Formula: max(5, round(duration * fps)) + (5 - (max(5, round(duration * fps)) % 17)) % 17
 */
export function calculateFrameLength(duration: number = 5.0, fps: number = 24): number {
  const baseFrames = Math.max(5, Math.round(duration * fps));
  const mod = baseFrames % 17;
  const padding = (5 - mod + 17) % 17;
  return baseFrames + padding;
}

/**
 * Compiles high-level storyboard shot parameters into a runnable ComfyUI API Prompt graph
 * targeting the MiniMax H3 Turbo 4-step reference-to-video workflow.
 */
export function compileMiniMaxH3Graph(input: StoryboardShotInput): ComfyApiPrompt {
  const duration = input.duration ?? 5.0;
  const fps = input.fps ?? 24;
  const length = calculateFrameLength(duration, fps);
  const width = input.width ?? 1344;
  const height = input.height ?? 768;
  const steps = input.steps ?? 4;
  const seed =
    input.seed !== undefined
      ? input.seed
      : Math.floor(Math.random() * 1_000_000_000_000_000);
  const loraStrength = input.lora_strength ?? 1.0;
  const scheduler = input.scheduler ?? "simple";
  const samplerName = input.sampler_name ?? "res_multistep";
  const filenamePrefix = input.filename_prefix ?? "video/MiniMax_H3";

  const refImages = input.ref_images || [];
  const ref0 = refImages[0];
  const ref1 = refImages[1];
  const ref2 = refImages[2];
  const ref3 = refImages[3];

  const graph: ComfyApiPrompt = {
    // 1. Diffusion Model
    "127": {
      class_type: "UNETLoader",
      inputs: {
        unet_name: "minimax_h3_ref2va_pruned_int8_convrot.safetensors",
        weight_dtype: "default",
      },
      _meta: { title: "Diffusion Model (INT8)" },
    },

    // 2. Turbo 4-Step LoRA
    "146": {
      class_type: "LoraLoaderModelOnly",
      inputs: {
        model: ["127", 0],
        lora_name: "minimax_h3_ref2v_turbo_4step_v0.1_comfyui_bf16.safetensors",
        strength_model: loraStrength,
      },
      _meta: { title: "Turbo 4-Step LoRA" },
    },

    // 3. Text & Vision Encoder (Qwen3-VL)
    "128": {
      class_type: "CLIPLoader",
      inputs: {
        clip_name: "qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors",
        type: "minimax",
        device: "default",
      },
      _meta: { title: "Text Encoder (Qwen3-VL)" },
    },

    // 4. Video VAE
    "119": {
      class_type: "VAELoader",
      inputs: {
        vae_name: "minimax_h3_video_vae_fp16.safetensors",
      },
      _meta: { title: "Video VAE" },
    },

    // 5. Audio VAE
    "120": {
      class_type: "VAELoader",
      inputs: {
        vae_name: "minimax_h3_audio_vae_fp32.safetensors",
      },
      _meta: { title: "Audio VAE" },
    },

    // 6. MiniMax H3 Reference-to-Video Conditioning Node
    "136": {
      class_type: "MiniMaxH3ReferenceToVideo",
      inputs: {
        clip: ["128", 0],
        vae: ["119", 0],
        audio_vae: ["120", 0],
        prompt: input.prompt,
        width: width,
        height: height,
        length: length,
        ref_image_size: "match",
        ...(ref0 ? { "ref_images.ref_image_0": ["137", 0] } : {}),
        ...(ref1 ? { "ref_images.ref_image_1": ["143", 0] } : {}),
        ...(ref2 ? { "ref_images.ref_image_2": ["139", 0] } : {}),
        ...(ref3 ? { "ref_images.ref_image_3": ["147", 0] } : {}),
      },
      _meta: { title: "MiniMax H3 Reference-to-Video" },
    },

    // 7. Random Noise Generator
    "129": {
      class_type: "RandomNoise",
      inputs: {
        noise_seed: seed,
        control_after_generate: "randomize",
      },
      _meta: { title: "Random Noise" },
    },

    // 8. Sampler Selector
    "123": {
      class_type: "KSamplerSelect",
      inputs: {
        sampler_name: samplerName,
      },
      _meta: { title: "Sampler Select" },
    },

    // 9. Scheduler (4-Step Turbo)
    "124": {
      class_type: "BasicScheduler",
      inputs: {
        model: ["146", 0],
        scheduler: scheduler,
        steps: steps,
        denoise: 1.0,
      },
      _meta: { title: "Scheduler (4 Steps Turbo)" },
    },

    // 10. Basic Guider
    "126": {
      class_type: "BasicGuider",
      inputs: {
        model: ["146", 0],
        conditioning: ["136", 0],
      },
      _meta: { title: "Basic Guider" },
    },

    // 11. Custom Advanced Sampler
    "125": {
      class_type: "SamplerCustomAdvanced",
      inputs: {
        noise: ["129", 0],
        guider: ["126", 0],
        sampler: ["123", 0],
        sigmas: ["124", 0],
        latent_image: ["136", 1],
      },
      _meta: { title: "Sampler Custom Advanced" },
    },

    // 12. Video Decode
    "122": {
      class_type: "VAEDecode",
      inputs: {
        samples: ["125", 0],
        vae: ["119", 0],
      },
      _meta: { title: "Decode Video" },
    },

    // 13. Audio Decode
    "121": {
      class_type: "VAEDecodeAudio",
      inputs: {
        samples: ["125", 0],
        vae: ["120", 0],
      },
      _meta: { title: "Decode Audio" },
    },

    // 14. Create Combined Video + Audio
    "130": {
      class_type: "CreateVideo",
      inputs: {
        images: ["122", 0],
        audio: ["121", 0],
        fps: fps,
        bit_depth: 8,
      },
      _meta: { title: "Assemble Video + Audio" },
    },

    // 15. Save & Preview Output Video
    "92": {
      class_type: "SaveVideo",
      inputs: {
        video: ["130", 0],
        filename_prefix: filenamePrefix,
        format: "auto",
        codec: "auto",
      },
      _meta: { title: "Save & Preview Video" },
    },
  };

  // Conditionally attach reference image nodes
  if (ref0) {
    graph["137"] = {
      class_type: "LoadImage",
      inputs: {
        image: ref0,
        upload: "image",
      },
      _meta: { title: "Ref 1 (Angles / Sheet)" },
    };
  }

  if (ref1) {
    graph["143"] = {
      class_type: "LoadImage",
      inputs: {
        image: ref1,
        upload: "image",
      },
      _meta: { title: "Ref 2 (Full Body Pose)" },
    };
  }

  if (ref2) {
    graph["139"] = {
      class_type: "LoadImage",
      inputs: {
        image: ref2,
        upload: "image",
      },
      _meta: { title: "Ref 3 (Environment)" },
    };
  }

  if (ref3) {
    graph["147"] = {
      class_type: "LoadImage",
      inputs: {
        image: ref3,
        upload: "image",
      },
      _meta: { title: "Ref 4 (Interaction)" },
    };
  }

  return graph;
}
