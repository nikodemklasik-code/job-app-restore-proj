#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PIPELINE="$ROOT/docs/execution/ROLE_TASK_PIPELINE.tsv"
STATUS_DIR="$ROOT/docs/status"

normalize_empty() {
  local v="${1-}"
  if [ -z "${v// }" ]; then
    echo "-"
  else
    echo "$v"
  fi
}

extract_latest_status_block() {
  local file="${1:?missing file}"
  awk '
    BEGIN { block=""; current="" }
    /^STATE=/ {
      if (current != "") block=current
      current=$0 "\n"
      next
    }
    current != "" { current=current $0 "\n" }
    END {
      if (current != "") block=current
      printf "%s", block
    }
  ' "$file"
}

status_field() {
  local file="${1:?missing file}"
  local key="${2:?missing key}"
  extract_latest_status_block "$file" | awk -F= -v k="$key" '$1 == k { sub($1"=",""); print; exit }'
}

status_state()   { status_field "$1" "STATE"; }
status_task()    { status_field "$1" "TASK"; }
status_report()  { status_field "$1" "REPORT"; }
status_verdict() { status_field "$1" "VERDICT"; }
status_updated() { status_field "$1" "UPDATED_AT"; }
status_notes()   { status_field "$1" "NOTES"; }

role_status_file() {
  case "$1" in
    AGENT_1) echo "$STATUS_DIR/agent-1.status" ;;
    AGENT_2) echo "$STATUS_DIR/agent-2.status" ;;
    AGENT_3) echo "$STATUS_DIR/agent-3.status" ;;
    PRODUCT_OWNER) echo "$STATUS_DIR/product-owner.status" ;;
    QC) echo "$STATUS_DIR/qc.status" ;;
    *) return 1 ;;
  esac
}

task_title_by_key() {
  local key="${1:-}"
  [ -n "$key" ] || return 0
  [ -f "$PIPELINE" ] || return 0
  awk -F'|' -v key="$key" 'NR==1 {next} $3==key {print $4; exit}' "$PIPELINE"
}

guess_current_task_key() {
  local role="${1:?missing role}"
  local status_file
  status_file="$(role_status_file "$role")"
  [ -f "$status_file" ] || exit 0

  local task
  task="$(status_task "$status_file" | tr '[:upper:]' '[:lower:]')"

  case "$role" in
    AGENT_1)
      [[ "$task" == *"runtime hardening"* ]] && echo "A1_RUNTIME_HARDENING" && exit 0
      [[ "$task" == *"profile"* ]] && echo "A1_PROFILE_BEHAVIOUR_COMPLETION" && exit 0
      [[ "$task" == *"deploy"* ]] && echo "A1_SAFE_DEPLOY_GUARDS" && exit 0
      ;;
    AGENT_2)
      [[ "$task" == *"job radar"* && "$task" == *"parity"* ]] && echo "A2_JOB_RADAR_PARITY" && exit 0
      [[ "$task" == *"cost"* ]] && echo "A2_AI_COST_VISIBILITY" && exit 0
      [[ "$task" == *"legal"* ]] && echo "A2_LEGAL_RETRIEVAL_DISCIPLINE" && exit 0
      ;;
    AGENT_3)
      [[ "$task" == *"legacy interview billing"* ]] && echo "A3_LEGACY_INTERVIEW_BILLING" && exit 0
      [[ "$task" == *"negotiation"* ]] && echo "A3_NEGOTIATION_MODULE_BOUNDARY" && exit 0
      [[ "$task" == *"warmup"* ]] && echo "A3_DAILY_WARMUP_BOUNDARY" && exit 0
      ;;
    PRODUCT_OWNER)
      [[ "$task" == *"board"* || "$task" == *"dashboard"* || "$task" == *"movement"* ]] && echo "PO_ENFORCE_MOVEMENT" && exit 0
      [[ "$task" == *"assign"* ]] && echo "PO_ASSIGN_NEXT_AFTER_VERDICTS" && exit 0
      [[ "$task" == *"bottleneck"* ]] && echo "PO_CLEAR_BOTTLENECKS" && exit 0
      ;;
    QC)
      [[ "$task" == *"review"* || "$task" == *"intake"* ]] && echo "QC_REVIEW_ACTIVE_INTAKES" && exit 0
      [[ "$task" == *"risk"* || "$task" == *"repo"* ]] && echo "QC_REPO_RISK_SWEEP" && exit 0
      [[ "$task" == *"cleanup"* ]] && echo "QC_NARROW_CLEANUPS" && exit 0
      ;;
  esac

  echo ""
}

previous_task_key_for_role() {
  local role="${1:?missing role}"
  local current_key="${2:-}"
  [ -n "$current_key" ] || return 0
  [ -f "$PIPELINE" ] || return 0

  awk -F'|' -v role="$role" -v current="$current_key" '
    NR==1 {next}
    $1!=role {next}
    { keys[++n]=$3 }
    END {
      for (i=1;i<=n;i++) {
        if (keys[i]==current) {
          if (i>1) print keys[i-1]
          exit
        }
      }
    }
  ' "$PIPELINE"
}

next_task_key_for_role() {
  local role="${1:?missing role}"
  local current_key="${2:-}"
  [ -f "$PIPELINE" ] || return 0

  awk -F'|' -v role="$role" -v current="$current_key" '
    NR==1 {next}
    $1!=role {next}
    { keys[++n]=$3 }
    END {
      if (n==0) exit
      if (current=="") { print keys[1]; exit }
      for (i=1;i<=n;i++) {
        if (keys[i]==current) {
          if (i<n) print keys[i+1]
          exit
        }
      }
    }
  ' "$PIPELINE"
}

should_advance_role() {
  local role="${1:?missing role}"
  local current_key="${2:-}"
  local status_file
  status_file="$(role_status_file "$role")"
  [ -f "$status_file" ] || return 1

  local state verdict
  state="$(status_state "$status_file")"
  verdict="$(status_verdict "$status_file")"

  case "$role" in
    AGENT_1|AGENT_2|AGENT_3)
      [[ "$state" == "APPROVED_FOR_INTEGRATION" || "$verdict" == "Approved For Integration" ]]
      ;;
    PRODUCT_OWNER)
      [[ "$state" == "IMPLEMENTING" ]]
      ;;
    QC)
      [[ "$state" == "REVIEWING" ]]
      ;;
    *)
      return 1
      ;;
  esac
}

append_status_block() {
  local status_file="${1:?missing status file}"
  local state="${2:?missing state}"
  local task="${3:-}"
  local report="${4:-}"
  local verdict="${5:-}"
  local notes="${6:-}"

  {
    printf "STATE=%s\n" "$state"
    printf "TASK=%s\n" "$task"
    printf "REPORT=%s\n" "$report"
    printf "VERDICT=%s\n" "$verdict"
    printf "UPDATED_AT=%s\n" "$(date '+%Y-%m-%d %H:%M:%S')"
    printf "NOTES=%s\n\n" "$notes"
  } >> "$status_file"
}
