#!/usr/bin/env bash
# Runner entrypoint. Compiles one firmware and drops artifacts in /out.
#
# Contract:
#   /in/spec.json   { "firmware": "onstepx"|"sws", "ref": "...", "pluginsRef": "...",
#                     "hasExtended": bool, "hasPlugins": bool }
#   /in/Config.h              (required)
#   /in/Extended.config.h     (optional, when hasExtended)
#   /in/Plugins.config.h      (optional, onstepx + hasPlugins)
#   /out/                     writable; receives artifacts, build.log, result.json
#   $WORK                     writable scratch (default /work); source is built here
#
# Everything printed here is tee'd to /out/build.log by the outer wrapper (main()).
set -uo pipefail

WORK="${WORK:-/work}"
SOURCES="${SOURCES:-/opt/sources}"
mkdir -p "$WORK"
# Keep HOME + git global config inside the writable scratch so a read-only rootfs is fine.
export HOME="$WORK"
export GIT_CONFIG_GLOBAL="${WORK}/.gitconfig"
git config --global --add safe.directory '*' 2>/dev/null || true
FQBN="esp32:esp32:esp32"
FQBN_PATH="esp32.esp32.esp32"   # arduino-cli's on-disk build subdir for the fqbn above

log()  { echo "[$(date -u +%H:%M:%S)] $*"; }
fail() { log "ERROR: $*"; write_result "$1" "error" ; exit 1; }

RUNNER_DIR="${RUNNER_DIR:-/opt/runner}"

# Apply user-supplied patches (from /in/patches/, listed in spec.json "patches")
# to the source repo, in order. Any failure aborts the build.
apply_patches() { # apply_patches <repo dir>
  local dir="$1" list p n=0
  list="$(python3 -c "import json;print('\n'.join(json.load(open('/in/spec.json')).get('patches',[])))" 2>/dev/null)"
  [ -n "$list" ] || return 0
  log "Applying patches to $(basename "$dir") ..."
  while IFS= read -r p; do
    [ -n "$p" ] || continue
    case "$p" in */*|*..*) fail "unsafe patch name '${p}'";; esac
    [ -f "/in/patches/${p}" ] || fail "patch '${p}' listed in spec but not found in /in/patches"
    log "  git apply ${p}"
    git -C "$dir" apply --verbose "/in/patches/${p}" 2>&1 || fail "failed to apply patch '${p}'"
    n=$((n+1))
  done <<EOF
${list}
EOF
  log "Applied ${n} patch(es)."
}

# Read the compiled firmware's version from its sketch (#define FirmwareVersion*)
# -> e.g. "10.28u" (OnStepX) or "2.10h" (SWS). Empty if it can't be parsed.
read_fw_version() { # read_fw_version <sketch path>
  [ -f "$1" ] || return 0
  python3 - "$1" <<'PY'
import re, sys
txt = open(sys.argv[1], encoding="utf-8", errors="replace").read()
def grab(name):
    m = re.search(r'#define\s+' + name + r'\s+(.+)', txt)
    if not m: return ""
    v = re.split(r'\s*//', m.group(1), 1)[0].strip()
    if len(v) >= 2 and v[0] == '"' and v[-1] == '"': v = v[1:-1]
    return v
maj, mi, pa = grab("FirmwareVersionMajor"), grab("FirmwareVersionMinor"), grab("FirmwareVersionPatch")
print(f"{maj}.{mi}{pa}" if maj else "")
PY
}

# Bundle the compiled *.bin files into the matching prebuilt firmware-uploader
# installer, placing them in the installer's bin/ folder and rewriting its
# firmware.xml <version> to the version actually built. Emits the installer zip
# into /out alongside the loose .bin files. Missing template => skipped (non-fatal).
package_installer() { # package_installer <firmware> <version>
  local fw="$1" version="${2:-}" zipsrc zipname folder
  case "$fw" in
    onstepx) zipsrc="${RUNNER_DIR}/JTW.Firmware.Uploader.OnStepX.zip"
             zipname="JTW.Firmware.Uploader.OnStepX.zip"
             folder="JTW Firmware Uploader OnStepX/bin" ;;
    sws)     zipsrc="${RUNNER_DIR}/JTW.Firmware.Uploader.Smart.Web.Server.zip"
             zipname="JTW.Firmware.Uploader.Smart.Web.Server.zip"
             folder="JTW Firmware Uploader Smart Web Server/bin" ;;
    *)       return 0 ;;
  esac
  if [ ! -f "$zipsrc" ]; then
    log "installer template ${zipsrc} not found in image; skipping installer"
    return 0
  fi
  shopt -s nullglob
  local bins=( /out/*.bin )
  shopt -u nullglob
  if [ "${#bins[@]}" -eq 0 ]; then
    log "no .bin files to place in installer; skipping installer"
    return 0
  fi
  # Rebuild the archive: copy every original entry (rewriting firmware.xml's
  # <version> when a version is known) and add the compiled bins. This keeps the
  # installer's own files intact (boot_app0.bin, esptool/, ...).
  python3 - "$zipsrc" "/out/${zipname}" "$folder" "$version" "${bins[@]}" <<'PY' \
    || fail "failed to build installer ${zipname}"
import os, re, sys, zipfile
src, dst, folder, version = sys.argv[1:5]
bins = sys.argv[5:]
xml_path = f"{folder}/firmware.xml"
with zipfile.ZipFile(src, "r") as zin, \
     zipfile.ZipFile(dst, "w", compression=zipfile.ZIP_DEFLATED) as zout:
    for item in zin.infolist():
        data = zin.read(item.filename)
        if version and item.filename == xml_path:
            text = data.decode("utf-8", "replace")
            text = re.sub(r"<version>.*?</version>",
                          f"<version>Firmware Version {version}</version>",
                          text, flags=re.S)
            data = text.encode("utf-8")
        zout.writestr(item, data)
    for b in bins:
        zout.write(b, arcname=f"{folder}/{os.path.basename(b)}")
PY
  log "Built installer ${zipname} (version ${version:-unknown}) with ${#bins[@]} firmware .bin file(s) in '${folder}/'"
}

# --- tiny JSON helpers (no jq dependency at runtime) ---------------------------
spec_get() { # spec_get <key>  -> value (strings/bools/simple only)
  python3 -c "import json,sys;print(json.load(open('/in/spec.json')).get(sys.argv[1],''))" "$1" 2>/dev/null
}

write_result() { # write_result <message> <status>
  local msg="$1" status="$2"
  python3 - "$status" "$msg" <<'PY'
import json, os, sys
status, msg = sys.argv[1], sys.argv[2]
out = "/out"
arts = []
bdir = os.environ.get("ARTDIR", "")
if bdir and os.path.isdir(bdir):
    for f in sorted(os.listdir(bdir)):
        p = os.path.join(bdir, f)
        if os.path.isfile(p):
            arts.append({"name": f, "size": os.path.getsize(p)})
json.dump({"status": status, "message": msg, "artifacts": arts},
          open(os.path.join(out, "result.json"), "w"), indent=2)
PY
}

build() {
  mkdir -p "$WORK" /out
  local firmware ref pluginsRef hasExtended hasPlugins
  firmware="$(spec_get firmware)"
  ref="$(spec_get ref)"
  pluginsRef="$(spec_get pluginsRef)"
  hasExtended="$(spec_get hasExtended)"
  hasPlugins="$(spec_get hasPlugins)"

  [ -f /in/Config.h ] || fail "Config.h is required but was not provided"

  # Defense in depth: refs are validated by the API, but never let a ref be
  # interpreted as a git option (leading '-') or contain unexpected characters.
  for r in "$ref" "$pluginsRef"; do
    case "$r" in
      "" ) : ;;
      -* ) fail "invalid ref '${r}'" ;;
      *[!A-Za-z0-9._/-]* ) fail "invalid ref '${r}'" ;;
    esac
  done

  local repo sketch
  case "$firmware" in
    onstepx) repo="OnStepX";        sketch="OnStepX.ino" ;;
    sws)     repo="SmartWebServer"; sketch="SmartWebServer.ino" ;;
    *)       fail "unknown firmware '${firmware}' (expected 'onstepx' or 'sws')" ;;
  esac

  log "Firmware : ${firmware}"
  log "Source   : hjd1964/${repo} @ ${ref:-<default branch>}"

  # ---- prepare source at requested ref -------------------------------------
  local src="${WORK}/${repo}"
  [ -d "${SOURCES}/${repo}" ] || fail "source cache for ${repo} missing from image"
  cp -a "${SOURCES}/${repo}" "$src" || fail "could not copy source into ${WORK} (permissions?)"
  git -C "$src" config --global --add safe.directory "$src" 2>/dev/null || true
  if [ -n "$ref" ]; then
    log "Fetching ref ${ref} ..."
    git -C "$src" fetch --quiet origin "$ref" 2>/dev/null || git -C "$src" fetch --quiet --all
    git -C "$src" checkout --quiet --force "$ref" 2>/dev/null \
      || git -C "$src" checkout --quiet --force FETCH_HEAD 2>/dev/null \
      || fail "git ref '${ref}' not found in ${repo}"
  fi
  log "Building commit $(git -C "$src" rev-parse --short HEAD 2>/dev/null || echo '?')"

  # Firmware version (from the checked-out sketch) — used for the installer's
  # firmware.xml. Read before configs are injected so it reflects the source.
  local fwver
  fwver="$(read_fw_version "${src}/${sketch}")"
  log "Firmware version: ${fwver:-unknown}"

  # ---- apply patches (in order, before configs are injected) ----------------
  apply_patches "$src"

  # ---- inject config files --------------------------------------------------
  cp /in/Config.h "${src}/Config.h"
  log "Injected Config.h"
  if [ "$hasExtended" = "True" ] || [ "$hasExtended" = "true" ]; then
    [ -f /in/Extended.config.h ] || fail "hasExtended set but Extended.config.h missing"
    cp /in/Extended.config.h "${src}/Extended.config.h"
    log "Injected Extended.config.h"
  fi
  if [ "$firmware" = "onstepx" ] && { [ "$hasPlugins" = "True" ] || [ "$hasPlugins" = "true" ]; }; then
    if [ -f /in/Plugins.config.h ]; then
      mkdir -p "${src}/src/plugins"
      cp /in/Plugins.config.h "${src}/src/plugins/Plugins.config.h"
      log "Injected src/plugins/Plugins.config.h"
    fi
    if [ -d "${SOURCES}/OnStepX-Plugins/website" ]; then
      local plsrc="${WORK}/OnStepX-Plugins"
      cp -a "${SOURCES}/OnStepX-Plugins" "$plsrc"
      if [ -n "$pluginsRef" ]; then
        git -C "$plsrc" fetch --quiet origin "$pluginsRef" 2>/dev/null || true
        git -C "$plsrc" checkout --quiet --force "$pluginsRef" 2>/dev/null \
          || git -C "$plsrc" checkout --quiet --force FETCH_HEAD 2>/dev/null || true
      fi
      cp -r "${plsrc}/website" "${src}/src/plugins/"
      log "Copied OnStepX-Plugins/website into src/plugins/"
    fi
  fi

  # ---- compile --------------------------------------------------------------
  export ARTDIR="${src}/build/${FQBN_PATH}"
  log "Compiling with arduino-cli (fqbn=${FQBN}) ..."
  log "----------------------------------------------------------------------"
  if arduino-cli compile -e --fqbn "$FQBN" "${src}/${sketch}"; then
    log "----------------------------------------------------------------------"
    log "Compile succeeded."
  else
    log "----------------------------------------------------------------------"
    fail "compilation failed"
  fi

  # ---- collect artifacts ----------------------------------------------------
  [ -d "$ARTDIR" ] || fail "expected build dir ${ARTDIR} not found"
  local n=0
  shopt -s nullglob
  # Only the .bin files are needed to flash; .elf/.map are large and omitted.
  for f in "${ARTDIR}"/*.bin; do
    cp "$f" /out/ && n=$((n+1))
  done
  shopt -u nullglob
  [ "$n" -gt 0 ] || fail "no artifacts produced"

  # ---- bundle the firmware-uploader installer -------------------------------
  package_installer "$firmware" "$fwver"

  # result.json lists whatever now sits in ARTDIR
  export ARTDIR="/out"
  write_result "built ${n} artifact(s)" "success"
  log "Collected ${n} artifact(s) into /out:"
  ls -la /out
}

# Wrap everything so the full transcript lands in /out/build.log even on failure.
mkdir -p /out
build 2>&1 | tee /out/build.log
exit "${PIPESTATUS[0]}"
