#!/usr/bin/env bash
# ─── Smoke test — multivohub-jobapp ───────────────────────────────────────────
# Checks that the backend API is responding after a deploy.
# Runs on the VPS (called by deploy.sh and the GitHub Actions workflow).
#
# Exit 0 = all checks passed
# Exit 1 = one or more checks failed
#
set -euo pipefail

API_BASE="${API_BASE:-http://127.0.0.1:3001}"
FRONTEND_URL="${FRONTEND_URL:-https://jobs.multivohub.com}"
MAX_RETRIES=5
RETRY_DELAY=4   # seconds between retries

pass=0
fail=0

check() {
  local label="$1"
  local url="$2"
  local expected_text="${3:-}"

  for i in $(seq 1 $MAX_RETRIES); do
    local body
    local http_code
    http_code=$(curl -s -o /tmp/smoke_body -w "%{http_code}" \
      --max-time 10 --connect-timeout 5 "$url" 2>/dev/null) || true
    body=$(cat /tmp/smoke_body 2>/dev/null || true)

    if [[ "$http_code" -ge 200 && "$http_code" -lt 400 ]]; then
      if [[ -z "$expected_text" ]] || echo "$body" | grep -q "$expected_text"; then
        echo "  ✓ ${label} (HTTP ${http_code})"
        (( pass++ )) || true
        return 0
      fi
    fi

    if [[ $i -lt $MAX_RETRIES ]]; then
      echo "  … ${label} attempt ${i}/${MAX_RETRIES} (HTTP ${http_code:-???}) — retrying in ${RETRY_DELAY}s"
      sleep $RETRY_DELAY
    fi
  done

  echo "  ✗ ${label} FAILED (last HTTP ${http_code:-???})"
  (( fail++ )) || true
}

echo "────────────────────────────────────────────"
echo "  Smoke test — $(date -u '+%Y-%m-%d %H:%M UTC')"
echo "────────────────────────────────────────────"

check "Backend /health"        "${API_BASE}/health"       '"status":"ok"'
check "Backend /api/health"    "${API_BASE}/api/health"   '"status":"ok"'
check "Frontend index.html"    "${FRONTEND_URL}"          '<!DOCTYPE html'

echo "────────────────────────────────────────────"
echo "  Passed: ${pass} / Failed: ${fail}"
echo "────────────────────────────────────────────"

if [[ $fail -gt 0 ]]; then
  echo "❌ Smoke test FAILED — check PM2 logs: pm2 logs jobapp-server"
  exit 1
fi

echo "✅ All smoke checks passed"
