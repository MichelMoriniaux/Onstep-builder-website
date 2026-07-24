import { useState } from "react";
import { BuildView } from "./components/BuildView.js";
import { UploadPanel } from "./components/UploadPanel.js";
import { GeneratePanel } from "./components/GeneratePanel.js";
import { submitBuild, TargetInput } from "./api.js";

type Mode = "upload" | "generate";

export default function App() {
  const [mode, setMode] = useState<Mode>("upload");
  const [buildId, setBuildId] = useState<string | null>(null);

  // Shared by both panels: submit and switch to the live build view.
  async function startBuild(targets: TargetInput[]) {
    const id = await submitBuild(targets);
    setBuildId(id);
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">🔭 Firmware Builder for JTW mounts</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Upload your configs or configure a JTW mount, pin a source ref, and compile OnStepX /
            SmartWebServer firmware for the ESP32 — built in an isolated container, ready to flash.
          </p>
        </header>

        {buildId ? (
          <BuildView buildId={buildId} onReset={() => setBuildId(null)} />
        ) : (
          <>
            <ModeToggle mode={mode} onChange={setMode} />
            {mode === "upload" ? (
              <UploadPanel onBuild={startBuild} />
            ) : (
              <GeneratePanel onBuild={startBuild} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ModeToggle({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  const tab = (m: Mode, label: string, sub: string) => (
    <button
      onClick={() => onChange(m)}
      className={`flex-1 rounded-lg px-4 py-3 text-left transition border ${
        mode === m
          ? "border-brand-500 bg-white dark:bg-slate-800 shadow-sm"
          : "border-transparent bg-slate-200/60 dark:bg-slate-800/40 hover:bg-slate-200 dark:hover:bg-slate-800"
      }`}
    >
      <div className="font-semibold">{label}</div>
      <div className="text-xs text-slate-500">{sub}</div>
    </button>
  );
  return (
    <div className="flex gap-3 mb-6">
      {tab("upload", "Upload configs", "Bring your own Config.h files")}
      {tab("generate", "Configure a JTW mount", "Generate configs from options")}
    </div>
  );
}
