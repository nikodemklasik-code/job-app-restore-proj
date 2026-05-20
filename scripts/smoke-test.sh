#!/usr/bin/env bash
# ─── Smoke test — multivohub-jobapp ───────────────────────────────────────────
# Checks that the backend API and key frontend routes are responding after a deploy.
# Authenticated billing/credits flows still require the manual checklist printed
# below because the smoke script has no browser session or Clerk token.
#
# Exit 0 = HTTP smoke checks passed and manual billing gate printed
# Exit 1 = one or more HTTP checks failed
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

# Frontend route reachability. These checks confirm the SPA shell is served.
# Auth/data correctness is covered by the manual checklist printed below.
check "Frontend /profile"      "${FRONTEND_URL}/profile"   '<!DOCTYPE html'
check "Frontend /documents"    "${FRONTEND_URL}/documents" '<!DOCTYPE html'
check "Frontend /style"        "${FRONTEND_URL}/style"     '<!DOCTYPE html'
check "Frontend /coach"        "${FRONTEND_URL}/coach"     '<!DOCTYPE html'
check "Frontend /billing"      "${FRONTEND_URL}/billing"   '<!DOCTYPE html'

echo "────────────────────────────────────────────"
echo "  Passed: ${pass} / Failed: ${fail}"
echo "────────────────────────────────────────────"

if [[ $fail -gt 0 ]]; then
  echo "❌ Smoke test FAILED — check PM2 logs: pm2 logs jobapp-server"
  exit 1
fi

echo "✅ HTTP smoke checks passed"
echo ""
echo "Manual authenticated billing/credits gate (required before deploy sign-off):"
echo "  [ ] Profile load: sign in and open /profile; approved profile data loads without parser/latest-CV state dependency."
echo "  [ ] Document review path read-only: open /documents and navigate review/preview path without uploading or mutating CV data."
echo "  [ ] Global credits: header shows loading -> real balance, zero state, low-balance warning, and error/retry if billing API fails."
echo "  [ ] Style generation gate: verify Style Studio generation is blocked when credits are insufficient and allowed when balance covers backend estimate."
echo "  [ ] Paid AI action: run one Coach answer evaluation; verify cost preview appears before action, backend deducts credits, and /billing shows the credit usage row."
echo "  [ ] Ledger/history visibility: /billing shows AI credit transaction history with date, action type, amount, status, and related entity id when present."

echo "✅ Smoke gate completed; manual authenticated checklist still required for billing sign-off"
