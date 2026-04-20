#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source "$ROOT/scripts/automation/status-lib.sh"

echo "=== QC NEXT REVIEW TARGETS ==="
found=0

for item in \
  "AGENT_1:$ROOT/docs/status/agent-1.status" \
  "AGENT_2:$ROOT/docs/status/agent-2.status" \
  "AGENT_3:$ROOT/docs/status/agent-3.status"
do
  role="${item%%:*}"
  file="${item#*:}"
  state="$(status_state "$file" 2>/dev/null || true)"
  if [ "$state" = "READY_FOR_QC" ]; then
    found=1
    echo
    echo "$role"
    echo "  state:   $(state_label "$state")"
    echo "  progress: $(progress_value "$file")%"
    echo "  previous: $(status_previous_task "$file" 2>/dev/null || echo)"
    echo "  current:  $(status_task "$file" 2>/dev/null || echo)"
    echo "  next:     $(status_next_task "$file" 2>/dev/null || echo)"
    echo "  report:   $(status_report "$file" 2>/dev/null || echo)"
    echo "  verdict:  $(status_verdict "$file" 2>/dev/null || echo NONE)"
  fi
done

[ "$found" -eq 0 ] && echo && echo "No agents currently waiting in READY_FOR_QC."
