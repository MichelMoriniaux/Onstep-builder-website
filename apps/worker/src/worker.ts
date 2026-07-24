import { Worker } from "bullmq";
import { Redis } from "ioredis";
import {
  BuildOverallStatus,
  BuildRecord,
  TargetResult,
} from "@onstep/shared";
import { config } from "./config.js";
import { ensureRunnerImage, runBuildContainer } from "./docker.js";
import { packageArtifacts, readResult } from "./package.js";
import { readBuildRecord, writeBuildRecord } from "./store.js";

const connection = new Redis(config.redisUrl, { maxRetriesPerRequest: null });

async function processTarget(rec: BuildRecord, target: TargetResult): Promise<void> {
  target.status = "running";
  target.startedAt = new Date().toISOString();
  await writeBuildRecord(rec);

  const run = await runBuildContainer(rec.id, target.firmware);
  const result = await readResult(rec.id, target.firmware);
  target.finishedAt = new Date().toISOString();

  if (run.exitCode === 0) {
    target.status = "success";
    target.artifacts = await packageArtifacts(rec.id, target.firmware);
    target.message = result?.message ?? "build succeeded";
    if (target.artifacts.length === 0) {
      target.status = "error";
      target.message = "build reported success but produced no artifacts";
    }
  } else {
    target.status = "error";
    target.message = run.timedOut
      ? `build timed out after ${Math.round(config.build.timeoutMs / 1000)}s`
      : result?.message ?? run.error ?? `build failed (exit ${run.exitCode})`;
  }
  await writeBuildRecord(rec);
}

function overallStatus(targets: TargetResult[]): BuildOverallStatus {
  const ok = targets.filter((t) => t.status === "success").length;
  if (ok === targets.length) return "success";
  if (ok === 0) return "error";
  return "partial";
}

export function startWorker() {
  const worker = new Worker<{ buildId: string }>(
    config.queueName,
    async (job) => {
      const rec = await readBuildRecord(job.data.buildId);
      if (!rec) throw new Error(`build record ${job.data.buildId} not found`);

      try {
        await ensureRunnerImage();
      } catch (err) {
        for (const t of rec.targets) {
          t.status = "error";
          t.message = err instanceof Error ? err.message : String(err);
        }
        rec.status = "error";
        await writeBuildRecord(rec);
        return;
      }

      rec.status = "running";
      await writeBuildRecord(rec);

      // Sequential per target so a two-firmware build respects the resource caps.
      for (const target of rec.targets) {
        try {
          await processTarget(rec, target);
        } catch (err) {
          target.status = "error";
          target.message = err instanceof Error ? err.message : String(err);
          await writeBuildRecord(rec);
        }
      }

      rec.status = overallStatus(rec.targets);
      await writeBuildRecord(rec);
    },
    { connection, concurrency: config.concurrency }
  );

  worker.on("failed", (job, err) =>
    console.error(`[worker] job ${job?.id} failed:`, err?.message)
  );
  worker.on("completed", (job) => console.log(`[worker] job ${job.id} completed`));
  return worker;
}
