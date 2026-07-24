import Docker from "dockerode";
import { FirmwareTarget } from "@onstep/shared";
import { config } from "./config.js";
import { hostTargetInDir, hostTargetOutDir } from "./store.js";

export const docker = new Docker(); // talks to /var/run/docker.sock (or npipe on Windows)

export interface RunResult {
  exitCode: number;
  timedOut: boolean;
  error?: string;
}

export async function ensureRunnerImage(): Promise<void> {
  try {
    await docker.getImage(config.runnerImage).inspect();
  } catch {
    throw new Error(
      `runner image '${config.runnerImage}' not found. Build it with: docker build -t ${config.runnerImage} ./runner`
    );
  }
}

/** Run one firmware build in an isolated container. Artifacts land in the /out bind. */
export async function runBuildContainer(
  id: string,
  fw: FirmwareTarget
): Promise<RunResult> {
  const hostIn = hostTargetInDir(id, fw);
  const hostOut = hostTargetOutDir(id, fw);

  const container = await docker.createContainer({
    Image: config.runnerImage,
    HostConfig: {
      Binds: [`${hostIn}:/in:ro`, `${hostOut}:/out`],
      AutoRemove: true,
      Memory: config.build.memoryBytes,
      NanoCpus: config.build.nanoCpus,
      PidsLimit: config.build.pidsLimit,
      // mode=1777 so the non-root 'builder' user can write into the tmpfs.
      Tmpfs: { "/work": `rw,size=${config.build.tmpfsWorkSize},mode=1777` },
      NetworkMode: config.build.networkMode,
      CapDrop: ["ALL"],
      SecurityOpt: ["no-new-privileges"],
    },
  });

  await container.start();

  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    container.stop({ t: 5 }).catch(() => {});
  }, config.build.timeoutMs);

  try {
    const res = (await container.wait()) as { StatusCode: number };
    clearTimeout(timer);
    return { exitCode: res.StatusCode, timedOut };
  } catch (err) {
    clearTimeout(timer);
    return {
      exitCode: timedOut ? 124 : 1,
      timedOut,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
