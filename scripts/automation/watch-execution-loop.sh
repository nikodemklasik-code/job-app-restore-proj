#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

while true; do
  clear
  echo "=== SWISS WATCH LOOP ==="
  echo "Updated: $(date '+%Y-%m-%d %H:%M:%S')"
  echo
  "$ROOT/scripts/automation/show-live-execution-ops.sh"
  echo
  echo "=== QC NEXT ==="
  "$ROOT/scripts/automation/qc-next.sh" || true
  echo
  echo "=== PO NEXT ==="
  "$ROOT/scripts/automation/po-next.sh" || true
  echo
  echo "Looping every 30s..."
  sleep 30
done
