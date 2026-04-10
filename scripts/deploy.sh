#!/usr/bin/env bash
# ─── Master deploy script — multivohub-jobapp ─────────────────────────────────
# Builds frontend + backend, rsync to VPS, reloads PM2, runs smoke test.
#
# Usage (from repo root):
#   bash scripts/deploy.sh
#
# Required env (or ~/.ssh config):
#   DEPLOY_HOST   e.g. root@147.93.86.209   (default: root@147.93.86.209)
#   DEPLOY_USER   (optional, overrides user in DEPLOY_HOST)
#
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOST="${DEPLOY_HOST:-root@147.93.86.209}"
REMOTE_BASE="/var/www/multivohub-jobapp"
REMOTE_FRONTEND_DIST="${REMOTE_FRONTEND_DIST:-${REMOTE_BASE}/frontend/dist}"

echo "════════════════════════════════════════════"
echo "  multivohub-jobapp deploy — $(date -u '+%Y-%m-%d %H:%M UTC')"
echo "  Target: ${HOST}"
echo "════════════════════════════════════════════"

# 1. Validate ENV schema locally (fail-fast)
echo "[1/6] Validating ENV schema…"
node "$ROOT/lib/envSchema.mjs"

# 2. Build
echo "[2/6] Building frontend…"
cd "$ROOT"
npm run build:frontend

echo "      Building backend…"
npm run build:backend

# 3. Backup current frontend dist, then sync new one
echo "[3/6] Backing up current frontend dist on VPS…"
ssh "${HOST}" '
  DIST='"${REMOTE_FRONTEND_DIST}"'
  if [ -d "$DIST" ]; then
    BACKUP="${DIST}-backup-$(date +%s)"
    cp -r "$DIST" "$BACKUP"
    echo "  Backup created: $BACKUP"
    # Keep only the 3 most recent backups
    ls -d "${DIST}-backup-"* 2>/dev/null | sort -r | tail -n +4 | xargs rm -rf 2>/dev/null || true
  fi
'

echo "      Syncing frontend dist → ${HOST}:${REMOTE_FRONTEND_DIST}/"
rsync -avz --delete "$ROOT/frontend/dist/" "${HOST}:${REMOTE_FRONTEND_DIST}/"

# 4. Sync backend dist + infra files
echo "[4/6] Syncing backend dist + infra…"
rsync -avz --delete \
  --exclude='node_modules' \
  "$ROOT/backend/dist/" "${HOST}:${REMOTE_BASE}/dist/backend/"

rsync -avz \
  "$ROOT/infra/ecosystem.config.cjs" \
  "$ROOT/lib/envSchema.mjs" \
  "${HOST}:${REMOTE_BASE}/"

rsync -avz \
  "$ROOT/scripts/smoke-test.sh" \
  "$ROOT/scripts/rollback.sh" \
  "${HOST}:${REMOTE_BASE}/scripts/"

# 5. Reload PM2
echo "[5/6] Reloading PM2 on VPS…"
ssh "${HOST}" '
  set -e
  cd '"${REMOTE_BASE}"'
  pm2 reload infra/ecosystem.config.cjs --update-env \
    || pm2 start infra/ecosystem.config.cjs
  pm2 save
'

# 6. Smoke test
echo "[6/6] Running smoke test…"
ssh "${HOST}" "bash ${REMOTE_BASE}/scripts/smoke-test.sh"

echo ""
echo "✅  Deploy complete — $(date -u '+%Y-%m-%d %H:%M UTC')"
echo "    https://jobapp.multivohub.com"
