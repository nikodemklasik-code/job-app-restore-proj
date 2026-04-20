#!/usr/bin/env bash
set -euo pipefail

can_auto_advance() {
  local role="${1:-}"
  local state="${2:-}"
  local verdict="${3:-}"
  local report="${4:-}"
  local next_task="${5:-}"

  [ -n "$next_task" ] || return 1

  case "$role" in
    AGENT_1|AGENT_2|AGENT_3)
      [ "$state" = "APPROVED_FOR_INTEGRATION" ] || return 1
      [ -n "$verdict" ] || return 1
      [ "$verdict" = "Approved For Integration" ] || return 1
      [ -n "$report" ] || return 1
      [ -f "/Users/nikodem/job-app-restore/proj/$report" ] || return 1
      return 0
      ;;
    PRODUCT_OWNER)
      [ "$state" = "ACTIVE_MERGE_GATE" ] || return 1
      return 0
      ;;
    QC)
      [ "$state" = "P0_SLICES_COMPLETE" ] || return 1
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}
