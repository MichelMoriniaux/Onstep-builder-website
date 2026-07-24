import path from "node:path";

const num = (v: string | undefined, d: number) => (v ? Number(v) : d);

const dataDir = process.env.DATA_DIR ?? "./data";

export const config = {
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
  queueName: process.env.QUEUE_NAME ?? "builds",
  dataDir,
  /** Path to <dataDir>/jobs as the CONTAINER (this process) sees it. */
  jobsDir: path.resolve(dataDir, "jobs"),
  /**
   * Path to <dataDir>/jobs as the DOCKER HOST sees it. Used for the runner's
   * bind mounts, which the daemon always resolves on the host. When the worker
   * runs directly on the host these are identical; in compose they differ.
   */
  jobsHostDir: process.env.JOBS_HOST_DIR
    ? path.posix.join(process.env.JOBS_HOST_DIR.replace(/\\/g, "/"), "jobs")
    : path.resolve(dataDir, "jobs"),
  runnerImage: process.env.RUNNER_IMAGE ?? "onstep-builder-runner",
  concurrency: num(process.env.WORKER_CONCURRENCY, 2),
  build: {
    memoryBytes: num(process.env.BUILD_MEMORY_MB, 2048) * 1024 * 1024,
    nanoCpus: Math.round(num(process.env.BUILD_CPUS, 2) * 1e9),
    pidsLimit: num(process.env.BUILD_PIDS_LIMIT, 512),
    tmpfsWorkSize: process.env.BUILD_WORK_TMPFS ?? "1024m",
    timeoutMs: num(process.env.BUILD_TIMEOUT_MS, 15 * 60_000),
    /** v1: allow network for the source clone. Set "none" to harden (breaks ref fetch). */
    networkMode: process.env.BUILD_NETWORK ?? "bridge",
  },
  cleanup: {
    ttlHours: num(process.env.ARTIFACT_TTL_HOURS, 24),
    intervalMs: num(process.env.CLEANUP_INTERVAL_MS, 30 * 60_000),
  },
} as const;
