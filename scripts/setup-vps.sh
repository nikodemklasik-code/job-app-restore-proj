#!/usr/bin/env bash
# ─── Fresh VPS setup — multivohub-jobapp ──────────────────────────────────────
# Wipes /var/www/multivohub-jobapp and reinstalls everything from scratch.
# Run this ONCE to bootstrap an empty (or broken) server.
# After initial setup, use `bash scripts/deploy.sh` for subsequent deploys.
#
# Usage (from repo root):
#   bash scripts/setup-vps.sh
#
# ENV overrides (or use ~/.ssh config):
#   DEPLOY_HOST  e.g. root@147.93.86.209  (default: root@147.93.86.209)
#
# Prerequisites on the VPS:
#   Node.js 20+, npm, PM2, nginx, certbot
#   SSH key access configured
#
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Load .env.local if present (ignored by git)
if [[ -f "$ROOT/.env.local" ]]; then
  # shellcheck disable=SC1091
  set -o allexport; source "$ROOT/.env.local"; set +o allexport
fi

HOST="${DEPLOY_HOST:-root@147.93.86.209}"
REMOTE_BASE="/var/www/multivohub-jobapp"

echo "════════════════════════════════════════════"
echo "  Fresh VPS setup — $(date -u '+%Y-%m-%d %H:%M UTC')"
echo "  Target: ${HOST}"
echo "  ⚠️  This will WIPE ${REMOTE_BASE} and reinstall everything."
echo "════════════════════════════════════════════"
read -r -p "Continue? [y/N] " confirm
[[ "$confirm" =~ ^[Yy]$ ]] || { echo "Aborted."; exit 0; }

# 1. Build locally first (fail-fast before touching the server)
echo ""
echo "[1/6] Building locally…"
cd "$ROOT"
npm run build:frontend
npm run build:backend

# 2. Wipe + recreate remote directory structure, preserving .env
echo "[2/6] Wiping remote dir + recreating structure…"
ssh "${HOST}" "
  set -e
  # Stop all PM2 processes before wiping
  pm2 delete all 2>/dev/null || true

  # Back up .env if it exists so secrets survive the wipe
  if [ -f '${REMOTE_BASE}/.env' ]; then
    cp '${REMOTE_BASE}/.env' /tmp/multivohub-jobapp-env.bak
    echo '  .env backed up to /tmp/multivohub-jobapp-env.bak'
  fi

  rm -rf '${REMOTE_BASE}'
  mkdir -p '${REMOTE_BASE}'/{frontend/dist,dist/backend,backend,infra/nginx,scripts,lib}
  mkdir -p /var/log/pm2

  # Restore .env
  if [ -f /tmp/multivohub-jobapp-env.bak ]; then
    cp /tmp/multivohub-jobapp-env.bak '${REMOTE_BASE}/.env'
    echo '  .env restored'
  fi
"

# 3. Sync all required files
echo "[3/6] Syncing files to VPS…"

rsync -avz --delete \
  "$ROOT/frontend/dist/" \
  "${HOST}:${REMOTE_BASE}/frontend/dist/"

rsync -avz --delete \
  --exclude='node_modules' \
  "$ROOT/backend/dist/" \
  "${HOST}:${REMOTE_BASE}/dist/backend/"

# Package manifests needed so npm ci works on the server
rsync -avz \
  "$ROOT/backend/package.json" \
  "$ROOT/backend/package-lock.json" \
  "${HOST}:${REMOTE_BASE}/backend/"

rsync -avz \
  "$ROOT/infra/ecosystem.config.cjs" \
  "$ROOT/lib/envSchema.mjs" \
  "${HOST}:${REMOTE_BASE}/"

rsync -avz \
  "$ROOT/scripts/smoke-test.sh" \
  "$ROOT/scripts/rollback.sh" \
  "$ROOT/scripts/webhook-server.js" \
  "${HOST}:${REMOTE_BASE}/scripts/"

rsync -avz \
  "$ROOT/infra/nginx/" \
  "${HOST}:${REMOTE_BASE}/infra/nginx/"

# 4. Install production backend dependencies on VPS
echo "[4/6] Installing backend production dependencies…"
ssh "${HOST}" "
  set -e
  npm ci --omit=dev --prefix '${REMOTE_BASE}/backend'
  echo '  ✓ backend/node_modules installed'
"

# 5. Start PM2 and configure nginx
echo "[5/6] Starting PM2 + configuring nginx…"
ssh "${HOST}" "
  set -e
  cd '${REMOTE_BASE}'

  pm2 start infra/ecosystem.config.cjs
  pm2 save

  # Symlink nginx config if not already in place
  NGINX_ENABLED=/etc/nginx/sites-enabled/multivohub-jobapp
  if [ ! -e \"\$NGINX_ENABLED\" ]; then
    ln -sf '${REMOTE_BASE}/infra/nginx/multivohub-jobapp.conf' \"\$NGINX_ENABLED\"
    nginx -t && systemctl reload nginx
    echo '  ✓ nginx config symlinked and reloaded'
  else
    echo '  ✓ nginx config already in place'
  fi
"

# 6. Smoke test
echo "[6/6] Running smoke test…"
ssh "${HOST}" "bash '${REMOTE_BASE}/scripts/smoke-test.sh'" || true

echo ""
echo "✅  Fresh VPS setup complete — $(date -u '+%Y-%m-%d %H:%M UTC')"
echo ""
echo "Next steps:"
echo "  • If .env was not present, copy it now:"
echo "      scp .env.production ${HOST}:${REMOTE_BASE}/.env"
echo "      ssh ${HOST} 'pm2 reload ${REMOTE_BASE}/infra/ecosystem.config.cjs --update-env && pm2 save'"
echo "  • SSL (first time):"
echo "      ssh ${HOST} 'certbot --nginx -d jobs.multivohub.com'"
echo "  • Future deploys: bash scripts/deploy.sh  or  push to main"
