#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STALL_FILE="$ROOT/docs/squad/STALL_STATUS.md"
ALERTS_FILE="$ROOT/docs/squad/EXECUTION_ALERTS.md"

STALL_STATUS="OK"
SAME_COUNT="0"
# Do not `source` STALL_STATUS.md — UPDATED_AT contains spaces and breaks the shell.
if [ -f "$STALL_FILE" ]; then
  STALL_STATUS="$(grep '^STATUS=' "$STALL_FILE" | head -1 | cut -d= -f2- | tr -d '\r')"
  SAME_COUNT="$(grep '^SAME_COUNT=' "$STALL_FILE" | head -1 | cut -d= -f2- | tr -d '\r')"
fi

HAS_REWORK=0
if [ -f "$ALERTS_FILE" ] && grep -q "rework required now" "$ALERTS_FILE"; then
  HAS_REWORK=1
fi

NOTE="Monitoring execution"
PROGRESS="95"
if [ "${STALL_STATUS:-OK}" = "STALL" ]; then
  NOTE="Stall detected for ${SAME_COUNT:-0} consecutive loops; PO must intervene now"
  PROGRESS="92"
elif [ "$HAS_REWORK" -eq 1 ]; then
  NOTE="Active bottleneck detected in execution alerts; PO must intervene now"
  PROGRESS="92"
fi

# Canonical status shape (ROLE, LAST_PROGRESS_AT, PROGRESS, .history) — always via set-status.sh
"$ROOT/scripts/automation/set-status.sh" \
  "PRODUCT_OWNER" \
  "IMPLEMENTING" \
  "Resolve bottlenecks and keep board/dashboard current" \
  "" \
  "" \
  "$NOTE" \
  "$PROGRESS"

echo "PO intervention check complete."
