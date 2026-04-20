#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

while true; do
  ts="$(date '+%Y-%m-%d %H:%M:%S')"
  {
    echo ""
    echo "===== LIVE LOOP $ts ====="
    ./scripts/check-execution-state.sh || true
    echo
    ./scripts/render-dashboard.sh || true
    echo
    echo "----- CURRENT TASK FILES -----"
    for f in \
      docs/today-reset/agent-1/NOW.md \
      docs/today-reset/agent-2/NOW.md \
      docs/today-reset/agent-3/NOW.md \
      docs/today-reset/product-owner/NOW.md \
      docs/today-reset/qc/NOW.md; do
      echo "[$f]"
      sed -n '1,20p' "$f" || true
      echo
    done
  } >> logs/live-status-loop.log 2>&1
  sleep 30
done
