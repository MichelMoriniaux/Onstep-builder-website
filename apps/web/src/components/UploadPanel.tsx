import { useMemo, useState } from "react";
import {
  DEFAULT_VERSION,
  FIRMWARES,
  FirmwareTarget,
  LIMITS,
  MountVersion,
  REQUIRED_CONFIG_FILE,
  VERSION_LIST,
  VERSIONS,
} from "@onstep/shared";
import { emptyFirmwareState, FirmwareCard, FirmwareFormState } from "./FirmwareCard.js";
import { TargetInput } from "../api.js";

interface Props {
  onBuild: (targets: TargetInput[]) => Promise<void>;
}

/** Firmware version selector: the two pinned versions, "latest" (HEAD), or free-form refs. */
type UploadVersion = MountVersion | "latest" | "custom";

/** Refs a version implies for each repo. "latest" => "" (runner builds the default branch/HEAD). */
function refsForVersion(v: UploadVersion): { onstepx: string; sws: string; plugins: string } {
  if (v === "latest" || v === "custom") return { onstepx: "", sws: "", plugins: "" };
  return { onstepx: VERSIONS[v].onstepx, sws: VERSIONS[v].sws, plugins: VERSIONS[v].plugins };
}

export function UploadPanel({ onBuild }: Props) {
  const [enabled, setEnabled] = useState<Record<FirmwareTarget, boolean>>({
    onstepx: true,
    sws: false,
  });
  const [version, setVersion] = useState<UploadVersion>(DEFAULT_VERSION);
  const [forms, setForms] = useState<Record<FirmwareTarget, FirmwareFormState>>(() => {
    const r = refsForVersion(DEFAULT_VERSION);
    return {
      onstepx: { ...emptyFirmwareState(), ref: r.onstepx, pluginsRef: r.plugins },
      sws: { ...emptyFirmwareState(), ref: r.sws },
    };
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = FIRMWARES.filter((f) => enabled[f]);
  const refsLocked = version !== "custom";

  // Switch version: pinned/latest overwrite the refs (and lock them); "custom"
  // leaves whatever refs are present and unlocks the fields for editing.
  function changeVersion(v: UploadVersion) {
    setVersion(v);
    if (v === "custom") return;
    const r = refsForVersion(v);
    setForms((f) => ({
      onstepx: { ...f.onstepx, ref: r.onstepx, pluginsRef: r.plugins },
      sws: { ...f.sws, ref: r.sws },
    }));
  }

  const validation = useMemo(() => {
    if (selected.length === 0) return "Select at least one firmware to build.";
    for (const fw of selected) {
      const files = forms[fw].files;
      if (!files[REQUIRED_CONFIG_FILE]) return `${fw}: ${REQUIRED_CONFIG_FILE} is required.`;
      for (const f of Object.values(files)) {
        if (f && f.size > LIMITS.maxConfigBytes) return `${f.name} exceeds ${LIMITS.maxConfigBytes / 1024} KB.`;
      }
      for (const p of [...forms[fw].patches, ...forms[fw].pluginsPatches]) {
        if (p.size > LIMITS.maxPatchBytes) return `${p.name} exceeds ${LIMITS.maxPatchBytes / 1024} KB.`;
      }
    }
    return null;
  }, [selected, forms]);

  async function submit() {
    setError(null);
    setSubmitting(true);
    try {
      const targets: TargetInput[] = selected.map((fw) => {
        const files = new Map<string, File>();
        for (const [name, file] of Object.entries(forms[fw].files)) if (file) files.set(name, file);
        return {
          firmware: fw,
          ref: forms[fw].ref.trim(),
          pluginsRef: forms[fw].pluginsRef.trim(),
          files,
          patches: forms[fw].patches,
          pluginsPatches: forms[fw].pluginsPatches,
        };
      });
      await onBuild(targets);
    } catch (e) {
      setError(String((e as Error).message));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 p-4">
        <label className="block">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Firmware version
          </span>
          <select
            value={version}
            onChange={(e) => changeVersion(e.target.value as UploadVersion)}
            className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
          >
            {VERSION_LIST.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
            <option value="latest">latest (HEAD of all repos)</option>
            <option value="custom">custom (enter refs manually)</option>
          </select>
          <span className="mt-1 block text-xs text-slate-500">
            {version === "custom"
              ? "Enter a commit / tag / branch per repo below."
              : version === "latest"
              ? "Builds the default branch (main / HEAD) of each source repo."
              : "Git refs are pinned to this version's source commits (shown below, read-only)."}
          </span>
        </label>
      </div>

      {FIRMWARES.map((fw) => (
        <FirmwareCard
          key={fw}
          firmware={fw}
          enabled={enabled[fw]}
          onToggle={(v) => setEnabled((e) => ({ ...e, [fw]: v }))}
          state={forms[fw]}
          onChange={(s) => setForms((f) => ({ ...f, [fw]: s }))}
          refsLocked={refsLocked}
        />
      ))}

      {(error || validation) && (
        <div className="text-sm text-red-600 dark:text-red-400">{error ?? validation}</div>
      )}

      <button
        disabled={!!validation || submitting}
        onClick={submit}
        className="w-full rounded-lg bg-brand-600 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        {submitting ? "Submitting…" : "Build firmware"}
      </button>

      <p className="text-center text-xs text-slate-500">
        Configs are limited to {LIMITS.maxConfigBytes / 1024} KB each.
      </p>
    </div>
  );
}
