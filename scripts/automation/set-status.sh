#!/usr/bin/env bash
# Canonical writer for docs/status/*.status — always use this (ROLE, LAST_PROGRESS_AT,
# PROGRESS, history snapshot). Other automation should call this script, not echo/python into .status.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ROLE="${1:?missing role}"
STATE="${2:?missing state}"
TASK="${3:-}"
REPORT="${4:-}"
VERDICT="${5:-}"
NOTES="${6:-}"
PROGRESS="${7:-0}"

mkdir -p "$ROOT/docs/status" "$ROOT/docs/status/.history"
FILE="$ROOT/docs/status/$(tr '[:upper:]' '[:lower:]' <<< "$ROLE" | tr '_' '-').status"
STAMP="$(date '+%Y%m%d-%H%M%S')"

tmp="$(mktemp)"
now="$(date '+%Y-%m-%d %H:%M:%S')"
{
  echo "ROLE=$ROLE"
  echo "STATE=$STATE"
  echo "TASK=$TASK"
  echo "REPORT=$REPORT"
  echo "VERDICT=$VERDICT"
  echo "UPDATED_AT=$now"
  echo "LAST_PROGRESS_AT=$now"
  echo "NOTES=$NOTES"
  echo "PROGRESS=$PROGRESS"
  echo
} > "$tmp"

cp "$tmp" "$FILE"
cp "$tmp" "$ROOT/docs/status/.history/$(basename "$FILE" .status)-$STAMP.status"
rm -f "$tmp"
