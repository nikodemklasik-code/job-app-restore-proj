#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source "$ROOT/scripts/automation/status-lib.sh"
source "$ROOT/scripts/automation/task-chain-lib.sh"

advance_agent_if_needed() {
  local role="${1:?missing role}"
  local file="$ROOT/docs/status/$(tr '[:upper:]' '[:lower:]' <<< "$role" | tr '_' '-').status"
  local state task verdict progress ord next_t next_r
  state="$(status_state "$file")"
  task="$(status_task "$file")"
  verdict="$(status_verdict "$file")"
  progress="$(status_progress "$file")"
  ord="$(current_order_from_status "$role" "$task")"
  next_t="$(next_task "$role" "$ord")"
  next_r="$(next_report "$role" "$ord")"

  if [[ "$state" == "APPROVED_FOR_INTEGRATION" || "$state" == "APPROVED_AWAITING_NEXT_ASSIGNMENT" ]]; then
    if [[ "$next_t" != "-" && -n "${next_t// }" ]]; then
      if [[ -n "${next_r// }" && -f "$ROOT/$next_r" ]]; then
        "$ROOT/scripts/automation/set-status.sh" "$role" "ASSIGNED" "$next_t" "$next_r" "" "Auto-advanced after QC approval" "25"
        echo "$role: advanced to next task -> $next_t"
      else
        "$ROOT/scripts/automation/set-status.sh" "$role" "APPROVED_AWAITING_NEXT_ASSIGNMENT" "$task" "$(status_report "$file")" "$verdict" "Next task report missing: $next_r" "100"
        echo "$role: next report missing, waiting for PO -> $next_r"
      fi
    else
      "$ROOT/scripts/automation/set-status.sh" "$role" "APPROVED_AWAITING_NEXT_ASSIGNMENT" "$task" "$(status_report "$file")" "$verdict" "Task chain complete for this role" "100"
      echo "$role: no more tasks in chain"
    fi
    return
  fi

  if [[ "$state" == "REWORK" ]]; then
    echo "$role: staying on rework -> $task"
    return
  fi

  if [[ "$state" == "READY_FOR_QC" ]]; then
    echo "$role: waiting on QC -> $task"
    return
  fi

  if [[ "$state" == "IMPLEMENTING" || "$state" == "ASSIGNED" ]]; then
    echo "$role: active on current task -> $task"
    return
  fi

  if [[ -z "${state// }" || "$state" == "UNKNOWN" ]]; then
    if [[ "$ord" -eq 0 ]]; then
      local first_t first_r
      first_t="$(current_task "$role" 1)"
      first_r="$(current_report "$role" 1)"
      if [[ "$first_t" != "-" && -n "${first_r// }" && -f "$ROOT/$first_r" ]]; then
        "$ROOT/scripts/automation/set-status.sh" "$role" "ASSIGNED" "$first_t" "$first_r" "" "Initialized from task chain" "25"
        echo "$role: initialized -> $first_t"
      elif [[ "$first_t" != "-" ]]; then
        echo "$role: chain start blocked, first report missing -> $first_r"
      fi
    fi
  fi
}

update_qc_and_po() {
  local ready_roles=()
  local rework_roles=()
  local role file state task
  for role in AGENT_1 AGENT_2 AGENT_3; do
    file="$ROOT/docs/status/$(tr '[:upper:]' '[:lower:]' <<< "$role" | tr '_' '-').status"
    state="$(status_state "$file")"
    task="$(status_task "$file")"
    [[ "$state" == "READY_FOR_QC" ]] && ready_roles+=("$role:$task")
    [[ "$state" == "REWORK" ]] && rework_roles+=("$role:$task")
  done

  if (( ${#ready_roles[@]} > 0 )); then
    "$ROOT/scripts/automation/set-status.sh" "QC" "REVIEWING" "Review READY_FOR_QC slices: ${ready_roles[*]}" "docs/qc-reports/qc-active-review-cycle.md" "" "QC intake active" "75"
    "$ROOT/scripts/automation/set-status.sh" "PRODUCT_OWNER" "ACTIVE" "Force QC intake on READY_FOR_QC slices and keep statuses in sync" "" "" "READY_FOR_QC bottleneck present" "90"
  elif (( ${#rework_roles[@]} > 0 )); then
    "$ROOT/scripts/automation/set-status.sh" "QC" "MONITORING" "Monitor rework and resubmissions: ${rework_roles[*]}" "docs/qc-reports/qc-rework-monitoring-cycle.md" "" "Rework queue active" "85"
    "$ROOT/scripts/automation/set-status.sh" "PRODUCT_OWNER" "ACTIVE" "Resolve bottlenecks immediately when any role stalls" "" "" "Rework detected, pushing fix path" "92"
  else
    "$ROOT/scripts/automation/set-status.sh" "QC" "MONITORING" "Repo risk sweep when no fresh intake exists" "docs/qc-reports/qc-repo-risk-sweep-cycle.md" "" "No fresh READY_FOR_QC intake" "100"
    "$ROOT/scripts/automation/set-status.sh" "PRODUCT_OWNER" "ACTIVE" "Keep tranche plan full so agents never run out of work" "" "" "No intake bottleneck, maintain next tasks" "95"
  fi
}

main() {
  advance_agent_if_needed AGENT_1
  advance_agent_if_needed AGENT_2
  advance_agent_if_needed AGENT_3
  update_qc_and_po
}
main "$@"
