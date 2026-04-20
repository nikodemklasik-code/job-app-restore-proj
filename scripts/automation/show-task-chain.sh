#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
source "$ROOT/scripts/automation/task-pipeline-lib.sh"

roles=(AGENT_1 AGENT_2 AGENT_3 PRODUCT_OWNER QC)

shorten() {
  local s="${1:-}"
  local n="${2:-38}"
  if [ "${#s}" -le "$n" ]; then
    printf "%s" "$s"
  else
    printf "%s..." "${s:0:$((n-3))}"
  fi
}

echo "=== ACTIVE TASK CHAIN ==="
echo
printf "%-14s | %-38s | %-38s | %-38s\n" "ROLE" "PREVIOUS TASK" "CURRENT TASK" "NEXT TASK"
printf '%.0s-' {1..140}
echo

for role in "${roles[@]}"; do
  status_file="$(role_status_file "$role")"
  current_key="$(guess_current_task_key "$role" || true)"
  prev_key="$(previous_task_key_for_role "$role" "$current_key" || true)"
  next_key="$(next_task_key_for_role "$role" "$current_key" || true)"

  current_from_status="-"
  [ -f "$status_file" ] && current_from_status="$(status_task "$status_file")"

  prev_title="$(task_title_by_key "$prev_key" || true)"
  current_title="$(task_title_by_key "$current_key" || true)"
  next_title="$(task_title_by_key "$next_key" || true)"

  prev_title="$(normalize_empty "$prev_title")"
  current_title="$(normalize_empty "${current_title:-$current_from_status}")"
  next_title="$(normalize_empty "$next_title")"

  if [ "$current_title" = "-" ] && [ -n "${current_from_status// }" ]; then
    current_title="$current_from_status"
  fi

  printf "%-14s | %-38s | %-38s | %-38s\n" \
    "$role" \
    "$(shorten "$prev_title" 38)" \
    "$(shorten "$current_title" 38)" \
    "$(shorten "$next_title" 38)"
done

echo
echo "=== NEXT AUTO-ADVANCE CHECK ==="
for role in "${roles[@]}"; do
  current_key="$(guess_current_task_key "$role" || true)"
  if should_advance_role "$role" "$current_key"; then
    echo "$role: eligible for auto-advance"
  else
    echo "$role: not eligible for auto-advance yet"
  fi
done
