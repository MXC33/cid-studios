export interface Project {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  fps: number;
  resolution: string;
  created_at: string;
  updated_at: string;
}

export interface Character {
  id: string;
  project_id: string;
  name: string;
  role?: string | null;
  description?: string | null;
  voice_profile?: string | null;
  ref_sheet_path?: string | null;
  ref_body_path?: string | null;
  ref_action_path?: string | null;
  ref_expression_path?: string | null;
  created_at: string;
}

export interface Location {
  id: string;
  project_id: string;
  name: string;
  description?: string | null;
  time_of_day?: string | null;
  ref_main_path?: string | null;
  ref_alt_path?: string | null;
  created_at: string;
}

export interface Scene {
  id: string;
  project_id: string;
  scene_number: number;
  title: string;
  synopsis?: string | null;
  prompt_script?: string | null;
  audio_foley?: string | null;
  created_at: string;
}

export interface Shot {
  id: string;
  scene_id: string;
  shot_number: number;
  duration: number;
  framing?: string | null;
  camera_movement?: string | null;
  action_notes?: string | null;
  character_ids?: string | null; // JSON string e.g. '["char_1"]'
  location_id?: string | null;
  created_at: string;
}

export interface Take {
  id: string;
  shot_id: string;
  take_number: number;
  prompt_id?: string | null;
  status: "queued" | "rendering" | "completed" | "failed";
  duration: number;
  resolution: string;
  steps: number;
  seed: number;
  video_path?: string | null;
  audio_path?: string | null;
  thumbnail_path?: string | null;
  metadata?: string | null; // JSON string
  created_at: string;
}

export interface QueueJob {
  id: string;
  take_id?: string | null;
  status: string;
  progress: number;
  current_step: number;
  total_steps: number;
  current_node?: string | null;
  eta_seconds?: number | null;
  created_at: string;
}

export const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  fps INTEGER DEFAULT 24,
  resolution TEXT DEFAULT '1344x768',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS characters (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT,
  description TEXT,
  voice_profile TEXT,
  ref_sheet_path TEXT,
  ref_body_path TEXT,
  ref_action_path TEXT,
  ref_expression_path TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS locations (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  time_of_day TEXT,
  ref_main_path TEXT,
  ref_alt_path TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS scenes (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scene_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  synopsis TEXT,
  prompt_script TEXT,
  audio_foley TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS shots (
  id TEXT PRIMARY KEY,
  scene_id TEXT NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  shot_number INTEGER NOT NULL,
  duration REAL DEFAULT 5.0,
  framing TEXT,
  camera_movement TEXT,
  action_notes TEXT,
  character_ids TEXT,
  location_id TEXT REFERENCES locations(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS takes (
  id TEXT PRIMARY KEY,
  shot_id TEXT NOT NULL REFERENCES shots(id) ON DELETE CASCADE,
  take_number INTEGER NOT NULL,
  prompt_id TEXT,
  status TEXT NOT NULL DEFAULT 'queued',
  duration REAL DEFAULT 5.0,
  resolution TEXT DEFAULT '1344x768',
  steps INTEGER DEFAULT 4,
  seed INTEGER,
  video_path TEXT,
  audio_path TEXT,
  thumbnail_path TEXT,
  metadata TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS queue_jobs (
  id TEXT PRIMARY KEY,
  take_id TEXT REFERENCES takes(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  progress REAL DEFAULT 0,
  current_step INTEGER DEFAULT 0,
  total_steps INTEGER DEFAULT 4,
  current_node TEXT,
  eta_seconds REAL,
  created_at TEXT NOT NULL
);
`;
