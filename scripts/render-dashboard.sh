#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
STATUS_DIR="$ROOT/docs/status"
OUT="$ROOT/docs/squad/LIVE_EXECUTION_DASHBOARD.md"
source "$ROOT/scripts/automation/status-lib.sh"

{
  echo "# Live Execution Dashboard"
  echo
  echo "Generated from \`docs/status/*.status\`."
  echo
  echo "State mapping:"
  echo "- IDLE = 0%"
  echo "- IMPLEMENTING = 50%"
  echo "- READY_FOR_QC = 75%"
  echo "- REVIEWING = 75%"
  echo "- REWORK = 60%"
  echo "- APPROVED_FOR_INTEGRATION = 100%"
  echo "- APPROVED_AWAITING_NEXT_ASSIGNMENT = 0%"
  echo "- ACTIVE_MERGE_GATE = 0%"
  echo "- P0_SLICES_COMPLETE = 0%"
  echo "- BLOCKED = 15%"
  echo
  echo "Generated at: $(date '+%Y-%m-%d %H:%M:%S')"
  echo
} > "$OUT"

for f in "$STATUS_DIR"/*.status; do
  [ -f "$f" ] || continue
  role="$(basename "$f" .status | tr '[:lower:]-' '[:upper:]_')"
  state="$(normalize_empty "$(status_state "$f")")"
  task="$(status_task "$f")"
  report="$(status_report "$f")"
  verdict="$(status_verdict "$f")"
  updated="$(status_updated "$f")"
  notes="$(status_notes "$f")"
  pct="$(state_progress "$state")"
  bar="$(progress_bar "$pct")"

  {
    echo "## $role"
    echo "- State: $state"
    echo "- Progress: $bar $pct%"
    echo "- Task: ${task:-}"
    echo "- Report: ${report:-}"
    echo "- Verdict: ${verdict:-}"
    echo "- Updated: ${updated:-}"
    echo "- Waiting In Current State: $(elapsed_since "$updated")"
    echo "- Notes: ${notes:-}"
    echo
  } >> "$OUT"
done

echo "Wrote: $OUT"
