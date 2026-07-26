import { ReactNode, useEffect, useRef, useState } from "react";
import {
  ArtifactInfo,
  BuildRecord,
  FIRMWARE_LABELS,
  FirmwareTarget,
  TargetResult,
  TargetStatus,
} from "@onstep/shared";
import { artifactUrl, getBuild, logStreamUrl } from "../api.js";

interface Props {
  buildId: string;
  onReset: () => void;
}

export function BuildView({ buildId, onReset }: Props) {
  const [record, setRecord] = useState<BuildRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const rec = await getBuild(buildId);
        if (!alive) return;
        setRecord(rec);
        if (rec.status === "queued" || rec.status === "running") {
          timer = setTimeout(poll, 1500);
        }
      } catch (e) {
        if (alive) setError(String((e as Error).message));
      }
    };
    poll();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [buildId]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
            Build <span className="font-mono text-brand-600">{buildId}</span>
          </h2>
          {record && <OverallBadge status={record.status} />}
        </div>
        <button
          onClick={onReset}
          className="rounded-md border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          New build
        </button>
      </div>

      {error && <div className="text-red-500 text-sm">{error}</div>}

      {record?.targets.map((t) => (
        <TargetPanel key={t.firmware} buildId={buildId} target={t} />
      ))}
    </div>
  );
}

function TargetPanel({ buildId, target }: { buildId: string; target: TargetResult }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/60">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-800 dark:text-slate-100">
            {FIRMWARE_LABELS[target.firmware]}
          </span>
          <StatusBadge status={target.status} />
          <span className="font-mono text-xs text-slate-500">@ {target.ref}</span>
        </div>
      </div>

      <LogViewer buildId={buildId} firmware={target.firmware} status={target.status} />

      {target.message && (
        <div
          className={`px-4 py-2 text-sm ${
            target.status === "error"
              ? "text-red-600 dark:text-red-400"
              : "text-slate-500"
          }`}
        >
          {target.message}
        </div>
      )}

      {target.status === "success" && target.artifacts.length > 0 && (
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 space-y-4">
          {(() => {
            const installers = target.artifacts.filter((a) => isInstaller(a.name));
            const binaries = target.artifacts.filter((a) => !isInstaller(a.name));
            return (
              <>
                {installers.length > 0 && (
                  <ArtifactSection
                    title="Firmware installer"
                    hint="Ready-to-run uploader — unzip and launch it to flash your board over USB."
                    artifacts={installers}
                    buildId={buildId}
                    firmware={target.firmware}
                  />
                )}
                {binaries.length > 0 && (
                  <ArtifactSection
                    title="Firmware binaries"
                    artifacts={binaries}
                    buildId={buildId}
                    firmware={target.firmware}
                  >
                    <p className="mt-2 text-xs text-slate-500">
                      Flash with esptool at the standard ESP32 offsets: bootloader → 0x1000,
                      partitions → 0x8000, app <span className="font-mono">.ino.bin</span> → 0x10000.
                    </p>
                  </ArtifactSection>
                )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}

/** Installer artifacts are the prebuilt firmware-uploader zips (see runner/build.sh). */
function isInstaller(name: string): boolean {
  return name.startsWith("JTW.Firmware.Uploader");
}

function ArtifactSection({
  title,
  hint,
  artifacts,
  buildId,
  firmware,
  children,
}: {
  title: string;
  hint?: string;
  artifacts: ArtifactInfo[];
  buildId: string;
  firmware: FirmwareTarget;
  children?: ReactNode;
}) {
  return (
    <div>
      <div className="text-sm font-medium mb-1 text-slate-700 dark:text-slate-200">{title}</div>
      {hint && <p className="mb-2 text-xs text-slate-500">{hint}</p>}
      <div className="flex flex-wrap gap-2">
        {artifacts.map((a) => (
          <a
            key={a.name}
            href={artifactUrl(buildId, firmware, a.name)}
            className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-mono ${
              a.name.endsWith(".zip")
                ? "bg-brand-600 text-white hover:bg-brand-700"
                : "bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600"
            }`}
            download
          >
            {a.name.endsWith(".zip") ? "⬇ " : ""}
            {a.name}
            <span className="opacity-60">{(a.size / 1024).toFixed(0)} KB</span>
          </a>
        ))}
      </div>
      {children}
    </div>
  );
}

function LogViewer({
  buildId,
  firmware,
  status,
}: {
  buildId: string;
  firmware: FirmwareTarget;
  status: TargetStatus;
}) {
  const [text, setText] = useState("");
  const preRef = useRef<HTMLPreElement>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    if (doneRef.current) return;
    const es = new EventSource(logStreamUrl(buildId, firmware));
    es.addEventListener("log", (e) => setText((prev) => prev + (e as MessageEvent).data + "\n"));
    es.addEventListener("end", () => {
      doneRef.current = true;
      es.close();
    });
    es.onerror = () => es.close();
    return () => es.close();
  }, [buildId, firmware]);

  useEffect(() => {
    if (preRef.current) preRef.current.scrollTop = preRef.current.scrollHeight;
  }, [text]);

  const waiting = status === "queued" && !text;

  return (
    <pre
      ref={preRef}
      className="max-h-72 overflow-auto bg-slate-900 text-slate-100 text-xs font-mono p-4 leading-relaxed"
    >
      {waiting ? "Queued — waiting for a build slot…\n" : text || "Starting…\n"}
    </pre>
  );
}

function StatusBadge({ status }: { status: TargetStatus }) {
  const map: Record<TargetStatus, string> = {
    queued: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
    running: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
    success: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
    error: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${map[status]}`}>
      {status === "running" && <span className="animate-pulse">● </span>}
      {status}
    </span>
  );
}

function OverallBadge({ status }: { status: BuildRecord["status"] }) {
  return <div className="mt-1 text-sm text-slate-500">Overall: {status}</div>;
}
