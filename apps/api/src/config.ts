import { LIMITS } from "@onstep/shared";

const num = (v: string | undefined, d: number) => (v ? Number(v) : d);

export const config = {
  port: num(process.env.PORT, 8080),
  host: process.env.HOST ?? "0.0.0.0",
  /** Root for per-job working dirs. Shared (bind-mounted) with the worker. */
  dataDir: process.env.DATA_DIR ?? "./data",
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
  queueName: process.env.QUEUE_NAME ?? "builds",
  corsOrigin: process.env.CORS_ORIGIN ?? true, // reflect origin by default (dev)
  maxConfigBytes: num(process.env.MAX_CONFIG_BYTES, LIMITS.maxConfigBytes),
  rateLimit: {
    max: num(process.env.RATE_LIMIT_MAX, 20), // builds submissions per window
    windowMs: num(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
  },
} as const;
