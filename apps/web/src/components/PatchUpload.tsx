import { useRef } from "react";
import { LIMITS } from "@onstep/shared";

/** Ordered list of patch files for one target, applied with `git apply` in order. */
export function PatchUpload({
  patches,
  onChange,
}: {
  patches: File[];
  onChange: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const add = (picked: FileList | null) => {
    if (!picked || picked.length === 0) return;
    onChange([...patches, ...Array.from(picked)].slice(0, LIMITS.maxPatches));
    if (inputRef.current) inputRef.current.value = "";
  };
  const removeAt = (i: number) => onChange(patches.filter((_, idx) => idx !== i));
  const move = (i: number, delta: number) => {
    const j = i + delta;
    if (j < 0 || j >= patches.length) return;
    const next = [...patches];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-slate-500">
          Applied to the source repo with <span className="font-mono">git apply</span>, in order.
        </span>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="shrink-0 text-sm rounded-md bg-slate-100 dark:bg-slate-700 px-3 py-1 hover:bg-slate-200 dark:hover:bg-slate-600"
        >
          Add patch files
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".patch,.diff"
          multiple
          className="hidden"
          onChange={(e) => add(e.target.files)}
        />
      </div>

      {patches.length === 0 ? (
        <div className="text-xs text-slate-400">No patches — the source is built unmodified.</div>
      ) : (
        <ol className="space-y-1">
          {patches.map((p, i) => (
            <li
              key={`${p.name}-${i}`}
              className="flex items-center justify-between gap-2 rounded-md border border-slate-200 dark:border-slate-700 px-2.5 py-1.5"
            >
              <span className="min-w-0 truncate font-mono text-xs text-slate-700 dark:text-slate-200">
                <span className="text-slate-400 mr-2">{i + 1}.</span>
                {p.name}
                <span className="text-slate-400"> · {(p.size / 1024).toFixed(1)} KB</span>
              </span>
              <span className="flex shrink-0 items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30"
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === patches.length - 1}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30"
                  title="Move down"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  className="text-slate-400 hover:text-red-500"
                >
                  remove
                </button>
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
