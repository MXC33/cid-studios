import {
  getAllProjects,
  getCharactersByProjectId,
  getLocationsByProjectId,
  getScenesByProjectId,
  getShotsBySceneId,
  createTake,
  getTakesByShotId,
} from "../lib/db";
import {
  compileMiniMaxH3Graph,
  calculateFrameLength,
} from "../lib/comfy/graphCompiler";
import { checkStatus } from "../lib/comfy/client";
import { getCaffeinateStatus } from "../lib/comfy/caffeinate";

async function runTests() {
  console.log("=================================================");
  console.log(" CID STUDIOS: ENGINE BRIDGE & DB VALIDATION SUITE");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      failed++;
    }
  }

  // TEST 1: Database Initialization & Seeding
  console.log("--- TEST 1: Database Initialization & Seeding ---");
  const projects = getAllProjects();
  assert(projects.length > 0, "Default projects seeded");
  const neoTokyo = projects.find((p) => p.slug === "neo-tokyo-2088");
  assert(!!neoTokyo, "Found 'neo-tokyo-2088' project");

  if (neoTokyo) {
    const chars = getCharactersByProjectId(neoTokyo.id);
    assert(chars.length >= 1, `Characters seeded (Found: ${chars.map((c) => c.name).join(", ")})`);

    const locs = getLocationsByProjectId(neoTokyo.id);
    assert(locs.length >= 1, `Locations seeded (Found: ${locs.map((l) => l.name).join(", ")})`);

    const scenes = getScenesByProjectId(neoTokyo.id);
    assert(scenes.length >= 1, `Scenes seeded (Found: ${scenes.map((s) => s.title).join(", ")})`);

    if (scenes.length > 0) {
      const shots = getShotsBySceneId(scenes[0].id);
      assert(shots.length === 3, `Scene 01 has 3 shots (Found: ${shots.length})`);

      // Test take creation
      const testTake = createTake({
        id: `test_take_${Date.now()}`,
        shot_id: shots[0].id,
        take_number: 1,
        prompt_id: "test-prompt-uuid",
        status: "queued",
        duration: 3.0,
        resolution: "1344x768",
        steps: 4,
        seed: 42,
      });
      assert(testTake.id.startsWith("test_take_"), "Take record created in DB");

      const takes = getTakesByShotId(shots[0].id);
      assert(takes.length >= 1, `Shot takes retrieved from DB (Count: ${takes.length})`);
    }
  }

  // TEST 2: Frame Length Calculation
  console.log("\n--- TEST 2: Math & Frame Calculation (17-frame alignment) ---");
  const len5s = calculateFrameLength(5.0, 24);
  assert(len5s === 124, `5.0s @ 24fps -> 124 frames (Actual: ${len5s})`);

  const len3s = calculateFrameLength(3.0, 24);
  assert(len3s === 73, `3.0s @ 24fps -> 73 frames (Actual: ${len3s})`);

  const len2_5s = calculateFrameLength(2.5, 24);
  assert(len2_5s === 73, `2.5s @ 24fps -> 73 frames (Actual: ${len2_5s})`);

  // TEST 3: Graph Compiler
  console.log("\n--- TEST 3: MiniMax H3 Graph Compiler ---");
  const compiled = compileMiniMaxH3Graph({
    prompt: "Static close-up of Shampoo smiling in the anime store.",
    duration: 5.0,
    width: 1344,
    height: 768,
    steps: 4,
    seed: 123456789,
    ref_images: [
      "Shampoo-different-angles.png",
      "Shampoo-fullbody.jpg",
      "Anime-store.jpg",
      "Anime-store-interaction.jpg",
    ],
  });

  assert(!!compiled["127"], "UNETLoader node present (Node 127)");
  assert(!!compiled["146"], "Turbo 4-Step LoRA node present (Node 146)");
  assert(!!compiled["128"], "CLIPLoader node present (Node 128)");
  assert(!!compiled["119"], "Video VAE node present (Node 119)");
  assert(!!compiled["120"], "Audio VAE node present (Node 120)");
  assert(!!compiled["136"], "MiniMaxH3ReferenceToVideo node present (Node 136)");
  assert(!!compiled["125"], "SamplerCustomAdvanced node present (Node 125)");
  assert(!!compiled["130"], "CreateVideo node present (Node 130)");
  assert(!!compiled["92"], "SaveVideo node present (Node 92)");

  // Check ref image nodes
  assert(compiled["137"]?.inputs.image === "Shampoo-different-angles.png", "Ref 0 LoadImage node 137 correctly mapped");
  assert(compiled["143"]?.inputs.image === "Shampoo-fullbody.jpg", "Ref 1 LoadImage node 143 correctly mapped");
  assert(compiled["139"]?.inputs.image === "Anime-store.jpg", "Ref 2 LoadImage node 139 correctly mapped");
  assert(compiled["147"]?.inputs.image === "Anime-store-interaction.jpg", "Ref 3 LoadImage node 147 correctly mapped");

  // Check wiring
  const miniMaxInputs = compiled["136"].inputs;
  assert(miniMaxInputs.length === 124, `MiniMax node duration length = 124 (Actual: ${miniMaxInputs.length})`);
  assert(miniMaxInputs.width === 1344, "MiniMax width = 1344");
  assert(miniMaxInputs.height === 768, "MiniMax height = 768");
  assert(Array.isArray(miniMaxInputs["ref_images.ref_image_0"]), "Ref 0 link wired to node 136");
  assert(Array.isArray(miniMaxInputs["ref_images.ref_image_3"]), "Ref 3 link wired to node 136");

  // TEST 4: Caffeinate System Status
  console.log("\n--- TEST 4: Caffeinate Telemetry ---");
  const caff = getCaffeinateStatus();
  console.log(`Caffeinate status: ${JSON.stringify(caff)}`);
  assert(typeof caff.supported === "boolean", "Caffeinate platform check passed");

  // TEST 5: ComfyUI Live Connection Probe
  console.log("\n--- TEST 5: Live ComfyUI Engine Probe ---");
  const status = await checkStatus();
  console.log(`ComfyUI instance status: Online = ${status.online}`);
  if (status.online) {
    console.log(`ComfyUI VRAM: ${JSON.stringify(status.stats?.devices)}`);
    console.log(`ComfyUI RAM: ${JSON.stringify(status.stats?.system)}`);
  } else {
    console.log(`ComfyUI offline / not reached: ${status.error}`);
  }
  assert(typeof status.online === "boolean", "Live ComfyUI check executed");

  console.log("\n=================================================");
  console.log(` TOTAL RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
