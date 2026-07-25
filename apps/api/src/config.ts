import { LIMITS } from "@onstep/shared";

const num = (v: string | undefined, d: number) => (v ? Number(v) : d);

export const config = {
  port: num(process.env.PORT, 8080),
  host: process.env.HOST ?? "0.0.0.0",
  /** Root for per-job working dirs. Shared (bind-mounted) with the worker. */
  dataDir: process.env.DATA_DIR ?? "./data",
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
  queueName: process.env.QUEUE_NAME ?? "builds",
  // Same-origin only by default (the app is served same-origin behind nginx).
  // Set CORS_ORIGIN to a URL to allow a specific cross-origin frontend.
  corsOrigin: process.env.CORS_ORIGIN ?? false,
  maxConfigBytes: num(process.env.MAX_CONFIG_BYTES, LIMITS.maxConfigBytes),
  rateLimit: {
    max: num(process.env.RATE_LIMIT_MAX, 20), // builds/generate per window per IP
    globalMax: num(process.env.RATE_LIMIT_GLOBAL_MAX, 600), // all routes per window per IP
    windowMs: num(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
  },
} as const;
