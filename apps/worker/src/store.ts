import { promises as fs } from "node:fs";
import path from "node:path";
import { BuildRecord, FirmwareTarget, jobPaths } from "@onstep/shared";
import { config } from "./config.js";

export const jobDir = (id: string) => path.join(config.jobsDir, id);
export const targetInDir = (id: string, fw: FirmwareTarget) =>
  path.join(jobDir(id), jobPaths.targetIn(fw));
export const targetOutDir = (id: string, fw: FirmwareTarget) =>
  path.join(jobDir(id), jobPaths.targetOut(fw));

/** Host-visible variants for the runner's bind mounts. */
export const hostTargetInDir = (id: string, fw: FirmwareTarget) =>
  path.posix.join(config.jobsHostDir.replace(/\\/g, "/"), id, jobPaths.targetIn(fw));
export const hostTargetOutDir = (id: string, fw: FirmwareTarget) =>
  path.posix.join(config.jobsHostDir.replace(/\\/g, "/"), id, jobPaths.targetOut(fw));

const buildJsonPath = (id: string) => path.join(jobDir(id), jobPaths.buildJson());

export async function readBuildRecord(id: string): Promise<BuildRecord | null> {
  try {
    return JSON.parse(await fs.readFile(buildJsonPath(id), "utf8")) as BuildRecord;
  } catch {
    return null;
  }
}

export async function writeBuildRecord(rec: BuildRecord) {
  rec.updatedAt = new Date().toISOString();
  await fs.writeFile(buildJsonPath(rec.id), JSON.stringify(rec, null, 2));
}
