// Copy the generator templates next to the compiled output so generate.ts can
// resolve them at runtime (tsc does not emit non-.ts assets).
import { cp, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

// scripts/ -> ".." is the api workspace root (apps/api).
const root = fileURLToPath(new URL("..", import.meta.url));
const src = path.join(root, "src", "generator", "templates");
const dest = path.join(root, "dist", "generator", "templates");

await mkdir(dest, { recursive: true });
await cp(src, dest, { recursive: true });
console.log(`copied templates -> ${dest}`);
