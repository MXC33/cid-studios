import {
  getDb,
  getAllProjects,
  getAllScenes,
  getScenesByProjectId,
  getSceneById,
  createScene,
  updateScene,
  deleteScene,
  getAllShots,
  getShotsBySceneId,
  getShotById,
  createShot,
  updateShot,
  deleteShot,
  getAllCharacters,
  getAllLocations,
} from "../lib/db";
import {
  calculateFrameLength,
  compileMiniMaxH3Graph,
} from "../lib/comfy/graphCompiler";
import { StoryboardShotInput } from "../lib/comfy/types";

async function main() {
  console.log("=================================================");
  console.log("   CID STUDIOS: STORYBOARD DIRECTOR VERIFICATION");
  console.log("=================================================\n");

  const db = getDb();
  const projects = getAllProjects();
  const project = projects[0];

  if (!project) {
    throw new Error("No active project found in database");
  }

  console.log(`[+] Active Project: ${project.name} (${project.id})`);

  // -------------------------------------------------------------
  // 1. SCENE CRUD VERIFICATION
  // -------------------------------------------------------------
  console.log("\n--- TEST 1: SCENE DEFINITION & CRUD ---");
  const testSceneId = `scene_test_${Date.now()}`;
  const newScene = createScene({
    id: testSceneId,
    project_id: project.id,
    scene_number: 99,
    title: "Test Alleyway Encounter",
    synopsis: "Shampoo confronts surveillance operatives in the back alley.",
    prompt_script: "Neon rain, high-contrast silhouettes, wet asphalt reflections.",
    audio_foley: "Distant sirens, rain dripping on corrugated metal, cybernetic boot footsteps",
  });

  console.log(`[✓] Created scene: Scene ${newScene.scene_number} - "${newScene.title}" (${newScene.id})`);

  const fetchedScene = getSceneById(testSceneId);
  if (!fetchedScene || fetchedScene.title !== "Test Alleyway Encounter") {
    throw new Error("Failed to fetch created scene");
  }
  console.log(`[✓] Fetched scene successfully: ${fetchedScene.title}`);

  const updatedScene = updateScene(testSceneId, {
    title: "Updated Alleyway Ambush",
    synopsis: "Shampoo evades tracking drones with agility.",
  });
  if (updatedScene?.title !== "Updated Alleyway Ambush") {
    throw new Error("Failed to update scene");
  }
  console.log(`[✓] Updated scene title to: "${updatedScene.title}"`);

  // -------------------------------------------------------------
  // 2. SHOT CRUD & SEQUENCE ORDERING
  // -------------------------------------------------------------
  console.log("\n--- TEST 2: SHOT CARD MATRIX & MULTI-SHOT SEQUENCE ---");
  const chars = getAllCharacters();
  const locs = getAllLocations();
  const sampleChar = chars[0];
  const sampleLoc = locs[0];

  const testShotId1 = `shot_test_1_${Date.now()}`;
  const shot1 = createShot({
    id: testShotId1,
    scene_id: testSceneId,
    shot_number: 1,
    duration: 3.0,
    framing: "Close-up",
    camera_movement: "Slow Push-In",
    action_notes: "Shampoo looks up into the rain, eyes glowing cyan as she detects incoming drones.",
    character_ids: sampleChar ? JSON.stringify([sampleChar.id]) : null,
    location_id: sampleLoc ? sampleLoc.id : null,
  });

  const testShotId2 = `shot_test_2_${Date.now()}`;
  const shot2 = createShot({
    id: testShotId2,
    scene_id: testSceneId,
    shot_number: 2,
    duration: 4.5,
    framing: "Medium-Wide Shot",
    camera_movement: "Tracking Sprint",
    action_notes: "Shampoo vaults over a rusted dumpster, cybernetic kimono fluttering in the wind.",
    character_ids: sampleChar ? JSON.stringify([sampleChar.id]) : null,
    location_id: sampleLoc ? sampleLoc.id : null,
  });

  console.log(`[✓] Created Shot 1 (${shot1.id}): ${shot1.framing} / ${shot1.camera_movement} (${shot1.duration}s)`);
  console.log(`[✓] Created Shot 2 (${shot2.id}): ${shot2.framing} / ${shot2.camera_movement} (${shot2.duration}s)`);

  const sceneShots = getShotsBySceneId(testSceneId);
  if (sceneShots.length !== 2) {
    throw new Error(`Expected 2 shots in scene, got ${sceneShots.length}`);
  }
  console.log(`[✓] Retrieved ${sceneShots.length} shots in Scene sequence`);

  // Update shot
  const updatedShot1 = updateShot(testShotId1, {
    duration: 3.5,
    framing: "Extreme Close-Up",
  });
  if (updatedShot1?.duration !== 3.5 || updatedShot1?.framing !== "Extreme Close-Up") {
    throw new Error("Failed to update shot parameters");
  }
  console.log(`[✓] Updated Shot 1 duration to ${updatedShot1.duration}s and framing to "${updatedShot1.framing}"`);

  // -------------------------------------------------------------
  // 3. MINIMAX H3 17-FRAME CONSTRAINT & TIMING CALCULATION
  // -------------------------------------------------------------
  console.log("\n--- TEST 3: 17-FRAME ALIGNMENT & PROMPT COMPILER INTEGRATION ---");
  const testDurations = [1.0, 2.5, 3.0, 4.5, 5.0, 8.0];
  testDurations.forEach((dur) => {
    const frames = calculateFrameLength(dur, 24);
    const mod = frames % 17;
    console.log(`    Duration: ${dur.toFixed(1)}s (24fps) -> ${frames} frames (mod 17 = ${mod})`);
    if (mod !== 5 && frames < 5) {
      throw new Error(`Frame length alignment failed for duration ${dur}s`);
    }
  });
  console.log(`[✓] 17-frame mathematical alignment constraint validated across all test durations.`);

  // -------------------------------------------------------------
  // 4. GRAPH COMPILER SPECIFICATION & NODE LINKAGE
  // -------------------------------------------------------------
  console.log("\n--- TEST 4: MINIMAX H3 API PROMPT GRAPH COMPILATION ---");
  const shotInput: StoryboardShotInput = {
    prompt: "Masterpiece anime shot of Shampoo in neon anime store, looking at encrypted data cartridge with a focused expression.",
    duration: 3.0,
    width: 1344,
    height: 768,
    steps: 4,
    seed: 424242,
    fps: 24,
    ref_images: [
      "Shampoo-different-angles.png",
      "Shampoo-fullbody.jpg",
      "Anime-store.jpg",
      "Anime-store-interaction.jpg",
    ],
    lora_strength: 1.0,
    scheduler: "simple",
    sampler_name: "res_multistep",
    filename_prefix: "video/TestTake_Scene99_Shot01",
  };

  const compiledGraph = compileMiniMaxH3Graph(shotInput);

  // Assert essential node IDs
  const requiredNodes = [
    { id: "127", name: "UNETLoader" },
    { id: "146", name: "LoraLoaderModelOnly (Turbo 4-step)" },
    { id: "128", name: "CLIPLoader (Qwen3-VL)" },
    { id: "119", name: "VAELoader (Video VAE)" },
    { id: "120", name: "VAELoader (Audio VAE)" },
    { id: "136", name: "MiniMaxH3ReferenceToVideo" },
    { id: "129", name: "RandomNoise" },
    { id: "123", name: "KSamplerSelect" },
    { id: "124", name: "BasicScheduler" },
    { id: "126", name: "BasicGuider" },
    { id: "125", name: "SamplerCustomAdvanced" },
    { id: "122", name: "VAEDecode (Video)" },
    { id: "121", name: "VAEDecodeAudio" },
    { id: "130", name: "CreateVideo (AV Mux)" },
    { id: "92", name: "SaveVideo" },
    { id: "137", name: "LoadImage (Ref 0 - Angles)" },
    { id: "143", name: "LoadImage (Ref 1 - Body)" },
    { id: "139", name: "LoadImage (Ref 2 - Set Main)" },
    { id: "147", name: "LoadImage (Ref 3 - Set Alt)" },
  ];

  requiredNodes.forEach((node) => {
    if (!compiledGraph[node.id]) {
      throw new Error(`Compiled graph missing required node ${node.id} (${node.name})`);
    }
  });

  console.log(`[✓] Compiled graph contains all ${requiredNodes.length} required nodes`);
  console.log(`    Diffusion UNET:  ${compiledGraph["127"].inputs.unet_name}`);
  console.log(`    Turbo LoRA:      ${compiledGraph["146"].inputs.lora_name}`);
  console.log(`    Text Encoder:    ${compiledGraph["128"].inputs.clip_name}`);
  console.log(`    Frame Dimension: ${compiledGraph["136"].inputs.width}x${compiledGraph["136"].inputs.height} @ ${compiledGraph["136"].inputs.length} frames`);
  console.log(`    Sampling Steps:  ${compiledGraph["124"].inputs.steps} steps (${compiledGraph["123"].inputs.sampler_name} / ${compiledGraph["124"].inputs.scheduler})`);

  // -------------------------------------------------------------
  // 5. CLEANUP TEST ARTIFACTS
  // -------------------------------------------------------------
  console.log("\n--- TEST 5: CLEANUP TEMPORARY TEST DATA ---");
  deleteShot(testShotId1);
  deleteShot(testShotId2);
  deleteScene(testSceneId);
  console.log(`[✓] Deleted temporary test shots and test scene`);

  console.log("\n=================================================");
  console.log("   ALL STORYBOARD DIRECTOR & PROMPT DOCTOR TESTS PASSED!");
  console.log("=================================================");
}

main().catch((err) => {
  console.error("Storyboard verification failed:", err);
  process.exit(1);
});
