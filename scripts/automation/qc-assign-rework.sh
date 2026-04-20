#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 4 ]; then
  echo "Usage:"
  echo "  $0 agent-1|agent-2|agent-3 <qc_report_path> <status> <instruction...>"
  echo
  echo "Example:"
  echo "  $0 agent-2 docs/qc-reports/qc-verdict-agent-2-xyz.md REWORK 'Fix route response shape in backend/src/modules/job-radar/api/job-radar.express.router.ts and update delivery report.'"
  exit 1
fi

AGENT="$1"
QC_REPORT="$2"
STATUS_VALUE="$3"
shift 3
INSTRUCTION="$*"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
HANDOFF_FILE="$ROOT/docs/qc-handoffs/${AGENT}-next-action.md"
STATUS_FILE="$ROOT/docs/status/${AGENT}.status"
NOW="$(date '+%Y-%m-%d %H:%M:%S')"
AGENT_TITLE="$(printf '%s' "$AGENT" | tr '[:lower:]' '[:upper:]')"

cat > "$HANDOFF_FILE" <<EOF2
# ${AGENT_TITLE} — QC Next Action

Status: $STATUS_VALUE
Updated At: $NOW
Source QC Report: $QC_REPORT
Instruction:
- $INSTRUCTION
EOF2

source "$ROOT/scripts/automation/status-lib.sh"

case "$AGENT" in
  agent-1) ROLE="AGENT_1" ;;
  agent-2) ROLE="AGENT_2" ;;
  agent-3) ROLE="AGENT_3" ;;
  *) echo "Unknown agent: $AGENT (expected agent-1|agent-2|agent-3)" >&2; exit 1 ;;
esac

TASK="$(status_task "$STATUS_FILE" 2>/dev/null || true)"
REPORT="$(status_report "$STATUS_FILE" 2>/dev/null || true)"
VERDICT=""
STATE_OUT=""
PROGRESS="50"

case "$STATUS_VALUE" in
  REWORK)
    STATE_OUT="REWORK"
    VERDICT="Rework Required"
    PROGRESS="60"
    ;;
  READY_FOR_QC)
    STATE_OUT="READY_FOR_QC"
    VERDICT=""
    PROGRESS="75"
    ;;
  APPROVED_FOR_INTEGRATION)
    STATE_OUT="APPROVED_FOR_INTEGRATION"
    VERDICT="Approved For Integration"
    PROGRESS="100"
    ;;
  *)
    echo "Unknown status value: $STATUS_VALUE (use REWORK|READY_FOR_QC|APPROVED_FOR_INTEGRATION)" >&2
    exit 1
    ;;
esac

"$ROOT/scripts/automation/set-status.sh" "$ROLE" "$STATE_OUT" "$TASK" "$REPORT" "$VERDICT" "$INSTRUCTION" "$PROGRESS"

echo "Updated:"
echo "  $HANDOFF_FILE"
echo "  $STATUS_FILE"
