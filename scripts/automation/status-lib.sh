#!/usr/bin/env bash
set -euo pipefail

extract_latest_status_block() {
  local file="${1:?missing file}"
  awk '
    BEGIN { block=""; current="" }
    /^STATE=/ {
      if (current != "") block = current
      current = $0 "\n"
      next
    }
    current != "" { current = current $0 "\n" }
    END {
      if (current != "") block = current
      printf "%s", block
    }
  ' "$file"
}

status_field() {
  local file="${1:?missing file}"
  local key="${2:?missing key}"
  extract_latest_status_block "$file" | awk -F= -v k="$key" '
    $1 == k {
      sub($1 "=","")
      print
      exit
    }
  '
}

# Normalize blank / whitespace-only fields for display (e.g. check-execution-state.sh).
normalize_empty() {
  local v="${1:-}"
  if [ -z "${v// }" ]; then
    echo "-"
  else
    printf '%s' "$v"
  fi
}

status_state()                  { status_field "$1" "STATE"; }
status_task()                   { status_field "$1" "TASK"; }
status_report()                 { status_field "$1" "REPORT"; }
status_verdict()                { status_field "$1" "VERDICT"; }
status_updated()                { status_field "$1" "UPDATED_AT"; }
status_notes()                  { status_field "$1" "NOTES"; }
status_progress()               { status_field "$1" "PROGRESS"; }
status_previous_task()          { status_field "$1" "PREVIOUS_TASK"; }
status_previous_task_ended_at() { status_field "$1" "PREVIOUS_TASK_ENDED_AT"; }
status_current_task_started_at(){ status_field "$1" "CURRENT_TASK_STARTED_AT"; }
status_last_progress_at()       { status_field "$1" "LAST_PROGRESS_AT"; }
status_next_task()              { status_field "$1" "NEXT_TASK"; }

state_label() {
  case "${1:-}" in
    IDLE) echo "IDLE" ;;
    ASSIGNED) echo "ASSIGNED" ;;
    IMPLEMENTING) echo "IMPLEMENTING" ;;
    READY_FOR_QC) echo "READY_FOR_QC" ;;
    REVIEWING) echo "REVIEWING" ;;
    REWORK) echo "REWORK" ;;
    APPROVED_FOR_INTEGRATION) echo "APPROVED_FOR_INTEGRATION" ;;
    APPROVED_AWAITING_NEXT_ASSIGNMENT) echo "APPROVED_AWAITING_NEXT_ASSIGNMENT" ;;
    ACTIVE) echo "ACTIVE" ;;
    ACTIVE_MERGE_GATE) echo "ACTIVE_MERGE_GATE" ;;
    MONITORING) echo "MONITORING" ;;
    P0_SLICES_COMPLETE) echo "P0_SLICES_COMPLETE" ;;
    BLOCKED) echo "BLOCKED" ;;
    *) echo "UNKNOWN" ;;
  esac
}

progress_value() {
  local file="${1:?missing file}"
  local p
  p="$(status_progress "$file" 2>/dev/null || true)"
  if [[ "$p" =~ ^[0-9]+$ ]]; then
    if [ "$p" -lt 0 ]; then p=0; fi
    if [ "$p" -gt 100 ]; then p=100; fi
    echo "$p"
    return
  fi

  case "$(status_state "$file" 2>/dev/null || true)" in
    IDLE) echo "0" ;;
    ASSIGNED) echo "25" ;;
    IMPLEMENTING) echo "50" ;;
    READY_FOR_QC) echo "75" ;;
    REVIEWING) echo "75" ;;
    REWORK) echo "60" ;;
    APPROVED_FOR_INTEGRATION) echo "100" ;;
    BLOCKED) echo "15" ;;
    *) echo "0" ;;
  esac
}

progress_bar() {
  local pct="${1:-0}"
  local filled=$((pct / 10))
  local empty=$((10 - filled))
  local left="" right=""
  [ "$filled" -gt 0 ] && left="$(printf '█%.0s' $(seq 1 "$filled"))"
  [ "$empty" -gt 0 ] && right="$(printf '░%.0s' $(seq 1 "$empty"))"
  printf '[%s%s] %s%%' "$left" "$right" "$pct"
}

ts_to_epoch() {
  local raw="${1:-}"
  [ -z "$raw" ] && return 1
  raw="${raw/T/ }"
  raw="${raw/Z/}"

  # GNU date (Linux)
  if date -d "$raw" "+%s" >/dev/null 2>&1; then
    date -d "$raw" "+%s"
    return 0
  fi

  # BSD date (macOS)
  if date -j -f "%Y-%m-%d %H:%M:%S" "$raw" "+%s" >/dev/null 2>&1; then
    date -j -f "%Y-%m-%d %H:%M:%S" "$raw" "+%s"
    return 0
  fi

  if date -j -f "%Y-%m-%d %H:%M" "$raw" "+%s" >/dev/null 2>&1; then
    date -j -f "%Y-%m-%d %H:%M" "$raw" "+%s"
    return 0
  fi

  return 1
}

age_seconds() {
  local raw="${1:-}"
  local now epoch
  epoch="$(ts_to_epoch "$raw" 2>/dev/null || true)"
  [ -z "$epoch" ] && { echo ""; return; }
  now="$(date +%s)"
  echo $((now - epoch))
}

human_age() {
  local s="${1:-}"
  if ! [[ "$s" =~ ^-?[0-9]+$ ]]; then
    echo ""
    return
  fi
  if [ "$s" -lt 0 ]; then s=0; fi
  local h=$((s / 3600))
  local m=$(((s % 3600) / 60))
  local sec=$((s % 60))
  if [ "$h" -gt 0 ]; then
    printf "%sh %sm %ss" "$h" "$m" "$sec"
  elif [ "$m" -gt 0 ]; then
    printf "%sm %ss" "$m" "$sec"
  else
    printf "%ss" "$sec"
  fi
}

delta_value() {
  local current="${1:-}"
  local previous="${2:-}"
  if ! [[ "$current" =~ ^[0-9]+$ ]]; then
    echo "n/a"
    return
  fi
  if ! [[ "$previous" =~ ^[0-9]+$ ]]; then
    echo "n/a"
    return
  fi
  local d=$((current - previous))
  if [ "$d" -gt 0 ]; then
    echo "+$d"
  else
    echo "$d"
  fi
}
