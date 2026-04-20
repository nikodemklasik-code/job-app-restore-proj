#!/usr/bin/env bash
# Runs render-pretty-dashboard + show-pretty-terminal on an interval so status deltas
# and LIVE_EXECUTION_DASHBOARD.md stay fresh without a human re-running the script.
#
# Run In: /Users/nikodem/job-app-restore/proj
# Foreground:  cd /Users/nikodem/job-app-restore/proj && ./scripts/automation/run-pretty-terminal-daemon.sh
# Background:   cd /Users/nikodem/job-app-restore/proj && nohup ./scripts/automation/run-pretty-terminal-daemon.sh >/dev/null 2>&1 &
# Stop:          kill "$(cat docs/squad/.snapshots/pretty-terminal-daemon.pid)" 2>/dev/null || true
#
# Env:
#   PRETTY_DAEMON_INTERVAL_SEC  default 30
#   PRETTY_DAEMON_LOG         default logs/pretty-terminal-daemon.log
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

INTERVAL="${PRETTY_DAEMON_INTERVAL_SEC:-30}"
LOG="${PRETTY_DAEMON_LOG:-$ROOT/logs/pretty-terminal-daemon.log}"
PIDFILE="$ROOT/docs/squad/.snapshots/pretty-terminal-daemon.pid"
mkdir -p "$ROOT/docs/squad/.snapshots" "$ROOT/logs"

if [ -f "$PIDFILE" ]; then
  old="$(cat "$PIDFILE" 2>/dev/null || true)"
  if [ -n "${old:-}" ] && kill -0 "$old" 2>/dev/null; then
    echo "Pretty-terminal daemon already running (pid $old). Exit." >&2
    exit 1
  fi
fi
echo $$ > "$PIDFILE"
trap 'rm -f "$PIDFILE"' EXIT

echo "pretty-terminal-daemon started pid=$$ interval=${INTERVAL}s log=$LOG"

while true; do
  ts="$(date '+%Y-%m-%d %H:%M:%S')"
  {
    echo ""
    echo "======== $ts ========"
    "$ROOT/scripts/automation/render-pretty-dashboard.sh" 2>&1 || true
    "$ROOT/scripts/automation/show-pretty-terminal.sh" 2>&1 || true
    echo "=== qc-next (hints) ==="
    "$ROOT/scripts/automation/qc-next.sh" 2>&1 || true
    echo "=== po-next (hints) ==="
    "$ROOT/scripts/automation/po-next.sh" 2>&1 || true
  } >> "$LOG" 2>&1
  sleep "$INTERVAL"
done
