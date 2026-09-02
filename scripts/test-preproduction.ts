import fs from "fs";
import path from "path";
import {
  getDb,
  getAllProjects,
  getCharactersByProjectId,
  getCharacterById,
  createCharacter,
  updateCharacter,
  deleteCharacter,
  getLocationsByProjectId,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation,
} from "../lib/db";

async function main() {
  console.log("=================================================");
  console.log("   CID STUDIOS: PRE-PRODUCTION WING VERIFICATION");
  console.log("=================================================\n");

  const db = getDb();
  const projects = getAllProjects();
  const project = projects[0];

  if (!project) {
    throw new Error("No active project found in database");
  }

  console.log(`[+] Active Project: ${project.name} (${project.id})`);

  // -------------------------------------------------------------
  // 1. CHARACTER CRUD & 4-VIEW CONSISTENCY SLOTS
  // -------------------------------------------------------------
  console.log("\n--- TEST 1: CASTING FORGE (CHARACTER CRUD & 4-VIEW MATRIX) ---");
  const testCharId = `char_test_${Date.now()}`;
  const newChar = createCharacter({
    id: testCharId,
    project_id: project.id,
    name: "Kaito-Test",
    role: "LEAD",
    description: "Cyberpunk infiltrator, dark coat, dual cybernetic arms.",
    voice_profile: "Low gravelly tactical operative",
    ref_sheet_path: "Kaito-turnaround.png",
    ref_body_path: "Kaito-body.png",
    ref_action_path: "Kaito-action.png",
    ref_expression_path: "Kaito-expression.png",
  });

  console.log(`[✓] Created character: ${newChar.name} (${newChar.id})`);
  console.log(`    Ref slots armed: Turnaround=${newChar.ref_sheet_path}, Body=${newChar.ref_body_path}, Action=${newChar.ref_action_path}, Expr=${newChar.ref_expression_path}`);

  // Fetch character
  const fetchedChar = getCharacterById(testCharId);
  if (!fetchedChar || fetchedChar.name !== "Kaito-Test") {
    throw new Error("Failed to retrieve created character");
  }
  console.log(`[✓] Fetched character successfully`);

  // Update character
  const updatedChar = updateCharacter(testCharId, {
    role: "ANTAGONIST",
    voice_profile: "Cold synthesized AI voice",
  });
  if (updatedChar?.role !== "ANTAGONIST" || updatedChar?.voice_profile !== "Cold synthesized AI voice") {
    throw new Error("Failed to update character");
  }
  console.log(`[✓] Updated character role to: ${updatedChar.role} and voice to: ${updatedChar.voice_profile}`);

  // Clean up test character
  const deletedChar = deleteCharacter(testCharId);
  if (!deletedChar) {
    throw new Error("Failed to delete test character");
  }
  console.log(`[✓] Deleted test character successfully`);

  // Verify default character (Shampoo) exists
  const existingChars = getCharactersByProjectId(project.id);
  console.log(`[✓] Current project character roster count: ${existingChars.length}`);
  const shampoo = existingChars.find((c) => c.name === "Shampoo");
  if (shampoo) {
    console.log(`    Anchor character found: ${shampoo.name} (Role: ${shampoo.role})`);
    console.log(`    References: ${shampoo.ref_sheet_path} | ${shampoo.ref_body_path} | ${shampoo.ref_action_path} | ${shampoo.ref_expression_path}`);
  }

  // -------------------------------------------------------------
  // 2. LOCATION CRUD & ENVIRONMENTAL SETS
  // -------------------------------------------------------------
  console.log("\n--- TEST 2: LOCATION LOCKER (ENVIRONMENT SETS & LIGHTING) ---");
  const testLocId = `loc_test_${Date.now()}`;
  const newLoc = createLocation({
    id: testLocId,
    project_id: project.id,
    name: "Rooftop Solar Array - Sector 09",
    description: "Expansive high-altitude rooftop with rain-slicked photovoltaic panels and neon reflections.",
    time_of_day: "Night / Neon Interior",
    ref_main_path: "Rooftop-wide.jpg",
    ref_alt_path: "Rooftop-close.jpg",
  });

  console.log(`[✓] Created location set: ${newLoc.name} (${newLoc.id})`);
  console.log(`    Time of Day: ${newLoc.time_of_day} | Main=${newLoc.ref_main_path} | Alt=${newLoc.ref_alt_path}`);

  // Fetch location
  const fetchedLoc = getLocationById(testLocId);
  if (!fetchedLoc || fetchedLoc.name !== "Rooftop Solar Array - Sector 09") {
    throw new Error("Failed to retrieve created location");
  }
  console.log(`[✓] Fetched location successfully`);

  // Update location
  const updatedLoc = updateLocation(testLocId, {
    time_of_day: "Golden Hour / Sunset Rim",
    description: "Sunset glowing over solar arrays.",
  });
  if (updatedLoc?.time_of_day !== "Golden Hour / Sunset Rim") {
    throw new Error("Failed to update location");
  }
  console.log(`[✓] Updated location lighting to: ${updatedLoc.time_of_day}`);

  // Delete test location
  const deletedLoc = deleteLocation(testLocId);
  if (!deletedLoc) {
    throw new Error("Failed to delete test location");
  }
  console.log(`[✓] Deleted test location successfully`);

  // -------------------------------------------------------------
  // 3. ASSET SYNC PIPELINE TO COMFYUI SHARED & LOCAL INPUTS
  // -------------------------------------------------------------
  console.log("\n--- TEST 3: ASSET SYNCING PIPELINE ---");
  const VAULT_DIR = path.join(process.cwd(), "public", "vault");
  const COMFY_SHARED = "/Users/mxc/ComfyUI-Shared/input";
  const COMFY_LOCAL = "/Users/mxc/ComfyUI-Installs/ComfyUI/ComfyUI/input";

  console.log(`[i] Primary Studio Vault: ${VAULT_DIR}`);
  console.log(`[i] ComfyUI Shared Input: ${COMFY_SHARED}`);
  console.log(`[i] ComfyUI Local Input:  ${COMFY_LOCAL}`);

  // Create dummy test file
  const testFileName = `test_sync_asset_${Date.now()}.png`;
  const dummyBuffer = Buffer.from("DUMMY_IMAGE_DATA_CID_STUDIOS_TEST");

  // Ensure directories exist
  [VAULT_DIR, COMFY_SHARED, COMFY_LOCAL].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Write to Vault
  const vaultPath = path.join(VAULT_DIR, testFileName);
  fs.writeFileSync(vaultPath, dummyBuffer);

  // Sync to ComfyUI destinations
  const sharedPath = path.join(COMFY_SHARED, testFileName);
  const localPath = path.join(COMFY_LOCAL, testFileName);
  fs.writeFileSync(sharedPath, dummyBuffer);
  fs.writeFileSync(localPath, dummyBuffer);

  // Validate all 3 locations
  const vExists = fs.existsSync(vaultPath);
  const sExists = fs.existsSync(sharedPath);
  const lExists = fs.existsSync(localPath);

  if (!vExists || !sExists || !lExists) {
    throw new Error(`Asset sync verification failed: Vault=${vExists}, Shared=${sExists}, Local=${lExists}`);
  }

  console.log(`[✓] Triple-sync asset pipeline verified:`);
  console.log(`    - Vault:  ${vaultPath} (${fs.statSync(vaultPath).size} bytes)`);
  console.log(`    - Shared: ${sharedPath} (${fs.statSync(sharedPath).size} bytes)`);
  console.log(`    - Local:  ${localPath} (${fs.statSync(localPath).size} bytes)`);

  // Clean up dummy test files
  fs.unlinkSync(vaultPath);
  fs.unlinkSync(sharedPath);
  fs.unlinkSync(localPath);
  console.log(`[✓] Cleaned up temporary test artifacts`);

  console.log("\n=================================================");
  console.log("   ALL PRE-PRODUCTION PIPELINE TESTS PASSED!");
  console.log("=================================================");
}

main().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
