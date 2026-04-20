#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source "$ROOT/scripts/automation/status-lib.sh"

SNAPSHOT_DIR="$ROOT/docs/squad/.snapshots"
CURRENT="$SNAPSHOT_DIR/current.tsv"
PREVIOUS="$SNAPSHOT_DIR/previous.tsv"
mkdir -p "$SNAPSHOT_DIR"

tmp="$(mktemp)"

roles=(
  "AGENT_1:$ROOT/docs/status/agent-1.status"
  "AGENT_2:$ROOT/docs/status/agent-2.status"
  "AGENT_3:$ROOT/docs/status/agent-3.status"
  "PRODUCT_OWNER:$ROOT/docs/status/product-owner.status"
  "QC:$ROOT/docs/status/qc.status"
)

printf "| Role | State | Progress | Delta | Stale since progress | Handoff wait | Previous task | Current task | Next task |\n"
printf "|---|---:|---:|---:|---:|---:|---|---|---|\n"

for item in "${roles[@]}"; do
  role="${item%%:*}"
  file="${item#*:}"

  state="$(state_label "$(status_state "$file" 2>/dev/null || true)")"
  progress="$(progress_value "$file")"
  task="$(status_task "$file" 2>/dev/null || true)"
  prev_task="$(status_previous_task "$file" 2>/dev/null || true)"
  next_task="$(status_next_task "$file" 2>/dev/null || true)"
  last_progress_at="$(status_last_progress_at "$file" 2>/dev/null || true)"
  prev_ended_at="$(status_previous_task_ended_at "$file" 2>/dev/null || true)"
  curr_started_at="$(status_current_task_started_at "$file" 2>/dev/null || true)"

  prev_progress=""
  if [ -f "$PREVIOUS" ]; then
    prev_progress="$(awk -F'\t' -v r="$role" '$1==r { print $2; exit }' "$PREVIOUS")"
  fi
  delta="$(delta_value "$progress" "$prev_progress")"

  stale_sec="$(age_seconds "$last_progress_at")"
  stale_h="$(human_age "$stale_sec")"

  handoff_wait=""
  if [ -n "$prev_ended_at" ] && [ -n "$curr_started_at" ]; then
    prev_epoch="$(ts_to_epoch "$prev_ended_at" 2>/dev/null || true)"
    curr_epoch="$(ts_to_epoch "$curr_started_at" 2>/dev/null || true)"
    if [ -n "$prev_epoch" ] && [ -n "$curr_epoch" ]; then
      hw=$((curr_epoch - prev_epoch))
      [ "$hw" -lt 0 ] && hw=0
      handoff_wait="$(human_age "$hw")"
    fi
  elif [ -n "$prev_ended_at" ] && [ -z "$curr_started_at" ]; then
    wait_now="$(age_seconds "$prev_ended_at")"
    handoff_wait="$(human_age "$wait_now")"
  fi

  printf "%s\t%s\n" "$role" "$progress" >> "$tmp"
  printf "| %s | %s | %s%% | %s | %s | %s | %s | %s | %s |\n" \
    "$role" \
    "$state" \
    "${progress:-0}" \
    "${delta:-n/a}" \
    "${stale_h:-n/a}" \
    "${handoff_wait:-n/a}" \
    "${prev_task:--}" \
    "${task:--}" \
    "${next_task:--}"
done

echo
echo "## Blocking signals"
blocking=0
for item in "${roles[@]}"; do
  role="${item%%:*}"
  file="${item#*:}"
  state="$(status_state "$file" 2>/dev/null || true)"
  verdict="$(status_verdict "$file" 2>/dev/null || true)"
  stale_sec="$(age_seconds "$(status_last_progress_at "$file" 2>/dev/null || true)")"

  if [ "$state" = "READY_FOR_QC" ]; then
    echo "- $role czeka na QC verdict"
    blocking=1
  elif [ "$state" = "REWORK" ]; then
    echo "- $role ma rework do ogarnięcia"
    blocking=1
  elif [[ "$stale_sec" =~ ^[0-9]+$ ]] && [ "$stale_sec" -gt 600 ] && [ "$role" != "QC" ] && [ "$role" != "PRODUCT_OWNER" ]; then
    echo "- $role bez progresu od $(human_age "$stale_sec")"
    blocking=1
  fi
done
[ "$blocking" -eq 0 ] && echo "- none"

[ -f "$CURRENT" ] && cp "$CURRENT" "$PREVIOUS"
mv "$tmp" "$CURRENT"
