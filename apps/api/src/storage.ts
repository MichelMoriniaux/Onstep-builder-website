import { promises as fs } from "node:fs";
import path from "node:path";
import {
  BuildRecord,
  FirmwareTarget,
  jobPaths,
} from "@onstep/shared";
import { config } from "./config.js";

export const jobsRoot = () => path.resolve(config.dataDir, "jobs");
export const jobDir = (id: string) => path.join(jobsRoot(), id);
export const targetInDir = (id: string, fw: FirmwareTarget) =>
  path.join(jobDir(id), jobPaths.targetIn(fw));
export const targetOutDir = (id: string, fw: FirmwareTarget) =>
  path.join(jobDir(id), jobPaths.targetOut(fw));
export const buildJsonPath = (id: string) =>
  path.join(jobDir(id), jobPaths.buildJson());

export async function ensureDir(p: string) {
  await fs.mkdir(p, { recursive: true });
}

export async function writeBuildRecord(rec: BuildRecord) {
  rec.updatedAt = new Date().toISOString();
  await ensureDir(jobDir(rec.id));
  await fs.writeFile(buildJsonPath(rec.id), JSON.stringify(rec, null, 2));
}

export async function readBuildRecord(id: string): Promise<BuildRecord | null> {
  try {
    const raw = await fs.readFile(buildJsonPath(id), "utf8");
    return JSON.parse(raw) as BuildRecord;
  } catch {
    return null;
  }
}

/** Resolve an artifact path if it exists in the target's out dir (no traversal). */
export async function resolveArtifact(
  id: string,
  fw: FirmwareTarget,
  name: string
): Promise<string | null> {
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) return null; // defense in depth vs. traversal
  if (name.includes("/") || name.includes("\\") || name.includes("..")) return null;
  const p = path.join(targetOutDir(id, fw), name);
  try {
    const st = await fs.stat(p);
    if (st.isFile()) return p;
  } catch {
    /* not found */
  }
  return null;
}
