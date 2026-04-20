#!/usr/bin/env bash
# Single PO-facing health gate for the execution automaton.
#
# Exit codes (keep stable; document in docs/squad/AUTOMATION_PO_RUNBOOK.md):
#   0 — chain valid; core status files present and parseable
#   2 — AUTO_TASK_CHAIN.tsv AGENT report paths broken (same as validate-task-chain.sh)
#   3 — missing docs/status/*.status for a tracked role
#   4 — status file exists but latest STATE= block is empty / unreadable
#   5 — chain file missing (should not happen in a healthy clone)
#  10 — --strict: bottleneck signal (stale IMPLEMENTING / long READY_FOR_QC) — optional CI yellow
#
# Usage:
#   cd /path/to/proj && bash scripts/automation/po-automation-health.sh
#   cd /path/to/proj && bash scripts/automation/po-automation-health.sh --strict
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STRICT=0
for arg in "$@"; do
  [[ "$arg" == "--strict" ]] && STRICT=1
done

source "$ROOT/scripts/automation/status-lib.sh"

die() {
  local code="${1:?}"
  shift
  printf '%s\n' "$*" >&2
  exit "$code"
}

echo "=== PO automation health ==="
echo "Repo: $ROOT"
echo "Time: $(date '+%Y-%m-%d %H:%M:%S')"
echo

CHAIN="$ROOT/docs/squad/AUTO_TASK_CHAIN.tsv"
[[ -f "$CHAIN" ]] || die 5 "FATAL: missing $CHAIN"

if ! validate_out="$(bash "$ROOT/scripts/automation/validate-task-chain.sh" 2>&1)"; then
  printf '%s\n' "$validate_out"
  die 2 "CHAIN_INVALID: fix missing REPORT_PATH files or trim AUTO_TASK_CHAIN.tsv (see stderr above)."
fi
printf '%s\n' "$validate_out"
echo

status_roles=(agent-1 agent-2 agent-3 qc product-owner)
for base in "${status_roles[@]}"; do
  f="$ROOT/docs/status/${base}.status"
  if [[ ! -f "$f" ]]; then
    die 3 "STATUS_MISSING: $f — run: cd $ROOT && bash scripts/automation/set-status.sh <ROLE> ..."
  fi
  st="$(status_state "$f" 2>/dev/null || true)"
  if [[ -z "${st// }" ]]; then
    die 4 "STATUS_UNREADABLE: $f has no STATE in latest block — restore one STATE= block (see docs/status/.history/)."
  fi
  echo "OK status  $base -> STATE=$st"
done

warn=0
if [[ "$STRICT" -eq 1 ]]; then
  stale_after=900
  for base in agent-1 agent-2 agent-3; do
    f="$ROOT/docs/status/${base}.status"
    st="$(status_state "$f")"
    lp="$(status_last_progress_at "$f" 2>/dev/null || true)"
    age="$(age_seconds "$lp" 2>/dev/null || true)"
    if [[ "$st" == "IMPLEMENTING" || "$st" == "ASSIGNED" ]]; then
      if [[ "$age" =~ ^[0-9]+$ ]] && [ "$age" -gt "$stale_after" ]; then
        echo "WARN: $base stale ${age}s in $st (threshold ${stale_after}s)" >&2
        warn=1
      fi
    fi
    if [[ "$st" == "READY_FOR_QC" ]]; then
      if [[ "$age" =~ ^[0-9]+$ ]] && [ "$age" -gt "$stale_after" ]; then
        echo "WARN: $base READY_FOR_QC for ${age}s — poke QC" >&2
        warn=1
      fi
    fi
  done
  if [[ "$warn" -ne 0 ]]; then
    die 10 "STRICT_FAIL: stale or stuck signals present (see WARN lines)."
  fi
fi

echo
echo "PASS: automaton prerequisites OK."
echo "Optional: cd $ROOT && bash scripts/automation/po-next.sh"
exit 0
