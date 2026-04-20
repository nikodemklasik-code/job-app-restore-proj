#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CUR="$ROOT/docs/squad/LIVE_EXECUTION_DASHBOARD.md"
PREV_HASH_FILE="$ROOT/tmp/live_dashboard.prev.hash"
STREAK_FILE="$ROOT/tmp/live_dashboard.same_count"
STALL_FILE="$ROOT/docs/squad/STALL_STATUS.md"

if [ ! -f "$CUR" ]; then
  echo "STATUS=NO_DASHBOARD" > "$STALL_FILE"
  echo "SAME_COUNT=0" >> "$STALL_FILE"
  exit 0
fi

CUR_HASH="$(shasum "$CUR" | awk '{print $1}')"
PREV_HASH=""
SAME_COUNT=0

[ -f "$PREV_HASH_FILE" ] && PREV_HASH="$(cat "$PREV_HASH_FILE")"
[ -f "$STREAK_FILE" ] && SAME_COUNT="$(cat "$STREAK_FILE")"

if [ "$CUR_HASH" = "$PREV_HASH" ]; then
  SAME_COUNT=$((SAME_COUNT + 1))
else
  SAME_COUNT=0
fi

echo "$CUR_HASH" > "$PREV_HASH_FILE"
echo "$SAME_COUNT" > "$STREAK_FILE"

STATUS="OK"
if [ "$SAME_COUNT" -ge 5 ]; then
  STATUS="STALL"
fi

{
  echo "STATUS=$STATUS"
  echo "SAME_COUNT=$SAME_COUNT"
  echo "UPDATED_AT=$(date '+%Y-%m-%d %H:%M:%S')"
} > "$STALL_FILE"

echo "Wrote: $STALL_FILE"
