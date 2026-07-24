import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import { createReadStream } from "node:fs";
import { promises as fs } from "node:fs";
import { nanoid } from "nanoid";
import { z } from "zod";
import {
  ALLOWED_CONFIG_FILES,
  BuildRecord,
  DEFAULT_ANSWERS,
  DEFAULT_REFS,
  FIRMWARES,
  FirmwareTarget,
  GeneratorAnswers,
  LIMITS,
  REQUIRED_CONFIG_FILE,
  RunnerSpec,
  TargetResult,
  artifactContentType,
} from "@onstep/shared";
import { config } from "./config.js";
import { generateConfigs } from "./generator/generate.js";
import { buildQueue } from "./queue.js";
import {
  ensureDir,
  readBuildRecord,
  resolveArtifact,
  targetInDir,
  targetOutDir,
  writeBuildRecord,
} from "./storage.js";

const specSchema = z.object({
  targets: z
    .array(
      z.object({
        firmware: z.enum(["onstepx", "sws"]),
        ref: z.string().max(LIMITS.maxRefLength).optional(),
        pluginsRef: z.string().max(LIMITS.maxRefLength).optional(),
      })
    )
    .min(1)
    .max(FIRMWARES.length),
});

// Generator answers: enums for the two that branch template selection/logic,
// every other field is a bounded string (merged onto DEFAULT_ANSWERS).
const answersSchema = z
  .object({
    version: z.enum(["10.25p", "10.28u"]),
    model: z.enum(["GTR", "P75"]),
  })
  .catchall(z.string().max(256));

// In-memory collected upload: firmware -> filename -> buffer
type Collected = Map<FirmwareTarget, Map<string, Buffer>>;

export async function buildServer() {
  const app = Fastify({ logger: true, bodyLimit: 2 * 1024 * 1024 });

  await app.register(cors, { origin: config.corsOrigin });
  await app.register(rateLimit, {
    global: false,
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.windowMs,
  });
  await app.register(multipart, {
    limits: { fileSize: config.maxConfigBytes, files: 8, fields: 4 },
  });

  app.get("/api/health", async () => ({ ok: true }));

  // ---- generate JTW mount configs from wizard answers -----------------------
  app.post(
    "/api/generate",
    { config: { rateLimit: { max: config.rateLimit.max, timeWindow: config.rateLimit.windowMs } } },
    async (req, reply) => {
      const parsed = answersSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: "invalid answers", detail: parsed.error.message });
      }
      const answers = { ...DEFAULT_ANSWERS, ...parsed.data } as GeneratorAnswers;
      try {
        const files = await generateConfigs(answers);
        return files;
      } catch (err) {
        req.log.error(err);
        return reply.code(500).send({ error: "generation failed", detail: String((err as Error).message) });
      }
    }
  );

  // ---- submit a build -------------------------------------------------------
  app.post(
    "/api/builds",
    { config: { rateLimit: { max: config.rateLimit.max, timeWindow: config.rateLimit.windowMs } } },
    async (req, reply) => {
      let specRaw: string | undefined;
      const collected: Collected = new Map();

      try {
        for await (const part of req.parts()) {
          if (part.type === "file") {
            const [fw, filename] = part.fieldname.split(":");
            if (!isFirmware(fw) || !filename) {
              await drain(part);
              return reply.code(400).send({ error: `bad file field '${part.fieldname}'` });
            }
            if (!ALLOWED_CONFIG_FILES[fw].includes(filename)) {
              await drain(part);
              return reply
                .code(400)
                .send({ error: `'${filename}' not allowed for ${fw}` });
            }
            const buf = await part.toBuffer(); // throws if over fileSize limit
            if (!collected.has(fw)) collected.set(fw, new Map());
            collected.get(fw)!.set(filename, buf);
          } else if (part.fieldname === "spec") {
            specRaw = part.value as string;
          }
        }
      } catch (err: any) {
        if (err?.code === "FST_REQ_FILE_TOO_LARGE") {
          return reply.code(413).send({ error: "config file too large" });
        }
        req.log.error(err);
        return reply.code(400).send({ error: "malformed upload" });
      }

      if (!specRaw) return reply.code(400).send({ error: "missing 'spec' field" });
      let spec: z.infer<typeof specSchema>;
      try {
        spec = specSchema.parse(JSON.parse(specRaw));
      } catch (err: any) {
        return reply.code(400).send({ error: "invalid spec", detail: String(err?.message ?? err) });
      }

      // Validate each target has its required Config.h.
      for (const t of spec.targets) {
        const files = collected.get(t.firmware);
        if (!files?.has(REQUIRED_CONFIG_FILE)) {
          return reply
            .code(400)
            .send({ error: `${t.firmware}: ${REQUIRED_CONFIG_FILE} is required` });
        }
      }

      // Create job on disk.
      const id = nanoid(12);
      const now = new Date().toISOString();
      const targets: TargetResult[] = [];

      for (const t of spec.targets) {
        const files = collected.get(t.firmware)!;
        const inDir = targetInDir(id, t.firmware);
        await ensureDir(inDir);
        await ensureDir(targetOutDir(id, t.firmware));
        for (const [name, buf] of files) {
          await fs.writeFile(`${inDir}/${name}`, buf);
        }
        const ref = (t.ref?.trim() || DEFAULT_REFS[t.firmware]) as string;
        const pluginsRef = (t.pluginsRef?.trim() || DEFAULT_REFS.plugins) as string;
        const runnerSpec: RunnerSpec = {
          firmware: t.firmware,
          ref,
          pluginsRef,
          hasExtended: files.has("Extended.config.h"),
          hasPlugins: t.firmware === "onstepx" && files.has("Plugins.config.h"),
        };
        await fs.writeFile(`${inDir}/spec.json`, JSON.stringify(runnerSpec, null, 2));
        targets.push({
          firmware: t.firmware,
          status: "queued",
          ref,
          pluginsRef,
          artifacts: [],
        });
      }

      const record: BuildRecord = {
        id,
        status: "queued",
        createdAt: now,
        updatedAt: now,
        targets,
      };
      await writeBuildRecord(record);
      await buildQueue.add("build", { buildId: id }, { jobId: id });

      return reply.code(201).send({ id });
    }
  );

  // ---- build status ---------------------------------------------------------
  app.get<{ Params: { id: string } }>("/api/builds/:id", async (req, reply) => {
    const rec = await readBuildRecord(req.params.id);
    if (!rec) return reply.code(404).send({ error: "not found" });
    return rec;
  });

  // ---- live build log (SSE) -------------------------------------------------
  app.get<{ Params: { id: string }; Querystring: { firmware?: string } }>(
    "/api/builds/:id/log",
    async (req, reply) => {
      const { id } = req.params;
      const fw = req.query.firmware;
      if (!isFirmware(fw)) return reply.code(400).send({ error: "firmware query required" });
      const rec = await readBuildRecord(id);
      if (!rec || !rec.targets.some((t) => t.firmware === fw)) {
        return reply.code(404).send({ error: "not found" });
      }

      reply.hijack();
      const res = reply.raw;
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      });
      streamLog(id, fw, res, req).catch(() => res.end());
    }
  );

  // ---- artifact download ----------------------------------------------------
  app.get<{ Params: { id: string; firmware: string; name: string } }>(
    "/api/builds/:id/artifacts/:firmware/:name",
    async (req, reply) => {
      const { id, firmware, name } = req.params;
      if (!isFirmware(firmware)) return reply.code(400).send({ error: "bad firmware" });
      const p = await resolveArtifact(id, firmware, name);
      if (!p) return reply.code(404).send({ error: "not found" });
      reply.header("Content-Type", artifactContentType(name));
      reply.header("Content-Disposition", `attachment; filename="${name}"`);
      return reply.send(createReadStream(p));
    }
  );

  return app;
}

function isFirmware(v: unknown): v is FirmwareTarget {
  return typeof v === "string" && (FIRMWARES as readonly string[]).includes(v);
}

async function drain(part: any) {
  try {
    await part.toBuffer();
  } catch {
    /* ignore */
  }
}

/** Tail build.log for a target, emitting SSE `log` events until the target is terminal. */
async function streamLog(
  id: string,
  fw: FirmwareTarget,
  res: import("node:http").ServerResponse,
  req: { raw: import("node:http").IncomingMessage }
) {
  const logPath = `${targetOutDir(id, fw)}/build.log`;
  let offset = 0;
  let closed = false;
  req.raw.on("close", () => {
    closed = true;
  });

  const send = (event: string, data: string) => {
    res.write(`event: ${event}\n`);
    for (const line of data.split("\n")) res.write(`data: ${line}\n`);
    res.write("\n");
  };

  const heartbeat = setInterval(() => !closed && res.write(": ping\n\n"), 15_000);

  try {
    // Wait for terminal status; poll the log file for new bytes each tick.
    for (;;) {
      if (closed) break;
      try {
        const fh = await fs.open(logPath, "r");
        const st = await fh.stat();
        if (st.size > offset) {
          const buf = Buffer.alloc(st.size - offset);
          await fh.read(buf, 0, buf.length, offset);
          offset = st.size;
          send("log", buf.toString("utf8"));
        }
        await fh.close();
      } catch {
        /* log not created yet */
      }

      const rec = await readBuildRecord(id);
      const target = rec?.targets.find((t) => t.firmware === fw);
      if (target && (target.status === "success" || target.status === "error")) {
        // One last read to flush any tail bytes.
        try {
          const fh = await fs.open(logPath, "r");
          const st = await fh.stat();
          if (st.size > offset) {
            const buf = Buffer.alloc(st.size - offset);
            await fh.read(buf, 0, buf.length, offset);
            send("log", buf.toString("utf8"));
          }
          await fh.close();
        } catch {
          /* ignore */
        }
        send("status", JSON.stringify(target));
        send("end", target.status);
        break;
      }
      await new Promise((r) => setTimeout(r, 700));
    }
  } finally {
    clearInterval(heartbeat);
    if (!closed) res.end();
  }
}
