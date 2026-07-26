import archiver from "archiver";
import { createWriteStream, promises as fs } from "node:fs";
import path from "node:path";
import { ArtifactInfo, FIRMWARE_LABELS, FirmwareTarget } from "@onstep/shared";
import { targetOutDir } from "./store.js";

const BINARY_EXT = [".bin"];
const isBinary = (f: string) => BINARY_EXT.some((e) => f.endsWith(e));

// Prebuilt firmware-uploader installer the runner emits (compiled bins injected
// into its bin/ folder). Surfaced as a downloadable artifact when present.
const INSTALLER_NAME: Record<FirmwareTarget, string> = {
  onstepx: "JTW.Firmware.Uploader.OnStepX.zip",
  sws: "JTW.Firmware.Uploader.Smart.Web.Server.zip",
};

/** Read the runner's result.json, if present. */
export async function readResult(
  id: string,
  fw: FirmwareTarget
): Promise<{ status?: string; message?: string } | null> {
  try {
    const raw = await fs.readFile(path.join(targetOutDir(id, fw), "result.json"), "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Zip the firmware binaries and return the full downloadable artifact list. */
export async function packageArtifacts(
  id: string,
  fw: FirmwareTarget
): Promise<ArtifactInfo[]> {
  const outDir = targetOutDir(id, fw);
  const entries = await fs.readdir(outDir).catch(() => [] as string[]);
  const bins = entries.filter(isBinary).sort();

  if (bins.length === 0) return [];

  const zipName = `${fw}-firmware.zip`;
  await createZip(
    path.join(outDir, zipName),
    bins.map((f) => ({ path: path.join(outDir, f), name: f })),
    `${FIRMWARE_LABELS[fw]} firmware`
  );

  // The runner's installer zip (if it was produced) is listed first as the
  // primary deliverable, followed by the loose bins and the plain firmware zip.
  const installer = INSTALLER_NAME[fw];
  const artifacts: ArtifactInfo[] = [];
  for (const f of [installer, ...bins, zipName]) {
    const st = await fs.stat(path.join(outDir, f)).catch(() => null);
    if (st) artifacts.push({ name: f, size: st.size });
  }
  return artifacts;
}

function createZip(
  dest: string,
  files: { path: string; name: string }[],
  comment: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(dest);
    const archive = archiver("zip", { zlib: { level: 9 }, comment });
    output.on("close", () => resolve());
    archive.on("error", reject);
    archive.pipe(output);
    for (const f of files) archive.file(f.path, { name: f.name });
    archive.finalize();
  });
}
