import type { BuildRecord, FirmwareTarget } from "@onstep/shared";

export interface TargetInput {
  firmware: FirmwareTarget;
  ref: string;
  pluginsRef: string;
  files: Map<string, File>; // canonical name -> File
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
  }
  const res = await fetch("/api/builds", { method: "POST", body: fd });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `submit failed (${res.status})`);
  }
  return (await res.json()).id as string;
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
