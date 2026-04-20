#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

bash "$ROOT/scripts/automation/validate-task-chain.sh" || {
  ec=$?
  echo "Task chain invalid (validator exit $ec). See docs/squad/AUTOMATION_PO_RUNBOOK.md" >&2
  echo "Quick gate: cd $ROOT && bash scripts/automation/po-automation-health.sh" >&2
  exit 1
}

while true; do
  if [ -t 1 ]; then
    clear
  fi
  echo "=== TASK ENGINE LOOP ==="
  echo "Updated: $(date '+%Y-%m-%d %H:%M:%S')"
  echo
  "$ROOT/scripts/automation/auto-advance-task-chain.sh"
  echo
  "$ROOT/scripts/automation/show-live-execution-ops.sh"
  echo
  echo "Looping every 30s..."
  sleep 30
done
