#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CUR="$ROOT/docs/squad/LIVE_EXECUTION_DASHBOARD.md"
PREV="$ROOT/docs/squad/history/LIVE_EXECUTION_DASHBOARD.prev.md"
STAMP_DIR="$ROOT/docs/squad/history/snapshots"

mkdir -p "$STAMP_DIR"

if [ -f "$CUR" ]; then
  cp "$CUR" "$PREV"
  cp "$CUR" "$STAMP_DIR/LIVE_EXECUTION_DASHBOARD_$(date '+%Y%m%d_%H%M%S').md"
fi

echo "Saved previous dashboard snapshot."
