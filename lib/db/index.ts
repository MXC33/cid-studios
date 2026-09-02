import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import {
  CREATE_TABLES_SQL,
  Project,
  Character,
  Location,
  Scene,
  Shot,
  Take,
  QueueJob,
} from "./schema";

let dbInstance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (dbInstance) {
    return dbInstance;
  }

  const dbDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = process.env.DATABASE_PATH || path.join(dbDir, "cid_studios.db");
  const db = new Database(dbPath);

  // Performance and integrity pragmas
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  // Initialize schema
  db.exec(CREATE_TABLES_SQL);

  // Seed default data if empty
  seedDefaultData(db);

  dbInstance = db;
  return dbInstance;
}

function seedDefaultData(db: Database.Database) {
  const projectCount = db
    .prepare("SELECT COUNT(*) as count FROM projects")
    .get() as { count: number };

  if (projectCount.count > 0) {
    return;
  }

  const now = new Date().toISOString();
  const projectId = "proj_neo_tokyo_2088";

  const insertProject = db.prepare(`
    INSERT INTO projects (id, name, slug, description, fps, resolution, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertCharacter = db.prepare(`
    INSERT INTO characters (id, project_id, name, role, description, voice_profile, ref_sheet_path, ref_body_path, ref_action_path, ref_expression_path, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertLocation = db.prepare(`
    INSERT INTO locations (id, project_id, name, description, time_of_day, ref_main_path, ref_alt_path, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertScene = db.prepare(`
    INSERT INTO scenes (id, project_id, scene_number, title, synopsis, prompt_script, audio_foley, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertShot = db.prepare(`
    INSERT INTO shots (id, scene_id, shot_number, duration, framing, camera_movement, action_notes, character_ids, location_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const seedTx = db.transaction(() => {
    // 1. Project
    insertProject.run(
      projectId,
      "Neo Tokyo 2088",
      "neo-tokyo-2088",
      "Cyberpunk anime short film set in Neo Tokyo 2088. High visual continuity multi-scene director test.",
      24,
      "1344x768",
      now,
      now
    );

    // 2. Character: Shampoo
    const charId = "char_shampoo";
    insertCharacter.run(
      charId,
      projectId,
      "Shampoo",
      "Lead Operative / Courier",
      "Cybernetic operative with purple hair in twin buns, tactical traditional kimono blend outfit.",
      "Calm, energetic Japanese anime heroine",
      "Shampoo-different-angles.png",
      "Shampoo-fullbody.jpg",
      "Shampoo-action.jpg",
      "Shampoo-expressions.jpg",
      now
    );

    // 3. Location: Anime Store
    const locId = "loc_anime_store";
    insertLocation.run(
      locId,
      projectId,
      "Neo-Akiba Retro Anime Store",
      "Crowded cyberpunk anime retail interior with glowing holographic shelves and collectibles.",
      "Night / Neon Interior",
      "Anime-store.jpg",
      "Anime-store-interaction.jpg",
      now
    );

    // 4. Scene 01: The Retrieval
    const sceneId = "scene_01";
    insertScene.run(
      sceneId,
      projectId,
      1,
      "The Retrieval",
      "Shampoo enters the neon-lit anime store to locate the hidden data cartridge.",
      "Shampoo in neon anime store looking for encrypted collectible",
      "neon hum, store chime, soft footstep",
      now
    );

    // 5. Shots
    insertShot.run(
      "shot_01_01",
      sceneId,
      1,
      3.0,
      "Close-up",
      "Static",
      "Static close-up of Shampoo standing inside the anime store. She looks around cheerfully, smiles, and blinks with subtle head movement.",
      JSON.stringify([charId]),
      locId,
      now
    );

    insertShot.run(
      "shot_01_02",
      sceneId,
      2,
      2.5,
      "Medium-Wide",
      "Static",
      "Hard cut to a static medium-wide shot in the anime store aisle. Shampoo walks gracefully past the merchandise shelves.",
      JSON.stringify([charId]),
      locId,
      now
    );

    insertShot.run(
      "shot_01_03",
      sceneId,
      3,
      4.5,
      "Medium Shot",
      "Static",
      "Hard cut to a static counter shot. Shampoo interacts at the store counter, picking up a small anime collectible with a joyful smile.",
      JSON.stringify([charId]),
      locId,
      now
    );
  });

  seedTx();
}

// Data Access Helpers

export function getAllProjects(): Project[] {
  const db = getDb();
  return db.prepare("SELECT * FROM projects ORDER BY created_at DESC").all() as Project[];
}

export function getProjectById(id: string): Project | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM projects WHERE id = ?").get(id) as Project | undefined;
}

export function getProjectBySlug(slug: string): Project | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM projects WHERE slug = ?").get(slug) as Project | undefined;
}

export function createProject(project: Omit<Project, "created_at" | "updated_at">): Project {
  const db = getDb();
  const now = new Date().toISOString();
  const fullProject: Project = {
    ...project,
    description: project.description ?? null,
    fps: project.fps ?? 24,
    resolution: project.resolution ?? "1344x768",
    created_at: now,
    updated_at: now,
  };
  db.prepare(`
    INSERT INTO projects (id, name, slug, description, fps, resolution, created_at, updated_at)
    VALUES (@id, @name, @slug, @description, @fps, @resolution, @created_at, @updated_at)
  `).run(fullProject);
  return fullProject;
}

export function getCharactersByProjectId(projectId: string): Character[] {
  const db = getDb();
  return db.prepare("SELECT * FROM characters WHERE project_id = ? ORDER BY created_at ASC").all(projectId) as Character[];
}

export function getAllCharacters(): Character[] {
  const db = getDb();
  return db.prepare("SELECT * FROM characters ORDER BY created_at ASC").all() as Character[];
}

export function getCharacterById(id: string): Character | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM characters WHERE id = ?").get(id) as Character | undefined;
}

export function createCharacter(char: Omit<Character, "created_at">): Character {
  const db = getDb();
  const now = new Date().toISOString();
  const fullChar: Character = {
    ...char,
    role: char.role ?? null,
    description: char.description ?? null,
    voice_profile: char.voice_profile ?? null,
    ref_sheet_path: char.ref_sheet_path ?? null,
    ref_body_path: char.ref_body_path ?? null,
    ref_action_path: char.ref_action_path ?? null,
    ref_expression_path: char.ref_expression_path ?? null,
    created_at: now,
  };
  db.prepare(`
    INSERT INTO characters (id, project_id, name, role, description, voice_profile, ref_sheet_path, ref_body_path, ref_action_path, ref_expression_path, created_at)
    VALUES (@id, @project_id, @name, @role, @description, @voice_profile, @ref_sheet_path, @ref_body_path, @ref_action_path, @ref_expression_path, @created_at)
  `).run(fullChar);
  return fullChar;
}

export function updateCharacter(
  id: string,
  updates: Partial<Omit<Character, "id" | "created_at">>
): Character | undefined {
  const db = getDb();
  const fields: string[] = [];
  const values: any[] = [];

  for (const [key, val] of Object.entries(updates)) {
    fields.push(`${key} = ?`);
    values.push(val);
  }

  if (fields.length === 0) return getCharacterById(id);

  values.push(id);
  db.prepare(`UPDATE characters SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  return getCharacterById(id);
}

export function deleteCharacter(id: string): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM characters WHERE id = ?").run(id);
  return result.changes > 0;
}

export function getLocationsByProjectId(projectId: string): Location[] {
  const db = getDb();
  return db.prepare("SELECT * FROM locations WHERE project_id = ? ORDER BY created_at ASC").all(projectId) as Location[];
}

export function getAllLocations(): Location[] {
  const db = getDb();
  return db.prepare("SELECT * FROM locations ORDER BY created_at ASC").all() as Location[];
}

export function getLocationById(id: string): Location | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM locations WHERE id = ?").get(id) as Location | undefined;
}

export function createLocation(loc: Omit<Location, "created_at">): Location {
  const db = getDb();
  const now = new Date().toISOString();
  const fullLoc: Location = {
    ...loc,
    description: loc.description ?? null,
    time_of_day: loc.time_of_day ?? null,
    ref_main_path: loc.ref_main_path ?? null,
    ref_alt_path: loc.ref_alt_path ?? null,
    created_at: now,
  };
  db.prepare(`
    INSERT INTO locations (id, project_id, name, description, time_of_day, ref_main_path, ref_alt_path, created_at)
    VALUES (@id, @project_id, @name, @description, @time_of_day, @ref_main_path, @ref_alt_path, @created_at)
  `).run(fullLoc);
  return fullLoc;
}

export function updateLocation(
  id: string,
  updates: Partial<Omit<Location, "id" | "created_at">>
): Location | undefined {
  const db = getDb();
  const fields: string[] = [];
  const values: any[] = [];

  for (const [key, val] of Object.entries(updates)) {
    fields.push(`${key} = ?`);
    values.push(val);
  }

  if (fields.length === 0) return getLocationById(id);

  values.push(id);
  db.prepare(`UPDATE locations SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  return getLocationById(id);
}

export function deleteLocation(id: string): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM locations WHERE id = ?").run(id);
  return result.changes > 0;
}

export function getScenesByProjectId(projectId: string): Scene[] {
  const db = getDb();
  return db.prepare("SELECT * FROM scenes WHERE project_id = ? ORDER BY scene_number ASC").all(projectId) as Scene[];
}

export function getShotsBySceneId(sceneId: string): Shot[] {
  const db = getDb();
  return db.prepare("SELECT * FROM shots WHERE scene_id = ? ORDER BY shot_number ASC").all(sceneId) as Shot[];
}

export function getTakesByShotId(shotId: string): Take[] {
  const db = getDb();
  return db.prepare("SELECT * FROM takes WHERE shot_id = ? ORDER BY take_number DESC").all(shotId) as Take[];
}

export function createTake(take: Omit<Take, "created_at">): Take {
  const db = getDb();
  const now = new Date().toISOString();
  const fullTake: Take = {
    ...take,
    video_path: take.video_path ?? null,
    audio_path: take.audio_path ?? null,
    thumbnail_path: take.thumbnail_path ?? null,
    metadata: take.metadata ?? null,
    prompt_id: take.prompt_id ?? null,
    created_at: now,
  };
  db.prepare(`
    INSERT INTO takes (id, shot_id, take_number, prompt_id, status, duration, resolution, steps, seed, video_path, audio_path, thumbnail_path, metadata, created_at)
    VALUES (@id, @shot_id, @take_number, @prompt_id, @status, @duration, @resolution, @steps, @seed, @video_path, @audio_path, @thumbnail_path, @metadata, @created_at)
  `).run(fullTake);
  return fullTake;
}

export function updateTakeStatus(
  id: string,
  status: Take["status"],
  updates?: {
    video_path?: string | null;
    audio_path?: string | null;
    thumbnail_path?: string | null;
    metadata?: string | null;
  }
) {
  const db = getDb();
  db.prepare(`
    UPDATE takes
    SET status = ?, video_path = COALESCE(?, video_path), audio_path = COALESCE(?, audio_path), thumbnail_path = COALESCE(?, thumbnail_path), metadata = COALESCE(?, metadata)
    WHERE id = ?
  `).run(
    status,
    updates?.video_path ?? null,
    updates?.audio_path ?? null,
    updates?.thumbnail_path ?? null,
    updates?.metadata ?? null,
    id
  );
}

export function getQueueJobs(): QueueJob[] {
  const db = getDb();
  return db.prepare("SELECT * FROM queue_jobs ORDER BY created_at DESC").all() as QueueJob[];
}

export function createQueueJob(job: Omit<QueueJob, "created_at">): QueueJob {
  const db = getDb();
  const now = new Date().toISOString();
  const fullJob: QueueJob = {
    ...job,
    take_id: job.take_id ?? null,
    current_node: job.current_node ?? null,
    eta_seconds: job.eta_seconds ?? null,
    created_at: now,
  };
  db.prepare(`
    INSERT INTO queue_jobs (id, take_id, status, progress, current_step, total_steps, current_node, eta_seconds, created_at)
    VALUES (@id, @take_id, @status, @progress, @current_step, @total_steps, @current_node, @eta_seconds, @created_at)
  `).run(fullJob);
  return fullJob;
}

export function updateQueueJobProgress(
  id: string,
  updates: Partial<Omit<QueueJob, "id" | "created_at">>
) {
  const db = getDb();
  const sets: string[] = [];
  const values: any[] = [];

  for (const [key, val] of Object.entries(updates)) {
    sets.push(`${key} = ?`);
    values.push(val);
  }

  if (sets.length === 0) return;
  values.push(id);

  db.prepare(`UPDATE queue_jobs SET ${sets.join(", ")} WHERE id = ?`).run(...values);
}

export * from "./schema";
