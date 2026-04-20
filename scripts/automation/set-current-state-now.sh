#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
mkdir -p "$ROOT/docs/status"

SS="$ROOT/scripts/automation/set-status.sh"

# Demo / bootstrap snapshot — same canonical format as agents use (set-status.sh + .history)
"$SS" AGENT_1 READY_FOR_QC \
  "Backend runtime hardening" \
  "docs/qc-reports/agent-1-runtime-hardening-ready-for-qc.md" \
  "" \
  "Runtime hardening done, waiting for QC verdict" \
  "14"

"$SS" AGENT_2 READY_FOR_QC \
  "Job Radar bounded parity" \
  "docs/qc-reports/agent-2-job-radar-bounded-parity-ready-for-qc.md" \
  "" \
  "Bounded parity fix done, waiting for QC verdict" \
  "100"

"$SS" AGENT_3 READY_FOR_QC \
  "Legacy interview billing parity" \
  "docs/qc-reports/agent-3-legacy-interview-billing-ready-for-qc.md" \
  "" \
  "Legacy interview billing parity verified, waiting for QC verdict" \
  "27"

"$SS" PRODUCT_OWNER ACTIVE \
  "Force QC intake on 3 READY_FOR_QC slices and keep board/dashboard in sync" \
  "" \
  "" \
  "Monitoring bottlenecks and preparing next bounded tranche" \
  "90"

"$SS" QC REVIEWING \
  "Review 3 READY_FOR_QC slices: Agent 1, Agent 2, Agent 3" \
  "docs/qc-reports/qc-active-review-cycle.md" \
  "" \
  "Fresh intake present, verdicts required" \
  "38"

echo "Current statuses set."

if [[ -x "$ROOT/scripts/automation/auto-advance-task-chain.sh" ]]; then
  echo
  echo "Running auto-advance once..."
  "$ROOT/scripts/automation/auto-advance-task-chain.sh" || true
fi

echo
if [[ -x "$ROOT/scripts/automation/show-live-execution-ops.sh" ]]; then
  "$ROOT/scripts/automation/show-live-execution-ops.sh" || true
else
  echo "show-live-execution-ops.sh not found"
fi

echo
echo "START LOOP:"
echo "$ROOT/scripts/automation/run-task-engine-loop.sh"
