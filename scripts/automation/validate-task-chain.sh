#!/usr/bin/env bash
# Validates AUTO_TASK_CHAIN.tsv: every AGENT_* row with a non-empty REPORT_PATH must
# resolve to an existing file under the repo root. (QC/PO placeholder rows are skipped.)
#
# Exit codes (stable for PO / CI):
#   0 — all AGENT_* report paths exist
#   2 — one or more REPORT_PATH files missing (operational fix: create file or trim chain row)
#   5 — chain file missing or unreadable
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CHAIN="$ROOT/docs/squad/AUTO_TASK_CHAIN.tsv"

if [[ ! -f "$CHAIN" ]]; then
  echo "FATAL: chain file not found: $CHAIN" >&2
  exit 5
fi

fail=0
ok=0
missing=0
while IFS=$'\t' read -r role id task report; do
  if [[ -f "$ROOT/$report" ]]; then
    echo "OK      $role | $id | $task | $report"
    ok=$((ok + 1))
  else
    echo "MISSING $role | $id | $task | $report"
    missing=$((missing + 1))
    fail=1
  fi
done < <(awk -F'\t' 'NR>1 && NF>=5 && $5 != "" && $1 ~ /^AGENT_/ { print $1 "\t" $2 "\t" $4 "\t" $5 }' "$CHAIN")

echo "----"
echo "Summary: ok=$ok missing=$missing (AGENT_* rows with REPORT_PATH only)"
if [[ "$fail" -ne 0 ]]; then
  echo "" >&2
  echo "PO / operator fix (predictable class: missing RFQ on disk):" >&2
  echo "  1) Create each missing path under repo root, OR" >&2
  echo "  2) Remove that row from docs/squad/AUTO_TASK_CHAIN.tsv until the RFQ exists." >&2
  echo "Run In: $ROOT" >&2
  echo "Correct command: cd $ROOT && bash scripts/automation/validate-task-chain.sh" >&2
  exit 2
fi
exit 0
