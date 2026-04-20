#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 agent-1|agent-2|agent-3"
  exit 1
fi

AGENT="$1"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "=== AGENT COMMAND ==="
cat "$ROOT/docs/today-reset/${AGENT}/COMMAND.txt"
echo
echo "=== QC NEXT ACTION ==="
cat "$ROOT/docs/qc-handoffs/${AGENT}-next-action.md"
echo
echo "=== AGENT STATUS ==="
cat "$ROOT/docs/status/${AGENT}.status"
