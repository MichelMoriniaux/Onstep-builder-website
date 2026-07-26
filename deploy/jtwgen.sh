#!/usr/bin/env bash
# jtwgen.sh — install, update and operate the JTW Firmware Builder service.
#
# The service is: a static SPA served by host nginx from $WEB_DIR, and a Docker
# backend (redis + api + worker) from docker-compose.prod.yml, plus the
# onstep-builder-runner image the worker launches per build.
#
# Usage:  ./deploy/jtwgen.sh <command> [options]
# Run     ./deploy/jtwgen.sh help   for the full command list.
#
# Safe to re-run: every command is idempotent. Only `prereqs` and `nginx` need
# sudo; everything else runs as the deploy user (must be in the docker group).
set -euo pipefail

# --- locate the repo (this script lives in <repo>/deploy) --------------------
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
ROOT="$(cd -- "${SCRIPT_DIR}/.." >/dev/null 2>&1 && pwd)"

# --- configuration (override via env) ----------------------------------------
COMPOSE_FILE="${COMPOSE_FILE:-${ROOT}/docker-compose.prod.yml}"
WEB_DIR="${WEB_DIR:-${ROOT}/web}"                 # nginx docroot (built SPA)
DATA_DIR="${DATA_DIR:-${ROOT}/data}"              # job/artifact storage
RUNNER_IMAGE="${RUNNER_IMAGE:-onstep-builder-runner}"
NGINX_SITE="${NGINX_SITE:-jtwgen}"
NGINX_CONF_SRC="${NGINX_CONF_SRC:-${ROOT}/deploy/nginx-jtwgen.conf}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:8080/api/health}"

# --- pretty output -----------------------------------------------------------
c_reset=$'\033[0m'; c_blue=$'\033[34m'; c_green=$'\033[32m'; c_yellow=$'\033[33m'; c_red=$'\033[31m'
info() { printf '%s==>%s %s\n' "$c_blue" "$c_reset" "$*"; }
ok()   { printf '%s✓%s %s\n'  "$c_green" "$c_reset" "$*"; }
warn() { printf '%s!%s %s\n'  "$c_yellow" "$c_reset" "$*" >&2; }
die()  { printf '%s✗%s %s\n'  "$c_red" "$c_reset" "$*" >&2; exit 1; }

# --- docker compose wrapper (v2 plugin or legacy binary) ---------------------
DC=()
detect_compose() {
  if docker compose version >/dev/null 2>&1; then DC=(docker compose)
  elif command -v docker-compose >/dev/null 2>&1; then DC=(docker-compose)
  else die "docker compose not found — install Docker + the compose plugin (see 'prereqs')"; fi
}
dc() { "${DC[@]}" -f "$COMPOSE_FILE" "$@"; }

need() { command -v "$1" >/dev/null 2>&1 || die "required command '$1' not found${2:+ ($2)}"; }

# --- checks ------------------------------------------------------------------
check_env() {
  need docker "install Docker first: $0 prereqs"
  docker info >/dev/null 2>&1 || die "cannot talk to the Docker daemon — is it running and are you in the 'docker' group?"
  detect_compose
  [ -f "$COMPOSE_FILE" ] || die "compose file not found: $COMPOSE_FILE"
}

ensure_dotenv() {
  local envf="${ROOT}/.env"
  if [ ! -f "$envf" ]; then
    [ -f "${ROOT}/.env.example" ] || die ".env.example missing; cannot bootstrap .env"
    cp "${ROOT}/.env.example" "$envf"
    ok "created .env from .env.example"
  fi
  # HOST_DATA_DIR must be the ABSOLUTE host path of ./data (worker launches
  # sibling containers whose bind mounts resolve on the host).
  if grep -q '^HOST_DATA_DIR=' "$envf"; then
    sed -i "s#^HOST_DATA_DIR=.*#HOST_DATA_DIR=${DATA_DIR}#" "$envf"
  else
    printf 'HOST_DATA_DIR=%s\n' "$DATA_DIR" >> "$envf"
  fi
  info "HOST_DATA_DIR=${DATA_DIR}"
}

# --- build steps -------------------------------------------------------------
build_web() {
  need npm "install Node.js 20+: $0 prereqs"
  info "Building static web app -> ${WEB_DIR}"
  ( cd "$ROOT" && npm install && \
    npm run build --workspace @onstep/shared && \
    npm run build --workspace @onstep/web )
  mkdir -p "$WEB_DIR"
  # Refresh docroot atomically-ish: clear then copy the freshly built dist.
  rm -rf "${WEB_DIR:?}/"* 2>/dev/null || true
  cp -r "${ROOT}/apps/web/dist/." "$WEB_DIR/"
  ok "web published to ${WEB_DIR}"
}

build_runner() {
  check_env
  info "Building runner image '${RUNNER_IMAGE}' (cached layers reused)"
  docker build -t "$RUNNER_IMAGE" "${ROOT}/runner"
  ok "runner image built: ${RUNNER_IMAGE}"
}

backend_up() {
  check_env
  ensure_dotenv
  mkdir -p "$DATA_DIR"
  info "Starting backend (redis + api + worker)"
  dc up -d --build
  ok "backend up"
}

wait_health() {
  command -v curl >/dev/null 2>&1 || { warn "curl not found; skipping health check"; return 0; }
  info "Waiting for API health at ${HEALTH_URL}"
  local i
  for i in $(seq 1 30); do
    if curl -fsS "$HEALTH_URL" >/dev/null 2>&1; then ok "API healthy"; return 0; fi
    sleep 1
  done
  warn "API did not report healthy within 30s — check: $0 logs api"
  return 1
}

install_nginx() {
  [ -f "$NGINX_CONF_SRC" ] || die "nginx config not found: $NGINX_CONF_SRC"
  need nginx
  info "Installing nginx site '${NGINX_SITE}'"
  sudo cp "$NGINX_CONF_SRC" "/etc/nginx/sites-available/${NGINX_SITE}"
  sudo ln -sfn "/etc/nginx/sites-available/${NGINX_SITE}" "/etc/nginx/sites-enabled/${NGINX_SITE}"
  sudo nginx -t
  sudo systemctl reload nginx
  ok "nginx site '${NGINX_SITE}' installed and reloaded"
  warn "Set 'server_name' in /etc/nginx/sites-available/${NGINX_SITE} and point DNS at this host."
}

# --- prerequisites (Debian/Ubuntu) -------------------------------------------
cmd_prereqs() {
  [ "$(id -u)" -eq 0 ] || die "run 'prereqs' as root (sudo $0 prereqs)"
  info "Installing Docker engine + compose plugin and Node.js 20"
  apt-get update
  apt-get install -y ca-certificates curl git gnupg
  install -m 0755 -d /etc/apt/keyrings
  if [ ! -f /etc/apt/keyrings/docker.gpg ]; then
    curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
  fi
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/debian $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  if ! command -v node >/dev/null 2>&1; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
  fi
  local u="${SUDO_USER:-$USER}"
  usermod -aG docker "$u" || true
  ok "prerequisites installed"
  warn "Log out and back in (or 'newgrp docker') so '$u' can use Docker without sudo."
}

# --- top-level commands ------------------------------------------------------
cmd_install() {
  local do_nginx=0
  for a in "$@"; do case "$a" in --with-nginx) do_nginx=1 ;; esac; done
  info "Installing JTW Firmware Builder from ${ROOT}"
  build_web
  build_runner
  backend_up
  wait_health || true
  [ "$do_nginx" -eq 1 ] && install_nginx || warn "nginx not touched (pass --with-nginx, or run: $0 nginx)"
  ok "install complete"
}

cmd_update() {
  local skip_runner=0 skip_pull=0
  for a in "$@"; do case "$a" in
    --skip-runner) skip_runner=1 ;;
    --no-pull)     skip_pull=1 ;;
  esac; done
  if [ "$skip_pull" -eq 0 ] && [ -d "${ROOT}/.git" ]; then
    info "Updating source (git pull)"
    ( cd "$ROOT" && git pull --ff-only ) || warn "git pull skipped/failed — continuing with working tree"
  fi
  build_web
  backend_up
  if [ "$skip_runner" -eq 0 ]; then build_runner; else info "skipping runner rebuild (--skip-runner)"; fi
  wait_health || true
  ok "update complete"
}

cmd_help() {
  cat <<EOF
jtwgen.sh — manage the JTW Firmware Builder service

  Setup
    prereqs              install Docker + compose + Node.js  (run as root)
    install [--with-nginx]
                         first-time setup: build web + runner, start backend
    nginx                install/refresh the host nginx site and reload

  Update
    update [--skip-runner] [--no-pull]
                         git pull, rebuild web, restart backend, rebuild runner
    web                  rebuild + publish the static SPA only
    runner               rebuild the onstep-builder-runner image only
    backend              (re)build backend images and (re)start the stack

  Operations
    start | stop | restart | down
    status | ps          show container status
    logs [service]       tail logs (service: api | worker | redis; default all)
    health               curl the API health endpoint
    help                 this message

  Config via env: COMPOSE_FILE, WEB_DIR, DATA_DIR, RUNNER_IMAGE, NGINX_SITE,
  NGINX_CONF_SRC, HEALTH_URL. Defaults are relative to ${ROOT}.
EOF
}

main() {
  local cmd="${1:-help}"; shift || true
  case "$cmd" in
    prereqs)  cmd_prereqs "$@" ;;
    install)  cmd_install "$@" ;;
    update)   cmd_update "$@" ;;
    web)      build_web ;;
    runner)   build_runner ;;
    backend)  backend_up ;;
    nginx)    install_nginx ;;
    start)    check_env; dc start ;;
    stop)     check_env; dc stop ;;
    restart)  check_env; dc restart ;;
    down)     check_env; dc down ;;
    status|ps) check_env; dc ps ;;
    logs)     check_env; dc logs -f "${1:-}" ;;
    health)   wait_health ;;
    help|-h|--help) cmd_help ;;
    *) die "unknown command '$cmd' (try: $0 help)" ;;
  esac
}

main "$@"
