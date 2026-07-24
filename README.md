# Firmware Builder for JTW mounts

A self-service website that compiles **OnStepX** and **SmartWebServer** firmware for the
ESP32 on demand. Upload your `Config.h` (+ optional `Extended.config.h` / `Plugins.config.h`),
optionally pin a git ref of the source, and download the resulting `.bin` files with a live
build log. Each build runs the same `arduino-cli` engine the GitHub Actions use, inside an
isolated, resource-limited Docker container.

Inspired by the workflows in
[MichelMoriniaux/Trident-GTR-Auto](https://github.com/MichelMoriniaux/Trident-GTR-Auto).

## Config sources

The UI offers two ways to supply the configuration:

1. **Upload configs** — bring your own `Config.h` / `Extended.config.h` / `Plugins.config.h`.
2. **Configure a JTW mount** — a wizard (extended from the
   [JTW-Trident-Mounts generator](https://github.com/MichelMoriniaux/JTW-Trident-Mounts/tree/main/generator))
   that generates OnStepX + SmartWebServer configs from a set of options. This is specific to
   **JTW Trident / P75 mounts** on the Manticore controller, not generic OnStepX. Options include
   model, encoders, per-axis motor/encoder reversal, the 6 servo PID parameters per axis, PEC,
   homing, Wi-Fi/Ethernet, weather probe and clock source. `POST /api/generate` performs the
   template substitution server-side.

   Configs are **version-targeted** (`VERSIONS` in `packages/shared/src/generator.ts`): each
   firmware version (e.g. `10.28u`, `10.25p`) has its own template set under
   `apps/api/src/generator/templates/<version>/` and its own pinned source refs, which become the
   build's default refs. Generated configs are validated to compile at those refs.

## How a build works

1. Source repos `hjd1964/OnStepX` and `hjd1964/SmartWebServer` (+ `OnStepX-Plugins`) are
   pre-cloned into the runner image.
2. At build time the runner checks out the requested ref, injects the uploaded config files,
   and runs `arduino-cli compile -e --fqbn esp32:esp32:esp32` (ESP32 core **2.0.17**) with the
   firmware's library set.
3. The `.bin` artifacts (`*.ino.bin`, `*.ino.bootloader.bin`, `*.ino.partitions.bin`) are
   collected, zipped, and offered for download. Flash at the standard ESP32 offsets:
   bootloader → `0x1000`, partitions → `0x8000`, app `.ino.bin` → `0x10000`.

## Architecture

```
web (React/Vite + nginx)  →  api (Fastify)  →  Redis / BullMQ  →  worker (dockerode)
                                                                     │
                                                        docker run onstep-builder-runner
```

| Component        | Path            | Role                                                   |
| ---------------- | --------------- | ------------------------------------------------------ |
| `runner/`        | Docker image    | arduino-cli + ESP32 core + libs + source caches        |
| `apps/api`       | `@onstep/api`   | uploads, validation, queue producer, SSE log, download |
| `apps/worker`    | `@onstep/worker`| BullMQ consumer, spawns runner containers, zips output |
| `apps/web`       | `@onstep/web`   | React SPA                                               |
| `packages/shared`| `@onstep/shared`| shared TS types & constants                            |

Per-build state lives under `data/jobs/<id>/<firmware>/{in,out}`.

## Prerequisites

- Docker
- Node.js 20+
- Build the runner image once (takes a few minutes — downloads the ESP32 core + libraries):
  ```
  docker build -t onstep-builder-runner ./runner
  ```

## Run locally (host dev)

Recommended on Windows/macOS, where the worker runs on the host so runner bind mounts resolve
to real host paths.

```bash
npm install
npm run build --workspace @onstep/shared    # build shared types once

# 1) Redis
docker run -d --name onstep-redis -p 6379:6379 redis:7-alpine

# 2) API           (http://localhost:8080)
DATA_DIR=./data npm run dev:api

# 3) Worker        (spawns runner containers)
DATA_DIR=./data RUNNER_IMAGE=onstep-builder-runner npm run dev:worker

# 4) Web           (http://localhost:5173, proxies /api → 8080)
npm run dev:web
```

Open http://localhost:5173, pick a firmware, upload `Config.h`, and build.

## Run with docker-compose (single Linux host)

```bash
cp .env.example .env
# set HOST_DATA_DIR to the ABSOLUTE host path of ./data (required — see note below)
docker build -t onstep-builder-runner ./runner
docker compose up --build
# web UI on http://localhost:${WEB_PORT:-8088}
```

**Why `HOST_DATA_DIR`?** The worker asks the host Docker daemon to launch each runner as a
*sibling* container, so the runner's bind-mount sources must be paths the daemon sees on the
host — not the worker's internal `/app/data`. `HOST_DATA_DIR` supplies that host path. This is
clean on a Linux host; on Docker Desktop for Windows/macOS prefer the host-dev flow above.

## Configuration

| Env var             | Default                 | Used by | Purpose                                   |
| ------------------- | ----------------------- | ------- | ----------------------------------------- |
| `PORT`              | `8080`                  | api     | API listen port                           |
| `DATA_DIR`          | `./data`                | api/wk  | root of per-job working dirs              |
| `REDIS_URL`         | `redis://localhost:6379`| api/wk  | queue backend                             |
| `MAX_CONFIG_BYTES`  | `262144`                | api     | per-file upload cap (256 KB)              |
| `RATE_LIMIT_MAX`    | `20`                    | api     | build submissions per window per IP       |
| `JOBS_HOST_DIR`     | = `DATA_DIR`            | worker  | host path for runner bind mounts          |
| `RUNNER_IMAGE`      | `onstep-builder-runner` | worker  | image spawned per build                   |
| `WORKER_CONCURRENCY`| `2`                     | worker  | concurrent builds                         |
| `BUILD_TIMEOUT_MS`  | `900000`                | worker  | per-build hard timeout (15 min)           |
| `BUILD_MEMORY_MB`   | `2048`                  | worker  | runner memory cap                         |
| `BUILD_CPUS`        | `2`                     | worker  | runner CPU cap                            |
| `ARTIFACT_TTL_HOURS`| `24`                    | worker  | job dirs are swept after this age         |

## Security notes & hardening TODOs

- Builds run **non-root** (`uid 10001`), with `CapDrop: ALL`, `no-new-privileges`, and
  memory/CPU/pids/time limits, in a container with a tmpfs scratch.
- Abuse protection for the open (no-auth) v1: per-IP rate limit, queue concurrency cap,
  256 KB per-file upload cap, artifact TTL cleanup.
- **TODO (hardening):** the runner currently has network access for the source `git fetch`.
  A two-phase design (networked clone on the worker, then a `--network=none` compile) would
  remove egress from the compile step. Read-only rootfs is likewise a future step.

## Notes

- The ESP32 core 2.0.17 with `-e` does **not** emit a single `*.merged.bin`; individual
  `.bin` files (+ a per-firmware zip) are provided instead.
- If a build fails on config validation (e.g. an obsolete setting for the chosen ref), the
  errors appear in the live log — pin the ref your config was written for.
