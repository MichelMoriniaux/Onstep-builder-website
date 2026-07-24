import { Queue } from "bullmq";
import { Redis } from "ioredis";
import { config } from "./config.js";

export interface BuildJobData {
  buildId: string;
}

// maxRetriesPerRequest must be null for BullMQ's blocking connections.
export const connection = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null,
});

export const buildQueue = new Queue<BuildJobData>(config.queueName, {
  connection,
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: { age: 3600, count: 500 },
    removeOnFail: { age: 3600, count: 500 },
  },
});
