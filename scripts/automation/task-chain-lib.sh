#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CHAIN_FILE="$ROOT/docs/squad/AUTO_TASK_CHAIN.tsv"

chain_row() {
  local role="${1:?missing role}"
  local order="${2:?missing order}"
  awk -F'\t' -v role="$role" -v ord="$order" '
    NR > 1 && $1 == role && $3 == ord { print; exit }
  ' "$CHAIN_FILE"
}

chain_field() {
  local role="${1:?missing role}"
  local order="${2:?missing order}"
  local col="${3:?missing col}"
  local row
  row="$(chain_row "$role" "$order" || true)"
  [[ -n "$row" ]] || return 0
  awk -F'\t' -v c="$col" '{ print $c }' <<< "$row"
}

chain_max_order() {
  local role="${1:?missing role}"
  awk -F'\t' -v role="$role" '
    NR > 1 && $1 == role { if ($3 > max) max = $3 }
    END { print max + 0 }
  ' "$CHAIN_FILE"
}

current_order_from_status() {
  local role="${1:?missing role}"
  local task="${2:-}"
  [[ -n "${task// }" ]] || { echo "0"; return; }
  awk -F'\t' -v role="$role" -v task="$task" '
    NR > 1 && $1 == role && $4 == task { print $3; found=1; exit }
    END { if (!found) print 0 }
  ' "$CHAIN_FILE"
}

previous_task() {
  local role="${1:?missing role}"
  local ord="${2:-0}"
  (( ord > 1 )) || { echo "-"; return; }
  chain_field "$role" "$((ord-1))" 4
}

current_task() {
  local role="${1:?missing role}"
  local ord="${2:-0}"
  (( ord > 0 )) || { echo "-"; return; }
  chain_field "$role" "$ord" 4
}

next_task() {
  local role="${1:?missing role}"
  local ord="${2:-0}"
  local max
  max="$(chain_max_order "$role")"
  (( ord < max )) || { echo "-"; return; }
  chain_field "$role" "$((ord+1))" 4
}

current_report() {
  local role="${1:?missing role}"
  local ord="${2:-0}"
  (( ord > 0 )) || { echo ""; return; }
  chain_field "$role" "$ord" 5
}

next_report() {
  local role="${1:?missing role}"
  local ord="${2:-0}"
  local max
  max="$(chain_max_order "$role")"
  (( ord < max )) || { echo ""; return; }
  chain_field "$role" "$((ord+1))" 5
}
