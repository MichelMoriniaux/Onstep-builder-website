#!/usr/bin/env bash
# Install Arduino libraries from a manifest into the arduino-cli user libraries dir.
# Run at IMAGE BUILD time (needs network). See libraries.*.txt for the format.
set -euo pipefail

USERLIBS="$(arduino-cli config get directories.user)/libraries"
mkdir -p "$USERLIBS"

install_manifest() {
  local manifest="$1"
  echo "==> Installing libraries from ${manifest}"
  # Strip comments/blank lines, then process each entry.
  grep -vE '^\s*(#|$)' "$manifest" | while read -r kind a b c; do
    case "$kind" in
      git)
        # a=folder name, b=url, c=optional ref (tag/branch/commit)
        local dest="${USERLIBS}/${a}"
        if [ -d "$dest" ]; then
          echo "    [skip] ${a} already present"
          continue
        fi
        if [ -n "${c:-}" ]; then
          echo "    [git]  ${a} <- ${b} @ ${c}"
          # --branch accepts tags and branches; fall back to fetch+checkout for bare commits.
          if ! git clone --depth 1 --branch "$c" "$b" "$dest" 2>/dev/null; then
            git clone "$b" "$dest"
            git -C "$dest" checkout "$c"
          fi
        else
          echo "    [git]  ${a} <- ${b}"
          git clone --depth 1 "$b" "$dest"
        fi
        rm -rf "${dest}/.git"
        ;;
      lib)
        # a=name[@version]  (Library Manager name, no spaces in our manifests)
        echo "    [lib]  ${a}"
        arduino-cli lib install "$a" >/dev/null
        ;;
      *)
        echo "    [warn] unrecognized manifest line: ${kind} ${a} ${b} ${c}" >&2
        ;;
    esac
  done
}

for m in "$@"; do
  install_manifest "$m"
done

echo "==> Installed libraries:"
ls -1 "$USERLIBS"
