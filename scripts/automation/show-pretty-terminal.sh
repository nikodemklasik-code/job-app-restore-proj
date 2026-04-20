#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source "$ROOT/scripts/automation/status-lib.sh"

SNAPSHOT_DIR="$ROOT/docs/squad/.snapshots"
CURRENT="$SNAPSHOT_DIR/current.tsv"
PREVIOUS="$SNAPSHOT_DIR/previous.tsv"
mkdir -p "$SNAPSHOT_DIR"

roles=(
  "AGENT_1:$ROOT/docs/status/agent-1.status"
  "AGENT_2:$ROOT/docs/status/agent-2.status"
  "AGENT_3:$ROOT/docs/status/agent-3.status"
  "PRODUCT_OWNER:$ROOT/docs/status/product-owner.status"
  "QC:$ROOT/docs/status/qc.status"
)

get_prev_progress() {
  local role="$1"
  [ -f "$PREVIOUS" ] || return 0
  awk -F'\t' -v r="$role" '$1==r { print $2; exit }' "$PREVIOUS"
}

printf "\n%-16s | %-28s | %-8s | %-6s | %-12s | %-12s | %-32s\n" \
  "ROLE" "STATE" "PROGRESS" "DELTA" "STALE" "HANDOFF" "CURRENT TASK"
printf "%s\n" "---------------------------------------------------------------------------------------------------------------------------------------"

snap_tmp="$(mktemp "${TMPDIR:-/tmp}/pretty-terminal-snap.XXXXXX")"

for item in "${roles[@]}"; do
  role="${item%%:*}"
  file="${item#*:}"

  state="$(state_label "$(status_state "$file" 2>/dev/null || true)")"
  progress="$(progress_value "$file")"
  task="$(status_task "$file" 2>/dev/null || true)"
  prev_progress="$(get_prev_progress "$role")"
  delta="$(delta_value "$progress" "$prev_progress")"

  stale_sec="$(age_seconds "$(status_last_progress_at "$file" 2>/dev/null || true)")"
  stale_h="$(human_age "$stale_sec")"

  handoff_wait=""
  prev_ended_at="$(status_previous_task_ended_at "$file" 2>/dev/null || true)"
  curr_started_at="$(status_current_task_started_at "$file" 2>/dev/null || true)"
  if [ -n "$prev_ended_at" ] && [ -n "$curr_started_at" ]; then
    prev_epoch="$(ts_to_epoch "$prev_ended_at" 2>/dev/null || true)"
    curr_epoch="$(ts_to_epoch "$curr_started_at" 2>/dev/null || true)"
    if [ -n "$prev_epoch" ] && [ -n "$curr_epoch" ]; then
      hw=$((curr_epoch - prev_epoch))
      [ "$hw" -lt 0 ] && hw=0
      handoff_wait="$(human_age "$hw")"
    fi
  fi

  printf "%s\t%s\n" "$role" "$progress" >> "$snap_tmp"

  printf "%-16s | %-28s | %3s%%     | %-6s | %-12s | %-12s | %-32s\n" \
    "$role" \
    "$state" \
    "$progress" \
    "${delta:-n/a}" \
    "${stale_h:-n/a}" \
    "${handoff_wait:-n/a}" \
    "${task:0:32}"
done

# Rotate TSV so next run gets real DELTA (same contract as render-pretty-dashboard.sh)
if [ -f "$CURRENT" ]; then
  cp "$CURRENT" "$PREVIOUS"
fi
mv "$snap_tmp" "$CURRENT"

echo
