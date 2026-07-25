# Deploying to a Debian server (host nginx)

Target: `redacted` server, user `redacted`, existing host nginx. The static site
is served from `/var/www/jtwgen/web`; the backend (redis + api + worker) runs in Docker and nginx
proxies `/api` to it.

```
                      ┌─ nginx (host) ─────────────────────────────┐
  browser ──80/443──▶ │  /            → /var/www/jtwgen/web (SPA)   │
                      │  /api/        → 127.0.0.1:8080 (api)        │
                      └───────────────────────────┬────────────────┘
                                                   │
   docker compose (docker-compose.prod.yml):  redis · api · worker
                                                   │ docker.sock
                                    docker run onstep-builder-runner  (per build)
```

## 0. Prerequisites (once)

```bash
# Docker engine + compose plugin
sudo apt-get update
sudo apt-get install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/debian $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# let 'redacted' use docker without sudo (log out / back in afterwards)
sudo usermod -aG docker redacted

# Node.js 20 (only used to build the static web app)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Log out and back in so the `docker` group applies, then verify: `docker run --rm hello-world`.

## 1. Get the code and create the deploy dir

```bash
sudo mkdir -p /var/www/jtwgen
sudo chown redacted:redacted /var/www/jtwgen
git clone <your-repo-url> /var/www/jtwgen
cd /var/www/jtwgen
```

(If the repo is private, clone over SSH or copy it up with `rsync`.)

## 2. Build the static web app → `/var/www/jtwgen/web`

```bash
cd /var/www/jtwgen
npm install
npm run build --workspace @onstep/shared
npm run build --workspace @onstep/web
mkdir -p /var/www/jtwgen/web
rm -rf /var/www/jtwgen/web/*
cp -r apps/web/dist/* /var/www/jtwgen/web/
```

The SPA calls the API with relative `/api/...` URLs, so no build-time API URL is needed.

## 3. Build the runner image (once; a few minutes)

```bash
cd /var/www/jtwgen
docker build -t onstep-builder-runner ./runner
```

## 4. Configure and start the backend

```bash
cd /var/www/jtwgen
cp .env.example .env
# REQUIRED: set HOST_DATA_DIR to the ABSOLUTE host path of ./data
sed -i 's#^HOST_DATA_DIR=.*#HOST_DATA_DIR=/var/www/jtwgen/data#' .env

mkdir -p data
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
curl -s http://127.0.0.1:8080/api/health   # -> {"ok":true}
```

`HOST_DATA_DIR` matters because the worker asks the host Docker daemon to launch each build as a
sibling container; its bind mounts must be host paths, not the worker's internal `/app/data`.

## 5. Install the nginx site

The DNS name defaults to `jtwgen.short-circuit.org` — add a DNS A/AAAA record pointing it at the
server, and adjust `server_name` in the config if you use a different name.

```bash
sudo cp /var/www/jtwgen/deploy/nginx-jtwgen.conf /etc/nginx/sites-available/jtwgen
# edit server_name if needed:
sudo nano /etc/nginx/sites-available/jtwgen
sudo ln -s /etc/nginx/sites-available/jtwgen /etc/nginx/sites-enabled/jtwgen
sudo nginx -t
sudo systemctl reload nginx
```

Visit `http://jtwgen.short-circuit.org/` — pick a mount, generate, edit, and build.

## 6. (Optional) HTTPS with Let's Encrypt

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d jtwgen.short-circuit.org
```

certbot rewrites the site to listen on 443 and redirect 80 → 443.

## Updating / redeploying

```bash
cd /var/www/jtwgen
git pull

# rebuild the web
npm install
npm run build --workspace @onstep/shared
npm run build --workspace @onstep/web
rm -rf web/* && cp -r apps/web/dist/* web/

# rebuild backend images + restart
docker compose -f docker-compose.prod.yml up -d --build

# if runner/ (templates, libraries, Dockerfile) changed, rebuild the runner image:
docker build -t onstep-builder-runner ./runner
```

## Operations

```bash
# logs
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f worker

# restart / stop
docker compose -f docker-compose.prod.yml restart
docker compose -f docker-compose.prod.yml down

# build artifacts + job dirs live under ./data/jobs and are swept after ARTIFACT_TTL_HOURS (default 24h)
```

## Tuning (`.env`)

| Var                  | Default | Meaning                                  |
| -------------------- | ------- | ---------------------------------------- |
| `HOST_DATA_DIR`      | —       | absolute host path of `./data` (required)|
| `WORKER_CONCURRENCY` | `2`     | concurrent builds                        |
| `BUILD_TIMEOUT_MS`   | `900000`| per-build timeout (15 min)               |
| `ARTIFACT_TTL_HOURS` | `24`    | how long job dirs/artifacts are kept     |

## Notes / security

- The api is published on `127.0.0.1:8080` only; nginx is the sole public entry point. Keep the
  firewall to ports 80/443 (+22).
- Builds run non-root, resource-capped, in a container that has network access only for the source
  clone. No auth in this version — the api rate-limits per client IP (nginx forwards the real IP via
  `X-Forwarded-For`, which the api trusts).
- The worker mounts the Docker socket — anyone who can reach it effectively has root on the host, so
  keep the api/worker unexposed (as above) and the server patched.
