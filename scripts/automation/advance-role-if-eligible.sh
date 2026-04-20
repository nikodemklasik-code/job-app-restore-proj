#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
source "$ROOT/scripts/automation/task-pipeline-lib.sh"

role="${1:?usage: advance-role-if-eligible.sh ROLE}"

status_file="$(role_status_file "$role")"
[ -f "$status_file" ] || { echo "Missing status file for $role"; exit 1; }

current_key="$(guess_current_task_key "$role")"
next_key="$(next_task_key_for_role "$role" "$current_key")"

if [ -z "${next_key:-}" ]; then
  echo "$role: no next task in pipeline"
  exit 0
fi

if ! should_advance_role "$role" "$current_key"; then
  echo "$role: not eligible for auto-advance yet"
  exit 0
fi

next_title="$(task_title_by_key "$next_key")"

case "$role" in
  AGENT_1|AGENT_2|AGENT_3)
    append_status_block "$status_file" "IMPLEMENTING" "$next_title" "" "" "Auto-advanced by pipeline after approved previous bounded slice"
    ;;
  PRODUCT_OWNER)
    append_status_block "$status_file" "IMPLEMENTING" "$next_title" "" "" "Auto-rotated operational task"
    ;;
  QC)
    append_status_block "$status_file" "REVIEWING" "$next_title" "" "" "Auto-rotated review task"
    ;;
esac

echo "$role: advanced to -> $next_title"
