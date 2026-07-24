import { promises as fs } from "node:fs";
import path from "node:path";
import { config } from "./config.js";

/** Delete job directories older than the configured TTL. */
export async function sweepOnce(): Promise<number> {
  const ttlMs = config.cleanup.ttlHours * 3600 * 1000;
  const cutoff = Date.now() - ttlMs;
  let removed = 0;

  let ids: string[];
  try {
    ids = await fs.readdir(config.jobsDir);
  } catch {
    return 0;
  }

  for (const id of ids) {
    const dir = path.join(config.jobsDir, id);
    try {
      const st = await fs.stat(dir);
      if (st.isDirectory() && st.mtimeMs < cutoff) {
        await fs.rm(dir, { recursive: true, force: true });
        removed++;
      }
    } catch {
      /* ignore */
    }
  }
  if (removed) console.log(`[cleanup] removed ${removed} expired job dir(s)`);
  return removed;
}

export function startCleanup() {
  sweepOnce().catch(() => {});
  return setInterval(() => sweepOnce().catch(() => {}), config.cleanup.intervalMs);
}
