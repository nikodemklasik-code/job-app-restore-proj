#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source "$ROOT/scripts/automation/status-lib.sh"

echo "=== PO BOTTLENECK VIEW ==="

for item in \
  "AGENT_1:$ROOT/docs/status/agent-1.status" \
  "AGENT_2:$ROOT/docs/status/agent-2.status" \
  "AGENT_3:$ROOT/docs/status/agent-3.status" \
  "PRODUCT_OWNER:$ROOT/docs/status/product-owner.status" \
  "QC:$ROOT/docs/status/qc.status"
do
  role="${item%%:*}"
  file="${item#*:}"
  state="$(state_label "$(status_state "$file" 2>/dev/null || true)")"
  progress="$(progress_value "$file")"
  task="$(status_task "$file" 2>/dev/null || true)"
  last_progress="$(status_last_progress_at "$file" 2>/dev/null || true)"
  stale_sec="$(age_seconds "$last_progress")"
  stale_h="$(human_age "$stale_sec")"
  note="OK"

  if [ "$(status_state "$file" 2>/dev/null || true)" = "READY_FOR_QC" ]; then
    note="QC bottleneck"
  elif [ "$(status_state "$file" 2>/dev/null || true)" = "REWORK" ]; then
    note="Agent must fix now"
  elif [[ "$stale_sec" =~ ^[0-9]+$ ]] && [ "$stale_sec" -gt 600 ]; then
    note="Stale for $stale_h"
  fi

  printf "%-16s | %-28s | %-45s | %s\n" \
    "$role" \
    "$state ($progress%)" \
    "${task:-}" \
    "$note"
done
