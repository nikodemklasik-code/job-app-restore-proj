#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

while true; do
  if [ -t 1 ]; then
    clear
  fi
  echo "=== PRETTY EXECUTION LOOP ==="
  echo "Updated: $(date '+%Y-%m-%d %H:%M:%S')"
  echo

  "$ROOT/scripts/automation/render-pretty-dashboard.sh" >/dev/null 2>&1 || true
  "$ROOT/scripts/automation/show-pretty-terminal.sh" || true

  echo "=== QC NEXT ==="
  "$ROOT/scripts/automation/qc-next.sh" || true
  echo
  echo "=== PO NEXT ==="
  "$ROOT/scripts/automation/po-next.sh" || true
  echo
  echo "Dashboard file: docs/squad/LIVE_EXECUTION_DASHBOARD.md"
  echo "Refreshing every 30s..."
  sleep 30
done
