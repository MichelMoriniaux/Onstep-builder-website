// Shared types & constants for the OnStep firmware builder.
// Imported by the API, the worker, and (types only) the web app.

export type FirmwareTarget = "onstepx" | "sws";

export const FIRMWARES: readonly FirmwareTarget[] = ["onstepx", "sws"] as const;

export const FIRMWARE_LABELS: Record<FirmwareTarget, string> = {
  onstepx: "OnStepX",
  sws: "SmartWebServer",
};

/** Config files a user may upload, per firmware. `Config.h` is always required. */
export const ALLOWED_CONFIG_FILES: Record<FirmwareTarget, readonly string[]> = {
  onstepx: ["Config.h", "Extended.config.h", "Plugins.config.h"],
  sws: ["Config.h", "Extended.config.h"],
};

export const REQUIRED_CONFIG_FILE = "Config.h";

/** Default git ref per source repo when the user does not pin one. */
export const DEFAULT_REFS = {
  onstepx: "main",
  sws: "main",
  plugins: "main",
} as const;

/** Guardrails (mirrored by client-side validation). */
export const LIMITS = {
  maxConfigBytes: 256 * 1024, // 256 KB per uploaded file
  maxRefLength: 200,
  maxPatches: 20, // per firmware target
  maxPatchBytes: 1024 * 1024, // 1 MB per patch file
} as const;

export type BuildOverallStatus =
  | "queued"
  | "running"
  | "success"
  | "partial"
  | "error";

export type TargetStatus = "queued" | "running" | "success" | "error";

export interface ArtifactInfo {
  name: string;
  size: number;
}

/** What the runner container consumes: <jobDir>/<firmware>/in/spec.json */
export interface RunnerSpec {
  firmware: FirmwareTarget;
  ref: string;
  pluginsRef: string;
  hasExtended: boolean;
  hasPlugins: boolean;
  /** Patch files (in <in>/patches/), applied to the source repo in this order. */
  patches: string[];
}

export interface TargetResult {
  firmware: FirmwareTarget;
  status: TargetStatus;
  ref: string;
  pluginsRef?: string;
  /** Downloadable artifacts (individual bins/elf + the per-firmware zip). */
  artifacts: ArtifactInfo[];
  /** Short human message (e.g. failure reason). */
  message?: string;
  startedAt?: string;
  finishedAt?: string;
}

/** Persisted per build at data/jobs/<id>/build.json — also the API status payload. */
export interface BuildRecord {
  id: string;
  status: BuildOverallStatus;
  createdAt: string;
  updatedAt: string;
  targets: TargetResult[];
}

/** Path helpers so API and worker agree on the on-disk layout. */
export const jobPaths = {
  targetIn: (firmware: FirmwareTarget) => `${firmware}/in`,
  targetOut: (firmware: FirmwareTarget) => `${firmware}/out`,
  buildJson: () => `build.json`,
};

export * from "./generator.js";

export function artifactContentType(name: string): string {
  if (name.endsWith(".zip")) return "application/zip";
  if (name.endsWith(".log")) return "text/plain; charset=utf-8";
  if (name.endsWith(".json")) return "application/json";
  return "application/octet-stream";
}
