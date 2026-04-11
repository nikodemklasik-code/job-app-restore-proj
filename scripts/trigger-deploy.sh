#!/usr/bin/env bash
# ─── Trigger remote deploy via webhook — multivohub-jobapp ───────────────────
#
# Sends an authenticated POST to the webhook server running on the VPS.
# The server does: git pull origin main + npm ci + pm2 reload
#
# Usage:
#   bash scripts/trigger-deploy.sh [token] [webhook_url]
#
#   Token can come from:
#     1. First positional arg:   bash scripts/trigger-deploy.sh mytoken
#     2. DEPLOY_TOKEN env var:   DEPLOY_TOKEN=mytoken bash scripts/trigger-deploy.sh
#     3. .env.local file (key DEPLOY_TOKEN)
#     4. Interactive prompt
#
#   Webhook URL can come from:
#     1. Second positional arg
#     2. WEBHOOK_URL env var
#     3. Default: https://jobs.multivohub.com/webhook/deploy
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ─── Load .env.local ─────────────────────────────────────────────────────────
if [[ -f "$ROOT/.env.local" ]]; then
  # shellcheck disable=SC1091
  set -o allexport; source "$ROOT/.env.local"; set +o allexport
fi

# ─── Resolve token ───────────────────────────────────────────────────────────
DEPLOY_TOKEN="${1:-${DEPLOY_TOKEN:-}}"
if [[ -z "$DEPLOY_TOKEN" ]]; then
  read -r -s -p "Deploy token: " DEPLOY_TOKEN
  echo ""
fi

# ─── Resolve webhook URL ─────────────────────────────────────────────────────
WEBHOOK_URL="${2:-${WEBHOOK_URL:-https://jobs.multivohub.com/webhook/deploy}}"

# ─── Fire! ───────────────────────────────────────────────────────────────────
echo "🚀  Triggering deploy…"
echo "    URL: ${WEBHOOK_URL}"

HTTP_CODE=$(curl -s -o /tmp/webhook_response -w "%{http_code}" \
  -X POST "${WEBHOOK_URL}?token=${DEPLOY_TOKEN}" \
  --max-time 15 --connect-timeout 10)

BODY=$(cat /tmp/webhook_response 2>/dev/null || true)

echo "    HTTP: ${HTTP_CODE}"
echo "    Response: ${BODY}"

if [[ "$HTTP_CODE" == "202" ]]; then
  echo ""
  echo "✅  Deploy accepted — running on server."
  echo "    Monitor: ssh root@<vps-ip> 'pm2 logs jobapp-server'"
elif [[ "$HTTP_CODE" == "401" ]]; then
  echo "❌  Wrong token." >&2
  exit 1
elif [[ "$HTTP_CODE" == "409" ]]; then
  echo "⚠️   Deploy already in progress — try again in a moment." >&2
  exit 1
else
  echo "❌  Unexpected response (HTTP ${HTTP_CODE})." >&2
  exit 1
fi
