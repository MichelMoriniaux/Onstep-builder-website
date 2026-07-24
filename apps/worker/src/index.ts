import { config } from "./config.js";
import { startWorker } from "./worker.js";
import { startCleanup } from "./cleanup.js";

console.log(
  `[worker] starting: queue=${config.queueName} image=${config.runnerImage} concurrency=${config.concurrency}`
);
console.log(`[worker] jobs (local): ${config.jobsDir}`);
console.log(`[worker] jobs (host) : ${config.jobsHostDir}`);

const worker = startWorker();
const cleanup = startCleanup();

async function shutdown() {
  console.log("[worker] shutting down...");
  clearInterval(cleanup);
  await worker.close();
  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
