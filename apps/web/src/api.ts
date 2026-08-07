import type {
  BuildRecord,
  FirmwareTarget,
  GeneratedFiles,
  GeneratorAnswers,
} from "@onstep/shared";

export interface TargetInput {
  firmware: FirmwareTarget;
  ref: string;
  pluginsRef: string;
  files: Map<string, File>; // canonical name -> File
  patches?: File[]; // applied to the source repo in this order
}

export async function submitBuild(targets: TargetInput[]): Promise<string> {
  const fd = new FormData();
  fd.append(
    "spec",
    JSON.stringify({
      targets: targets.map((t) => ({
        firmware: t.firmware,
        ref: t.ref || undefined,
        pluginsRef: t.pluginsRef || undefined,
      })),
    })
  );
  for (const t of targets) {
    for (const [name, file] of t.files) {
      fd.append(`${t.firmware}:${name}`, file, name);
    }
    // Patches: repeated field, order preserved by FormData + the server.
    for (const p of t.patches ?? []) {
      fd.append(`${t.firmware}:patchfile`, p, p.name);
    }
  }
  const res = await fetch("/api/builds", { method: "POST", body: fd });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `submit failed (${res.status})`);
  }
  return (await res.json()).id as string;
}

export async function generateConfigs(answers: GeneratorAnswers): Promise<GeneratedFiles> {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(answers),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `generate failed (${res.status})`);
  }
  return res.json();
}

export async function getBuild(id: string): Promise<BuildRecord> {
  const res = await fetch(`/api/builds/${id}`);
  if (!res.ok) throw new Error(`build ${id} not found`);
  return res.json();
}

export function artifactUrl(id: string, fw: FirmwareTarget, name: string): string {
  return `/api/builds/${id}/artifacts/${fw}/${encodeURIComponent(name)}`;
}

export function logStreamUrl(id: string, fw: FirmwareTarget): string {
  return `/api/builds/${id}/log?firmware=${fw}`;
}
