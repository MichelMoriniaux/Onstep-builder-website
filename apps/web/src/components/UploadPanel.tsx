import { useMemo, useState } from "react";
import { FIRMWARES, FirmwareTarget, LIMITS, REQUIRED_CONFIG_FILE } from "@onstep/shared";
import { emptyFirmwareState, FirmwareCard, FirmwareFormState } from "./FirmwareCard.js";
import { TargetInput } from "../api.js";

interface Props {
  onBuild: (targets: TargetInput[]) => Promise<void>;
}

export function UploadPanel({ onBuild }: Props) {
  const [enabled, setEnabled] = useState<Record<FirmwareTarget, boolean>>({
    onstepx: true,
    sws: false,
  });
  const [forms, setForms] = useState<Record<FirmwareTarget, FirmwareFormState>>({
    onstepx: emptyFirmwareState(),
    sws: emptyFirmwareState(),
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = FIRMWARES.filter((f) => enabled[f]);

  const validation = useMemo(() => {
    if (selected.length === 0) return "Select at least one firmware to build.";
    for (const fw of selected) {
      const files = forms[fw].files;
      if (!files[REQUIRED_CONFIG_FILE]) return `${fw}: ${REQUIRED_CONFIG_FILE} is required.`;
      for (const f of Object.values(files)) {
        if (f && f.size > LIMITS.maxConfigBytes) return `${f.name} exceeds ${LIMITS.maxConfigBytes / 1024} KB.`;
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
        return { firmware: fw, ref: forms[fw].ref.trim(), pluginsRef: forms[fw].pluginsRef.trim(), files };
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
      {FIRMWARES.map((fw) => (
        <FirmwareCard
          key={fw}
          firmware={fw}
          enabled={enabled[fw]}
          onToggle={(v) => setEnabled((e) => ({ ...e, [fw]: v }))}
          state={forms[fw]}
          onChange={(s) => setForms((f) => ({ ...f, [fw]: s }))}
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
        Leave a ref blank to build the latest <span className="font-mono">main</span>. Configs are
        limited to {LIMITS.maxConfigBytes / 1024} KB each.
      </p>
    </div>
  );
}
