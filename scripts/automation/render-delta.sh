#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STATUS_DIR="$ROOT/docs/status"
SNAPSHOT_DIR="$ROOT/docs/status-snapshots"
CURRENT="$SNAPSHOT_DIR/current.snapshot"
PREVIOUS="$SNAPSHOT_DIR/previous.snapshot"

mkdir -p "$SNAPSHOT_DIR"

tmp="$(mktemp)"

for f in "$STATUS_DIR"/*.status; do
  [ -f "$f" ] || continue
  role="$(basename "$f" .status | tr '[:lower:]-' '[:upper:]_')"
  awk -v role="$role" '
    BEGIN { state=""; task=""; verdict=""; updated="" }
    /^STATE=/      { sub(/^STATE=/,""); state=$0 }
    /^TASK=/       { sub(/^TASK=/,""); task=$0 }
    /^VERDICT=/    { sub(/^VERDICT=/,""); verdict=$0 }
    /^UPDATED_AT=/ { sub(/^UPDATED_AT=/,""); updated=$0 }
    END {
      printf "%s|%s|%s|%s|%s\n", role, state, task, verdict, updated
    }
  ' "$f" | tail -n 1 >> "$tmp"
done

if [ -f "$CURRENT" ]; then
  cp "$CURRENT" "$PREVIOUS"
fi
cp "$tmp" "$CURRENT"
rm -f "$tmp"

echo "=== DELTA VS PREVIOUS ==="
echo

if [ ! -f "$PREVIOUS" ]; then
  echo "No previous snapshot yet."
  exit 0
fi

joined="$(mktemp)"
join -t '|' -a1 -a2 -e 'NONE' -o auto \
  <(sort "$PREVIOUS") \
  <(sort "$CURRENT") > "$joined" || true

printed=0
while IFS='|' read -r role old_state old_task old_verdict old_updated new_state new_task new_verdict new_updated; do
  changed=0
  if [ "$old_state" != "$new_state" ]; then changed=1; fi
  if [ "$old_task" != "$new_task" ]; then changed=1; fi
  if [ "$old_verdict" != "$new_verdict" ]; then changed=1; fi
  if [ "$old_updated" != "$new_updated" ]; then changed=1; fi

  if [ "$changed" -eq 1 ]; then
    printed=1
    echo "$role"
    [ "$old_state" != "$new_state" ] && echo "  - state: $old_state -> $new_state"
    [ "$old_task" != "$new_task" ] && echo "  - task: $old_task -> $new_task"
    [ "$old_verdict" != "$new_verdict" ] && echo "  - verdict: $old_verdict -> $new_verdict"
    [ "$old_updated" != "$new_updated" ] && echo "  - updated_at: $old_updated -> $new_updated"
    echo
  fi
done < "$joined"

rm -f "$joined"

if [ "$printed" -eq 0 ]; then
  echo "No status change since previous snapshot."
fi
