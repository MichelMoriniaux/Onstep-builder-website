import { useRef } from "react";
import {
  ALLOWED_CONFIG_FILES,
  DEFAULT_REFS,
  FIRMWARE_LABELS,
  FirmwareTarget,
  REQUIRED_CONFIG_FILE,
} from "@onstep/shared";

export interface FirmwareFormState {
  files: Record<string, File | undefined>;
  ref: string;
  pluginsRef: string;
}

export const emptyFirmwareState = (): FirmwareFormState => ({
  files: {},
  ref: "",
  pluginsRef: "",
});

interface Props {
  firmware: FirmwareTarget;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  state: FirmwareFormState;
  onChange: (s: FirmwareFormState) => void;
  /** When true the git-ref inputs are prefilled from the chosen version and read-only. */
  refsLocked?: boolean;
}

export function FirmwareCard({ firmware, enabled, onToggle, state, onChange, refsLocked }: Props) {
  const files = ALLOWED_CONFIG_FILES[firmware];
  const defaultRef = DEFAULT_REFS[firmware];

  return (
    <div
      className={`rounded-xl border transition ${
        enabled
          ? "border-brand-500 bg-white dark:bg-slate-800/60 shadow-sm"
          : "border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/20"
      }`}
    >
      <label className="flex items-center gap-3 p-4 cursor-pointer select-none">
        <input
          type="checkbox"
          className="h-5 w-5 accent-brand-600"
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
        />
        <span className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {FIRMWARE_LABELS[firmware]}
        </span>
      </label>

      {enabled && (
        <div className="px-4 pb-4 space-y-4">
          <div className="grid gap-3">
            {files.map((name) => (
              <FileSlot
                key={name}
                label={name}
                required={name === REQUIRED_CONFIG_FILE}
                file={state.files[name]}
                onPick={(f) => onChange({ ...state, files: { ...state.files, [name]: f } })}
              />
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <RefInput
              label="Git ref"
              placeholder={defaultRef}
              hint={`${FIRMWARE_LABELS[firmware]} source commit / tag / branch`}
              value={state.ref}
              disabled={refsLocked}
              onChange={(v) => onChange({ ...state, ref: v })}
            />
            {firmware === "onstepx" && (
              <RefInput
                label="Plugins ref"
                placeholder={DEFAULT_REFS.plugins}
                hint="OnStepX-Plugins commit / tag / branch"
                value={state.pluginsRef}
                disabled={refsLocked}
                onChange={(v) => onChange({ ...state, pluginsRef: v })}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FileSlot({
  label,
  required,
  file,
  onPick,
}: {
  label: string;
  required: boolean;
  file: File | undefined;
  onPick: (f: File | undefined) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 px-3 py-2">
      <div className="min-w-0">
        <div className="font-mono text-sm text-slate-700 dark:text-slate-200">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </div>
        <div className="text-xs text-slate-500 truncate">
          {file ? `${file.name} · ${(file.size / 1024).toFixed(1)} KB` : "no file selected"}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {file && (
          <button
            type="button"
            className="text-xs text-slate-400 hover:text-red-500"
            onClick={() => {
              onPick(undefined);
              if (inputRef.current) inputRef.current.value = "";
            }}
          >
            clear
          </button>
        )}
        <button
          type="button"
          className="text-sm rounded-md bg-slate-100 dark:bg-slate-700 px-3 py-1 hover:bg-slate-200 dark:hover:bg-slate-600"
          onClick={() => inputRef.current?.click()}
        >
          {file ? "Change" : "Choose"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".h"
          className="hidden"
          onChange={(e) => onPick(e.target.files?.[0])}
        />
      </div>
    </div>
  );
}

function RefInput({
  label,
  placeholder,
  hint,
  value,
  disabled,
  onChange,
}: {
  label: string;
  placeholder: string;
  hint: string;
  value: string;
  disabled?: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-800"
      />
      <span className="text-xs text-slate-500">{hint}</span>
    </label>
  );
}
