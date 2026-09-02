import { spawn, ChildProcess } from "child_process";

interface CaffeinateState {
  process: ChildProcess | null;
  activeCount: number;
  startedAt: string | null;
}

const state: CaffeinateState = {
  process: null,
  activeCount: 0,
  startedAt: null,
};

/**
 * Starts macOS caffeinate process to prevent system/display sleep during active renders.
 * Uses reference counting to support multiple parallel render tasks.
 */
export function startCaffeinate(): boolean {
  state.activeCount += 1;

  if (process.platform !== "darwin") {
    // Caffeinate is macOS specific; no-op safely on other OSes
    return true;
  }

  if (state.process && !state.process.killed) {
    return true;
  }

  try {
    // -d: prevent display from sleeping
    // -i: prevent system from idle sleeping
    // -m: prevent disk from idling
    // -s: prevent system from sleeping on AC power
    // -u: declare user is active
    const proc = spawn("caffeinate", ["-dimsu"], {
      detached: true,
      stdio: "ignore",
    });

    proc.unref();

    state.process = proc;
    state.startedAt = new Date().toISOString();

    proc.on("error", (err) => {
      console.error("[Caffeinate] Process error:", err);
      state.process = null;
      state.startedAt = null;
    });

    proc.on("exit", () => {
      state.process = null;
      state.startedAt = null;
    });

    return true;
  } catch (error) {
    console.error("[Caffeinate] Failed to spawn caffeinate:", error);
    return false;
  }
}

/**
 * Decrements the active render count and terminates caffeinate when count drops to 0.
 */
export function stopCaffeinate(): boolean {
  if (state.activeCount > 0) {
    state.activeCount -= 1;
  }

  if (state.activeCount === 0 && state.process) {
    try {
      state.process.kill("SIGTERM");
      state.process = null;
      state.startedAt = null;
      return true;
    } catch (err) {
      console.error("[Caffeinate] Error terminating process:", err);
      return false;
    }
  }

  return true;
}

/**
 * Returns whether caffeinate is currently active.
 */
export function isCaffeinateActive(): boolean {
  return state.activeCount > 0 && state.process !== null && !state.process.killed;
}

/**
 * Returns detailed status of the caffeinate manager.
 */
export function getCaffeinateStatus() {
  return {
    supported: process.platform === "darwin",
    active: isCaffeinateActive(),
    activeRenders: state.activeCount,
    startedAt: state.startedAt,
    pid: state.process?.pid ?? null,
  };
}
