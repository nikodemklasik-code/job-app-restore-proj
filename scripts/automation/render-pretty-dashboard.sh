#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source "$ROOT/scripts/automation/status-lib.sh"

SNAPSHOT_DIR="$ROOT/docs/squad/.snapshots"
CURRENT="$SNAPSHOT_DIR/current.tsv"
PREVIOUS="$SNAPSHOT_DIR/previous.tsv"
OUT="$ROOT/docs/squad/LIVE_EXECUTION_DASHBOARD.md"

mkdir -p "$SNAPSHOT_DIR"

roles=(
  "AGENT_1:$ROOT/docs/status/agent-1.status"
  "AGENT_2:$ROOT/docs/status/agent-2.status"
  "AGENT_3:$ROOT/docs/status/agent-3.status"
  "PRODUCT_OWNER:$ROOT/docs/status/product-owner.status"
  "QC:$ROOT/docs/status/qc.status"
)

tmp="$(mktemp)"

get_prev_progress() {
  local role="$1"
  [ -f "$PREVIOUS" ] || return 0
  awk -F'\t' -v r="$role" '$1==r { print $2; exit }' "$PREVIOUS"
}

render_block() {
  local role="$1"
  local file="$2"

  local state progress task prev_task next_task verdict notes updated
  local last_progress_at prev_ended_at curr_started_at
  local prev_progress delta stale_sec stale_h handoff_wait

  state="$(state_label "$(status_state "$file" 2>/dev/null || true)")"
  progress="$(progress_value "$file")"
  task="$(status_task "$file" 2>/dev/null || true)"
  prev_task="$(status_previous_task "$file" 2>/dev/null || true)"
  next_task="$(status_next_task "$file" 2>/dev/null || true)"
  verdict="$(status_verdict "$file" 2>/dev/null || true)"
  notes="$(status_notes "$file" 2>/dev/null || true)"
  updated="$(status_updated "$file" 2>/dev/null || true)"
  last_progress_at="$(status_last_progress_at "$file" 2>/dev/null || true)"
  prev_ended_at="$(status_previous_task_ended_at "$file" 2>/dev/null || true)"
  curr_started_at="$(status_current_task_started_at "$file" 2>/dev/null || true)"

  prev_progress="$(get_prev_progress "$role")"
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

  cat <<MD

## $role

- **State:** ${state}
- **Progress:** $(progress_bar "$progress")
- **Delta vs previous:** ${delta:-n/a}
- **Previous task:** ${prev_task:--}
- **Current task:** ${task:--}
- **Next task:** ${next_task:--}
- **Stale since progress:** ${stale_h:-n/a}
- **Handoff wait:** ${handoff_wait:-n/a}
- **Verdict:** ${verdict:--}
- **Updated:** ${updated:--}
- **Notes:** ${notes:--}

MD
}

{
  echo "# Live Execution Dashboard"
  echo
  echo "_Generated: $(date '+%Y-%m-%d %H:%M:%S')_"
  echo
  echo "## Summary table"
  echo
  echo "| Role | State | Progress | Delta | Stale | Handoff wait | Current task |"
  echo "|---|---|---:|---:|---:|---:|---|"

  for item in "${roles[@]}"; do
    role="${item%%:*}"
    file="${item#*:}"

    state="$(state_label "$(status_state "$file" 2>/dev/null || true)")"
    progress="$(progress_value "$file")"
    task="$(status_task "$file" 2>/dev/null || true)"
    last_progress_at="$(status_last_progress_at "$file" 2>/dev/null || true)"
    prev_ended_at="$(status_previous_task_ended_at "$file" 2>/dev/null || true)"
    curr_started_at="$(status_current_task_started_at "$file" 2>/dev/null || true)"

    prev_progress="$(get_prev_progress "$role")"
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

    echo "| $role | $state | ${progress}% | ${delta:-n/a} | ${stale_h:-n/a} | ${handoff_wait:-n/a} | ${task:--} |"
  done

  echo
  echo "## Blocking signals"
  echo

  blocking=0
  for item in "${roles[@]}"; do
    role="${item%%:*}"
    file="${item#*:}"
    state="$(status_state "$file" 2>/dev/null || true)"
    stale_sec="$(age_seconds "$(status_last_progress_at "$file" 2>/dev/null || true)")"

    if [ "$state" = "READY_FOR_QC" ]; then
      echo "- **$role** is waiting for QC verdict."
      blocking=1
    elif [ "$state" = "REWORK" ]; then
      echo "- **$role** has rework pending."
      blocking=1
    elif [[ "$stale_sec" =~ ^[0-9]+$ ]] && [ "$stale_sec" -gt 600 ] && [ "$role" != "PRODUCT_OWNER" ] && [ "$role" != "QC" ]; then
      echo "- **$role** is stale for $(human_age "$stale_sec")."
      blocking=1
    fi
  done
  [ "$blocking" -eq 0 ] && echo "- none"

  echo
  echo "## Detailed role view"

  for item in "${roles[@]}"; do
    role="${item%%:*}"
    file="${item#*:}"
    render_block "$role" "$file"
  done

} > "$OUT"

[ -f "$CURRENT" ] && cp "$CURRENT" "$PREVIOUS"
mv "$tmp" "$CURRENT"

echo "Wrote: $OUT"
