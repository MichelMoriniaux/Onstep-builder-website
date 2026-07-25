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
