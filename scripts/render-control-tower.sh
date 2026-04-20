#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/docs/squad/CONTROL_TOWER.md"
CUR="$ROOT/docs/squad/LIVE_EXECUTION_DASHBOARD.md"
ALERTS="$ROOT/docs/squad/EXECUTION_ALERTS.md"
PREV="$ROOT/docs/squad/history/LIVE_EXECUTION_DASHBOARD.prev.md"

{
  echo "# Control Tower"
  echo
  echo "Updated: $(date '+%Y-%m-%d %H:%M:%S')"
  echo

  echo "## Change Summary vs previous loop"
  echo
  if [ -f "$CUR" ] && [ -f "$PREV" ]; then
    DIFF_OUTPUT="$(diff -u "$PREV" "$CUR" || true)"
    if [ -n "$DIFF_OUTPUT" ]; then
      echo '```diff'
      echo "$DIFF_OUTPUT" | sed '1,2d'
      echo '```'
    else
      echo "_No visible change since previous loop._"
    fi
  else
    echo "_No previous snapshot yet._"
  fi

  echo
  echo "---"
  echo
  echo "## Current Dashboard"
  echo
  if [ -f "$CUR" ]; then
    cat "$CUR"
  else
    echo "_Missing: docs/squad/LIVE_EXECUTION_DASHBOARD.md_"
  fi

  echo
  echo "---"
  echo
  echo "## Previous Dashboard Snapshot"
  echo
  if [ -f "$PREV" ]; then
    cat "$PREV"
  else
    echo "_No previous snapshot yet._"
  fi

  echo
  echo "---"
  echo
  echo "## Stall Status"
  echo
  if [ -f "$ROOT/docs/squad/STALL_STATUS.md" ]; then
    cat "$ROOT/docs/squad/STALL_STATUS.md"
  else
    echo "_Missing: docs/squad/STALL_STATUS.md_"
  fi

  echo "---"
  echo
  echo "## Execution Alerts"
  echo
  if [ -f "$ALERTS" ]; then
    cat "$ALERTS"
  else
    echo "_Missing: docs/squad/EXECUTION_ALERTS.md_"
  fi

  echo
  echo "---"
  echo
  echo "## PO Intervention Duty"
  echo
  if [ -f "$ROOT/docs/squad/EXECUTION_ALERTS.md" ]; then
    if grep -qiE 'bottleneck|rework required now|blocked|stall' "$ROOT/docs/squad/EXECUTION_ALERTS.md"; then
      echo "- Active bottleneck detected."
      echo "- Product Owner must intervene now."
      echo "- Required actions:"
      echo "  - identify blocked role"
      echo "  - assign exact next action"
      echo "  - refresh board/dashboard/handoff visibility"
      echo "  - keep intervening until state changes"
    else
      echo "- No active bottleneck detected in alerts."
    fi
  else
    echo "- Execution alerts file missing."
  fi

  echo "---"
  echo
  echo "## QC Handoffs"
  echo
  for f in "$ROOT"/docs/qc-handoffs/agent-*-next-action.md; do
    [ -f "$f" ] || continue
    echo
    echo "### $(basename "$f")"
    echo
    cat "$f"
    echo
  done
} > "$OUT"

echo "Wrote: $OUT"
