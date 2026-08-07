import { useEffect, useState } from "react";
import {
  DEFAULT_ANSWERS,
  FIRMWARE_LABELS,
  FirmwareTarget,
  GeneratorAnswers,
  VERSIONS,
  wifiNeedsPlugin,
} from "@onstep/shared";
import { GeneratorWizard } from "./GeneratorWizard.js";
import { PatchUpload } from "./PatchUpload.js";
import { generateConfigs, TargetInput } from "../api.js";
import { highlightC } from "../highlight.js";

interface Props {
  onBuild: (targets: TargetInput[]) => Promise<void>;
}

const fileFrom = (content: string, name: string) =>
  new File([content], name, { type: "text/plain" });

/** Files produced by generation, in display/build order. Plugins only when Wi-Fi is on. */
const genFiles = (wifi: boolean): { fw: FirmwareTarget; name: string }[] => [
  { fw: "onstepx", name: "Config.h" },
  { fw: "onstepx", name: "Extended.config.h" },
  ...(wifi ? [{ fw: "onstepx" as FirmwareTarget, name: "Plugins.config.h" }] : []),
  { fw: "sws", name: "Config.h" },
  { fw: "sws", name: "Extended.config.h" },
];

const keyOf = (fw: FirmwareTarget, name: string) => `${fw}:${name}`;

function downloadText(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function GeneratePanel({ onBuild }: Props) {
  const [answers, setAnswers] = useState<GeneratorAnswers>({ ...DEFAULT_ANSWERS });
  const [hasGenerated, setHasGenerated] = useState(false);
  // Editable content, keyed by "<firmware>:<filename>".
  const [content, setContent] = useState<Record<string, string>>({});
  const [build, setBuild] = useState<Record<FirmwareTarget, boolean>>({ onstepx: true, sws: true });
  const [patches, setPatches] = useState<Record<FirmwareTarget, File[]>>({ onstepx: [], sws: [] });
  const [pluginsPatches, setPluginsPatches] = useState<File[]>([]); // OnStepX-Plugins patches
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
    setHasGenerated(false); // any wizard change invalidates the generated files
    setContent({});
  };

  async function generate() {
    setError(null);
    setBusy(true);
    try {
      const gen = await generateConfigs(answers);
      setContent({
        "onstepx:Config.h": gen.onstepx["Config.h"],
        "onstepx:Extended.config.h": gen.onstepx["Extended.config.h"],
        "onstepx:Plugins.config.h": gen.onstepx["Plugins.config.h"],
        "sws:Config.h": gen.sws["Config.h"],
        "sws:Extended.config.h": gen.sws["Extended.config.h"],
      });
      setHasGenerated(true);
    } catch (e) {
      setError(String((e as Error).message));
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (!hasGenerated) return;
    setError(null);
    setBusy(true);
    try {
      const targets: TargetInput[] = [];
      if (build.onstepx) {
        const oxFiles = new Map<string, File>([
          ["Config.h", fileFrom(content["onstepx:Config.h"], "Config.h")],
          ["Extended.config.h", fileFrom(content["onstepx:Extended.config.h"], "Extended.config.h")],
        ]);
        // Wi-Fi on → include the (possibly edited) website plugin config.
        if (wifiNeedsPlugin(answers)) {
          oxFiles.set("Plugins.config.h", fileFrom(content["onstepx:Plugins.config.h"], "Plugins.config.h"));
        }
        targets.push({ firmware: "onstepx", ref: refs.onstepx.trim(), pluginsRef: refs.plugins.trim(), files: oxFiles, patches: patches.onstepx, pluginsPatches });
      }
      if (build.sws) {
        targets.push({
          firmware: "sws",
          ref: refs.sws.trim(),
          pluginsRef: "",
          files: new Map([
            ["Config.h", fileFrom(content["sws:Config.h"], "Config.h")],
            ["Extended.config.h", fileFrom(content["sws:Extended.config.h"], "Extended.config.h")],
          ]),
          patches: patches.sws,
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
        {busy && !hasGenerated ? "Generating…" : hasGenerated ? "Regenerate configuration" : "Generate configuration"}
      </button>

      {hasGenerated && (
        <>
          <div className="space-y-2">
            <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Generated files — expand to view, edit, or download. Edits are used for the build.
            </div>
            {genFiles(wifiNeedsPlugin(answers)).map((f) => {
              const k = keyOf(f.fw, f.name);
              return (
                <FileEditor
                  key={k}
                  label={`${FIRMWARE_LABELS[f.fw]} / ${f.name}`}
                  downloadName={`${f.fw}-${f.name}`}
                  value={content[k] ?? ""}
                  onChange={(v) => setContent((c) => ({ ...c, [k]: v }))}
                />
              );
            })}
          </div>

          <div className="space-y-4">
            <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Build</div>
            {(["onstepx", "sws"] as FirmwareTarget[]).map((fw) => (
              <div
                key={fw}
                className={`rounded-xl border p-4 space-y-3 transition ${
                  build[fw]
                    ? "border-brand-500 bg-white dark:bg-slate-800/60"
                    : "border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/20"
                }`}
              >
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-brand-600"
                    checked={build[fw]}
                    onChange={(e) => setBuild((b) => ({ ...b, [fw]: e.target.checked }))}
                  />
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {FIRMWARE_LABELS[fw]}
                  </span>
                </label>

                <details className="text-sm">
                  <summary className="cursor-pointer text-slate-500">
                    Advanced: source refs &amp; patches
                    {(() => {
                      const count = patches[fw].length + (fw === "onstepx" ? pluginsPatches.length : 0);
                      return count > 0 ? (
                        <span className="ml-2 text-xs text-slate-400">
                          ({count} patch{count > 1 ? "es" : ""})
                        </span>
                      ) : null;
                    })()}
                  </summary>
                  <div className="mt-3 space-y-4">
                    <div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {fw === "onstepx" ? (
                          <>
                            <RefField label="OnStepX ref" value={refs.onstepx} onChange={(v) => updateRef("onstepx", v)} />
                            <RefField label="Plugins ref" value={refs.plugins} onChange={(v) => updateRef("plugins", v)} />
                          </>
                        ) : (
                          <RefField label="SWS ref" value={refs.sws} onChange={(v) => updateRef("sws", v)} />
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        Refs are pinned to the source commits for version{" "}
                        <span className="font-mono">{answers.version}</span>.
                      </p>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                        {FIRMWARE_LABELS[fw]} source patches
                      </div>
                      <PatchUpload
                        patches={patches[fw]}
                        onChange={(p) => setPatches((s) => ({ ...s, [fw]: p }))}
                      />
                    </div>
                    {fw === "onstepx" && (
                      <div>
                        <div className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                          OnStepX-Plugins patches
                        </div>
                        <PatchUpload patches={pluginsPatches} onChange={setPluginsPatches} />
                      </div>
                    )}
                  </div>
                </details>
              </div>
            ))}
          </div>
        </>
      )}

      {error && <div className="text-sm text-red-600 dark:text-red-400">{error}</div>}

      <button
        onClick={submit}
        disabled={!hasGenerated || busy}
        className="w-full rounded-lg bg-brand-600 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        {busy && hasGenerated ? "Submitting…" : "Build firmware"}
      </button>
      {!hasGenerated && (
        <p className="text-center text-xs text-slate-500">Generate the configuration first, then build.</p>
      )}
    </div>
  );
}

function FileEditor({
  label,
  downloadName,
  value,
  onChange,
}: {
  label: string;
  downloadName: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  return (
    <details className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
      <summary className="cursor-pointer px-3 py-2 bg-slate-50 dark:bg-slate-800/60 text-sm font-mono flex justify-between items-center">
        <span>{label}</span>
        <span className="text-slate-400">{(value.length / 1024).toFixed(1)} KB</span>
      </summary>
      <div className="flex items-center gap-2 px-3 py-2 border-t border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40">
        <button
          type="button"
          onClick={() => setEditing((e) => !e)}
          className="rounded-md bg-slate-200 dark:bg-slate-700 px-2.5 py-1 text-xs font-medium hover:bg-slate-300 dark:hover:bg-slate-600"
        >
          {editing ? "View" : "Edit"}
        </button>
        <button
          type="button"
          onClick={() => downloadText(downloadName, value)}
          className="rounded-md bg-slate-200 dark:bg-slate-700 px-2.5 py-1 text-xs font-medium hover:bg-slate-300 dark:hover:bg-slate-600"
        >
          Download
        </button>
        {editing && <span className="text-xs text-amber-600 dark:text-amber-400">editing</span>}
      </div>
      {editing ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          className="w-full h-80 bg-slate-900 text-slate-100 text-xs font-mono p-4 outline-none resize-y"
        />
      ) : (
        <pre className="max-h-80 overflow-auto bg-slate-900 text-slate-100 text-xs font-mono p-4">
          <code dangerouslySetInnerHTML={{ __html: highlightC(value) }} />
        </pre>
      )}
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
