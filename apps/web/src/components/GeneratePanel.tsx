import { useEffect, useState } from "react";
import {
  DEFAULT_ANSWERS,
  FIRMWARE_LABELS,
  FirmwareTarget,
  GeneratedFiles,
  GeneratorAnswers,
  VERSIONS,
  wifiNeedsPlugin,
} from "@onstep/shared";
import { GeneratorWizard } from "./GeneratorWizard.js";
import { generateConfigs, TargetInput } from "../api.js";
import { highlightC } from "../highlight.js";

interface Props {
  onBuild: (targets: TargetInput[]) => Promise<void>;
}

const fileFrom = (content: string, name: string) =>
  new File([content], name, { type: "text/plain" });

export function GeneratePanel({ onBuild }: Props) {
  const [answers, setAnswers] = useState<GeneratorAnswers>({ ...DEFAULT_ANSWERS });
  const [generated, setGenerated] = useState<GeneratedFiles | null>(null);
  const [build, setBuild] = useState<Record<FirmwareTarget, boolean>>({ onstepx: true, sws: true });
  const [refs, setRefs] = useState<{ onstepx: string; sws: string; plugins: string }>({
    ...VERSIONS[DEFAULT_ANSWERS.version],
  });
  const [refsTouched, setRefsTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep refs in sync with the selected version unless the user overrode them.
  useEffect(() => {
    if (!refsTouched) setRefs({ ...VERSIONS[answers.version] });
  }, [answers.version, refsTouched]);

  const changeAnswers = (a: GeneratorAnswers) => {
    setAnswers(a);
    setGenerated(null); // any change invalidates the preview
  };

  async function generate() {
    setError(null);
    setBusy(true);
    try {
      setGenerated(await generateConfigs(answers));
    } catch (e) {
      setError(String((e as Error).message));
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (!generated) return;
    setError(null);
    setBusy(true);
    try {
      const targets: TargetInput[] = [];
      if (build.onstepx) {
        const oxFiles = new Map<string, File>([
          ["Config.h", fileFrom(generated.onstepx["Config.h"], "Config.h")],
        ]);
        // Wi-Fi on → include the website plugin config so the build pulls in the plugin.
        if (wifiNeedsPlugin(answers)) {
          oxFiles.set("Plugins.config.h", fileFrom(generated.onstepx["Plugins.config.h"], "Plugins.config.h"));
        }
        targets.push({
          firmware: "onstepx",
          ref: refs.onstepx.trim(),
          pluginsRef: refs.plugins.trim(),
          files: oxFiles,
        });
      }
      if (build.sws) {
        targets.push({
          firmware: "sws",
          ref: refs.sws.trim(),
          pluginsRef: "",
          files: new Map([
            ["Config.h", fileFrom(generated.sws["Config.h"], "Config.h")],
            ["Extended.config.h", fileFrom(generated.sws["Extended.config.h"], "Extended.config.h")],
          ]),
        });
      }
      if (targets.length === 0) {
        setError("Select at least one firmware to build.");
        return;
      }
      await onBuild(targets);
    } catch (e) {
      setError(String((e as Error).message));
    } finally {
      setBusy(false);
    }
  }

  const updateRef = (k: "onstepx" | "sws" | "plugins", v: string) => {
    setRefsTouched(true);
    setRefs((r) => ({ ...r, [k]: v }));
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-amber-300/60 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700/50 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
        This wizard generates configuration files for <strong>JTW Trident GTR / P75 mounts</strong> on
        the Manticore controller - not generic OnStepX mounts. It produces OnStepX{" "}
        <code>Config.h</code> plus SmartWebServer <code>Config.h</code> and{" "}
        <code>Extended.config.h</code>.
      </div>

      <GeneratorWizard answers={answers} onChange={changeAnswers} />

      <button
        onClick={generate}
        disabled={busy}
        className="w-full rounded-lg border border-brand-600 text-brand-700 dark:text-brand-500 py-2.5 font-semibold hover:bg-brand-50 dark:hover:bg-slate-800 disabled:opacity-40 transition"
      >
        {busy && !generated ? "Generating…" : generated ? "Regenerate configuration" : "Generate configuration"}
      </button>

      {generated && (
        <>
          <div className="space-y-2">
            <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Generated files (preview)
            </div>
            <Preview name="OnStepX / Config.h" content={generated.onstepx["Config.h"]} />
            {wifiNeedsPlugin(answers) && (
              <Preview name="OnStepX / Plugins.config.h" content={generated.onstepx["Plugins.config.h"]} />
            )}
            <Preview name="SmartWebServer / Config.h" content={generated.sws["Config.h"]} />
            <Preview name="SmartWebServer / Extended.config.h" content={generated.sws["Extended.config.h"]} />
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-4">
            <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Build</div>
            <div className="flex flex-wrap gap-4">
              {(["onstepx", "sws"] as FirmwareTarget[]).map((fw) => (
                <label key={fw} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-brand-600"
                    checked={build[fw]}
                    onChange={(e) => setBuild((b) => ({ ...b, [fw]: e.target.checked }))}
                  />
                  {FIRMWARE_LABELS[fw]}
                </label>
              ))}
            </div>
            <details className="text-sm">
              <summary className="cursor-pointer text-slate-500">
                Advanced: source refs (version {answers.version})
              </summary>
              <div className="mt-2 grid sm:grid-cols-3 gap-3">
                <RefField label="OnStepX ref" value={refs.onstepx} onChange={(v) => updateRef("onstepx", v)} />
                <RefField label="SWS ref" value={refs.sws} onChange={(v) => updateRef("sws", v)} />
                <RefField label="Plugins ref" value={refs.plugins} onChange={(v) => updateRef("plugins", v)} />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Refs are pinned to the source commits for version{" "}
                <span className="font-mono">{answers.version}</span>. The generated config is
                validated to compile at these.
              </p>
            </details>
          </div>
        </>
      )}

      {error && <div className="text-sm text-red-600 dark:text-red-400">{error}</div>}

      <button
        onClick={submit}
        disabled={!generated || busy}
        className="w-full rounded-lg bg-brand-600 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        {busy && generated ? "Submitting…" : "Build firmware"}
      </button>
      {!generated && (
        <p className="text-center text-xs text-slate-500">Generate the configuration first, then build.</p>
      )}
    </div>
  );
}

function Preview({ name, content }: { name: string; content: string }) {
  return (
    <details className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
      <summary className="cursor-pointer px-3 py-2 bg-slate-50 dark:bg-slate-800/60 text-sm font-mono flex justify-between">
        <span>{name}</span>
        <span className="text-slate-400">{(content.length / 1024).toFixed(1)} KB</span>
      </summary>
      <pre className="max-h-72 overflow-auto bg-slate-900 text-slate-100 text-xs font-mono p-4">
        <code dangerouslySetInnerHTML={{ __html: highlightC(content) }} />
      </pre>
    </details>
  );
}

function RefField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs font-mono focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
      />
    </label>
  );
}
