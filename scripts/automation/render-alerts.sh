#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STATUS_DIR="$ROOT/docs/status"
OUT="$ROOT/docs/squad/EXECUTION_ALERTS.md"
source "$ROOT/scripts/automation/status-lib.sh"

{
  echo "# Execution Alerts"
  echo
  echo "Updated: $(date '+%Y-%m-%d %H:%M:%S')"
  echo
  echo "## Current blocking signals"
  echo
} > "$OUT"

found=0

for f in "$STATUS_DIR"/*.status; do
  [ -f "$f" ] || continue
  role="$(basename "$f" .status | tr '[:lower:]-' '[:upper:]_')"
  state="$(normalize_empty "$(status_state "$f")")"
  updated="$(status_updated "$f")"
  wait_text="$(elapsed_since "$updated")"

  case "$state" in
    READY_FOR_QC)
      echo "- $role: waiting for QC verdict for $wait_text -> QC must review now" >> "$OUT"
      found=1
      ;;
    REWORK)
      echo "- $role: rework active for $wait_text -> agent must fix now" >> "$OUT"
      found=1
      ;;
    APPROVED_FOR_INTEGRATION|APPROVED_AWAITING_NEXT_ASSIGNMENT)
      echo "- $role: approved and waiting for next bounded task for $wait_text -> Product Owner must assign now" >> "$OUT"
      found=1
      ;;
  esac
done

if [ "$found" -eq 0 ]; then
  echo "- none" >> "$OUT"
fi
