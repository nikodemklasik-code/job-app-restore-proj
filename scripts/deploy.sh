#!/usr/bin/env bash
# ─── Master deploy script — multivohub-jobapp ─────────────────────────────────
# Builds frontend + backend, rsync to VPS, reloads PM2, runs smoke test.
#
# Usage (from repo root):
#   bash scripts/deploy.sh [token]
#
#   The deploy token can be supplied in three ways (checked in order):
#     1. As the first positional argument:  bash scripts/deploy.sh mytoken
#     2. Via DEPLOY_TOKEN env var:          DEPLOY_TOKEN=mytoken bash scripts/deploy.sh
#     3. Interactive prompt (if neither above is set)
#
#   Set the expected token on the VPS:
#     echo 'export DEPLOY_TOKEN="mytoken"' >> ~/.bashrc
#   Keep it in a local .env file (never commit):
#     echo 'DEPLOY_TOKEN=mytoken' >> .env.local
#
# Required env (or ~/.ssh config):
#   DEPLOY_HOST   e.g. root@147.93.86.209   (default: root@147.93.86.209)
#   DEPLOY_USER   (optional, overrides user in DEPLOY_HOST)
#
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# ─── Token guard ─────────────────────────────────────────────────────────────
# Load .env.local if present (ignored by git)
if [[ -f "$ROOT/.env.local" ]]; then
  # shellcheck disable=SC1091
  set -o allexport; source "$ROOT/.env.local"; set +o allexport
fi

# Positional arg overrides env var
DEPLOY_TOKEN="${1:-${DEPLOY_TOKEN:-}}"

if [[ -z "$DEPLOY_TOKEN" ]]; then
  read -r -s -p "Deploy token: " DEPLOY_TOKEN
  echo ""
fi

# Verify token against DEPLOY_TOKEN_HASH (sha256) stored in .deploy-token-hash
# If no hash file exists, skip verification (first-time setup)
HASH_FILE="$ROOT/.deploy-token-hash"
if [[ -f "$HASH_FILE" ]]; then
  EXPECTED_HASH=$(cat "$HASH_FILE")
  ACTUAL_HASH=$(printf '%s' "$DEPLOY_TOKEN" | sha256sum | awk '{print $1}')
  if [[ "$ACTUAL_HASH" != "$EXPECTED_HASH" ]]; then
    echo "❌  Invalid deploy token." >&2
    exit 1
  fi
else
  echo "⚠️   No .deploy-token-hash found — skipping token verification."
  echo "    To set one: printf '%s' 'yourtoken' | sha256sum | awk '{print \$1}' > .deploy-token-hash"
fi

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

# Package manifests needed so npm ci can install/update node_modules on the server
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
  "${HOST}:${REMOTE_BASE}/scripts/"

# 5. Install production deps + reload PM2
echo "[5/6] Installing backend deps + reloading PM2 on VPS…"
ssh "${HOST}" '
  set -e
  cd '"${REMOTE_BASE}"'
  npm ci --omit=dev --prefix backend
  pm2 reload infra/ecosystem.config.cjs --update-env \
    || pm2 start infra/ecosystem.config.cjs
  pm2 save
'

# 6. Smoke test
echo "[6/6] Running smoke test…"
ssh "${HOST}" "bash ${REMOTE_BASE}/scripts/smoke-test.sh"

echo ""
echo "✅  Deploy complete — $(date -u '+%Y-%m-%d %H:%M UTC')"
echo "    https://jobs.multivohub.com"
