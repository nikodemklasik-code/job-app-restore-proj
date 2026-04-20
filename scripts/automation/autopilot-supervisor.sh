#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
STATUS_DIR="$ROOT/docs/status"
OUT_LIVE="$ROOT/docs/squad/AUTOPILOT_LIVE.md"
OUT_ORDERS="$ROOT/docs/squad/MANUAL_ORDERS.md"
OUT_NEXT="$ROOT/docs/squad/NEXT_TASKS.md"
STATE_DIR="$ROOT/docs/runtime/autopilot"
mkdir -p "$STATE_DIR"

now_ts() { date '+%Y-%m-%d %H:%M:%S'; }
now_epoch() { date +%s; }

extract_latest_status_block() {
  local file="${1:?missing file}"
  awk '
    BEGIN { block=""; current="" }
    /^STATE=/ {
      if (current != "") block = current
      current = $0 "\n"
      next
    }
    current != "" { current = current $0 "\n" }
    END {
      if (current != "") block = current
      printf "%s", block
    }
  ' "$file"
}

field() {
  local file="${1:?missing file}"
  local key="${2:?missing key}"
  [ -f "$file" ] || return 0
  extract_latest_status_block "$file" | awk -F= -v k="$key" '
    $1 == k {
      sub($1 "=","")
      print
      exit
    }
  '
}

progress_fallback() {
  case "${1:-}" in
    IDLE) echo 0 ;;
    IMPLEMENTING) echo 50 ;;
    READY_FOR_QC) echo 75 ;;
    REVIEWING) echo 75 ;;
    REWORK) echo 60 ;;
    APPROVED_FOR_INTEGRATION) echo 100 ;;
    BLOCKED) echo 15 ;;
    APPROVED_AWAITING_NEXT_ASSIGNMENT) echo 0 ;;
    ACTIVE_MERGE_GATE) echo 0 ;;
    P0_SLICES_COMPLETE) echo 0 ;;
    *) echo 0 ;;
  esac
}

progress_of() {
  local file="${1:?missing file}"
  local p
  p="$(field "$file" "PROGRESS" || true)"
  if [[ "${p:-}" =~ ^[0-9]+$ ]]; then
    [ "$p" -lt 0 ] && p=0
    [ "$p" -gt 100 ] && p=100
    echo "$p"
  else
    progress_fallback "$(field "$file" "STATE" || true)"
  fi
}

bar() {
  local pct="${1:-0}"
  [ "$pct" -lt 0 ] && pct=0
  [ "$pct" -gt 100 ] && pct=100
  local filled=$((pct / 10))
  local empty=$((10 - filled))
  local left="" right=""
  [ "$filled" -gt 0 ] && left=$(printf '█%.0s' $(seq 1 "$filled"))
  [ "$empty" -gt 0 ] && right=$(printf '░%.0s' $(seq 1 "$empty"))
  printf '[%s%s] %s%%' "$left" "$right" "$pct"
}

human_duration() {
  local secs="${1:-0}"
  [ "$secs" -lt 0 ] && secs=0
  local h=$((secs / 3600))
  local m=$(((secs % 3600) / 60))
  local s=$((secs % 60))
  if [ "$h" -gt 0 ]; then
    printf '%sh %sm %ss' "$h" "$m" "$s"
  elif [ "$m" -gt 0 ]; then
    printf '%sm %ss' "$m" "$s"
  else
    printf '%ss' "$s"
  fi
}

role_file() {
  case "$1" in
    AGENT_1) echo "$STATUS_DIR/agent-1.status" ;;
    AGENT_2) echo "$STATUS_DIR/agent-2.status" ;;
    AGENT_3) echo "$STATUS_DIR/agent-3.status" ;;
    PRODUCT_OWNER) echo "$STATUS_DIR/product-owner.status" ;;
    QC) echo "$STATUS_DIR/qc.status" ;;
    *) return 1 ;;
  esac
}

role_label() {
  case "$1" in
    AGENT_1) echo "Agent 1" ;;
    AGENT_2) echo "Agent 2" ;;
    AGENT_3) echo "Agent 3" ;;
    PRODUCT_OWNER) echo "Product Owner" ;;
    QC) echo "QC" ;;
    *) echo "$1" ;;
  esac
}

role_manual_order() {
  local role="$1"
  local state="$2"
  local task="$3"
  local progress="$4"
  local verdict="$5"

  case "$role" in
    AGENT_1)
      if [ "$state" = "READY_FOR_QC" ]; then
        cat <<TXT
Wklej do ${role_label "$role"}:
Przestań czekać. Twoja ostatnia rzecz jest w READY_FOR_QC. Natychmiast wykonaj repo sweep tylko dla runtime hardening: sprawdź trust proxy, MySQL closed-state guard, minimalne testy i uzupełnij delivery report o brakujące dowody. Nie rozszerzaj scope. Zaktualizuj status dopiero po realnym repo work.
TXT
      elif [ "$state" = "APPROVED_FOR_INTEGRATION" ] || [ "$state" = "APPROVED_AWAITING_NEXT_ASSIGNMENT" ]; then
        cat <<TXT
Wklej do ${role_label "$role"}:
Masz zamknięty bounded slice. Wejdź w merge-readiness dla runtime safety: sprawdź tylko compile-safe impact touched files, usuń niskoryzykowne niespójności runtime i dopisz krótką notę repo evidence. Zero nowego scope.
TXT
      else
        cat <<TXT
Wklej do ${role_label "$role"}:
Masz pracować dalej nad: $task. Aktualny progres: ${progress}%. Zrób teraz konkretnie: 1) domknij trust proxy handling, 2) domknij minimal MySQL closed-state runtime guard, 3) dopisz minimal test lub jawne justification, 4) zaktualizuj report tylko po realnej zmianie w repo.
TXT
      fi
      ;;
    AGENT_2)
      if [ "$state" = "REWORK" ]; then
        cat <<TXT
Wklej do ${role_label "$role"}:
QC odesłał slice do rework. Natychmiast popraw dokładnie mismatch report/code w Job Radar bounded parity. Bez Legal Hub, bez Skill Lab, bez rewrite. Najpierw napraw kod, potem report, potem status.
TXT
      elif [ "$state" = "READY_FOR_QC" ]; then
        cat <<TXT
Wklej do ${role_label "$role"}:
Twój slice czeka na QC. Nie stój. Zrób bounded self-check tylko dla Job Radar parity gap: porównaj report z realnym kodem, sprawdź minimal tests, popraw tylko niespójności niskiego ryzyka. Bez rozszerzania scope.
TXT
      elif [ "$state" = "APPROVED_FOR_INTEGRATION" ] || [ "$state" = "APPROVED_AWAITING_NEXT_ASSIGNMENT" ]; then
        cat <<TXT
Wklej do ${role_label "$role"}:
Masz zamknięty bounded Job Radar slice. Wykonaj narrow post-approval cleanup: sprawdź mappery, DTO i report wording tylko w touched area. Nie otwieraj nowych modułów. Przygotuj repo do następnego bounded assignment.
TXT
      else
        cat <<TXT
Wklej do ${role_label "$role"}:
Masz pracować dalej nad: $task. Aktualny progres: ${progress}%. Teraz zrób tylko remaining bounded Job Radar parity gap, minimal files, minimal tests, minimal frontend only if strictly required. Po repo change uaktualnij report.
TXT
      fi
      ;;
    AGENT_3)
      if [ "$state" = "READY_FOR_QC" ]; then
        cat <<TXT
Wklej do ${role_label "$role"}:
Legacy interview billing parity jest w READY_FOR_QC. Nie czekaj bezczynnie. Sprawdź jeszcze raz approveSpend, commitSpend, rejectSpend i failure paths tylko w interview.router slice. Bez Coach, bez Negotiation, bez wider Practice.
TXT
      elif [ "$state" = "APPROVED_FOR_INTEGRATION" ] || [ "$state" = "APPROVED_AWAITING_NEXT_ASSIGNMENT" ]; then
        cat <<TXT
Wklej do ${role_label "$role"}:
Twój bounded slice jest zamknięty. Zrób merge-readiness review tylko dla touched billing path: compile safety, obvious inconsistencies, report clarity. Zero nowego scope.
TXT
      else
        cat <<TXT
Wklej do ${role_label "$role"}:
Masz pracować dalej nad: $task. Aktualny progres: ${progress}%. Domknij tylko legacy interview.router billing parity: approveSpend przed efektem, commitSpend po sukcesie, rejectSpend na failure/abandon, minimal tests albo explicit justification, potem report.
TXT
      fi
      ;;
    PRODUCT_OWNER)
      cat <<TXT
Wklej do Product Owner:
Masz aktywnie pchać execution. Zrób teraz: 1) sprawdź kto stoi bez zmiany progresu, 2) jeśli ktoś stoi ponad 5 min, nadaj mu konkretny next action, 3) jeśli READY_FOR_QC trwa za długo, przepchnij QC, 4) jeśli APPROVED trwa bez nowego tasku, przypisz kolejny bounded slice albo merge gate. Zaktualizuj board i dashboard po realnej zmianie.
TXT
      ;;
    QC)
      cat <<TXT
Wklej do QC:
Masz przerwać pasywne reviewing. Zrób teraz: 1) weź najstarszy READY_FOR_QC albo najdłużej stojący bounded slice, 2) porównaj report z realnym kodem, 3) sprawdź test evidence, 4) wydaj werdykt albo wpisz konkretny rework. Jeśli nic nie czeka, zrób narrow repo-risk cleanup i zapisz QC report.
TXT
      ;;
  esac
}

next_task_text() {
  local role="$1"
  case "$role" in
    AGENT_1) echo "Narrow merge-readiness and runtime safety cleanup in touched runtime files only." ;;
    AGENT_2) echo "Fix Job Radar bounded parity mismatch or, if approved, prepare next bounded Job Radar backend safety cleanup only." ;;
    AGENT_3) echo "Finish legacy interview billing parity or, if approved, narrow billing-path compile/readiness cleanup only." ;;
    PRODUCT_OWNER) echo "Force movement on stalled roles, assign next bounded slice only when gate state is real." ;;
    QC) echo "Review oldest waiting bounded slice or write concrete rework/approval immediately." ;;
    *) echo "No next task." ;;
  esac
}

snapshot_role() {
  local role="$1"
  local file; file="$(role_file "$role")"
  local state task report verdict progress updated
  state="$(field "$file" "STATE" || true)"
  task="$(field "$file" "TASK" || true)"
  report="$(field "$file" "REPORT" || true)"
  verdict="$(field "$file" "VERDICT" || true)"
  progress="$(progress_of "$file")"
  updated="$(field "$file" "UPDATED_AT" || true)"

  printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\n' "$role" "${state:-UNKNOWN}" "${progress:-0}" "${task:-}" "${report:-}" "${verdict:-NONE}" "${updated:-}"
}

write_files() {
  local ts epoch
  ts="$(now_ts)"
  epoch="$(now_epoch)"

  local prev="$STATE_DIR/previous.tsv"
  local cur="$STATE_DIR/current.tsv"
  : > "$cur"

  for role in AGENT_1 AGENT_2 AGENT_3 PRODUCT_OWNER QC; do
    snapshot_role "$role" >> "$cur"
  done

  {
    echo "# Autopilot Live"
    echo
    echo "Updated: $ts"
    echo
    echo "## Current role states"
    echo
    printf '| Role | State | Progress | Delta | Waiting / Stale | Current task |\n'
    printf '|---|---:|---:|---:|---:|---|\n'

    while IFS=$'\t' read -r role state progress task report verdict updated; do
      local delta="n/a"
      local stale="n/a"
      local prev_progress=""
      local prev_state=""
      local prev_updated=""

      if [ -f "$prev" ]; then
        prev_line="$(grep "^${role}"$'\t' "$prev" || true)"
        if [ -n "$prev_line" ]; then
          prev_state="$(printf '%s\n' "$prev_line" | cut -f2)"
          prev_progress="$(printf '%s\n' "$prev_line" | cut -f3)"
          prev_updated="$(printf '%s\n' "$prev_line" | cut -f7)"
        fi
      fi

      if [[ "${prev_progress:-}" =~ ^[0-9]+$ ]]; then
        delta_val=$((progress - prev_progress))
        if [ "$delta_val" -gt 0 ]; then
          delta="+${delta_val}"
        else
          delta="${delta_val}"
        fi
      fi

      meta="$STATE_DIR/${role}.meta"
      last_change_epoch="$epoch"
      state_since_epoch="$epoch"
      approval_epoch=""
      approved_wait=""

      if [ -f "$meta" ]; then
        # shellcheck disable=SC1090
        source "$meta" || true
      fi

      if [ "${LAST_STATE:-}" != "$state" ] || [ "${LAST_PROGRESS:-}" != "$progress" ]; then
        last_change_epoch="$epoch"
      else
        last_change_epoch="${LAST_CHANGE_EPOCH:-$epoch}"
      fi

      if [ "${LAST_STATE:-}" != "$state" ]; then
        state_since_epoch="$epoch"
      else
        state_since_epoch="${STATE_SINCE_EPOCH:-$epoch}"
      fi

      if [ "$state" = "APPROVED_FOR_INTEGRATION" ] || [ "$state" = "APPROVED_AWAITING_NEXT_ASSIGNMENT" ]; then
        if [ "${LAST_STATE:-}" != "$state" ]; then
          approval_epoch="$epoch"
        else
          approval_epoch="${APPROVAL_EPOCH:-$epoch}"
        fi
        approved_wait="$(human_duration $((epoch - approval_epoch)))"
      fi

      stale="$(human_duration $((epoch - last_change_epoch)))"

      {
        echo "LAST_STATE=$state"
        echo "LAST_PROGRESS=$progress"
        echo "LAST_CHANGE_EPOCH=$last_change_epoch"
        echo "STATE_SINCE_EPOCH=$state_since_epoch"
        echo "APPROVAL_EPOCH=${approval_epoch:-${APPROVAL_EPOCH:-}}"
      } > "$meta"

      extra_wait="$stale"
      if [ -n "$approved_wait" ]; then
        extra_wait="since approval: $approved_wait"
      fi

      printf '| %s | %s | %s | %s | %s | %s |\n' \
        "$role" "$state" "$progress%" "$delta" "$extra_wait" "$task"
    done < "$cur"

    echo
    echo "## Blocking signals"
    echo

    blocking_count=0
    while IFS=$'\t' read -r role state progress task report verdict updated; do
      meta="$STATE_DIR/${role}.meta"
      # shellcheck disable=SC1090
      [ -f "$meta" ] && source "$meta" || true
      wait_secs=$((epoch - ${LAST_CHANGE_EPOCH:-epoch}))

      if [ "$state" = "READY_FOR_QC" ] && [ "$wait_secs" -ge 300 ]; then
        echo "- $role waits for QC for $(human_duration "$wait_secs")"
        blocking_count=$((blocking_count + 1))
      fi

      if [ "$state" = "IMPLEMENTING" ] && [ "$wait_secs" -ge 300 ]; then
        echo "- $role has no visible progress for $(human_duration "$wait_secs")"
        blocking_count=$((blocking_count + 1))
      fi

      if [ "$state" = "REWORK" ]; then
        echo "- $role is in REWORK and should be fixing mismatch now"
        blocking_count=$((blocking_count + 1))
      fi

      if { [ "$state" = "APPROVED_FOR_INTEGRATION" ] || [ "$state" = "APPROVED_AWAITING_NEXT_ASSIGNMENT" ]; } && [ "$wait_secs" -ge 300 ]; then
        echo "- $role finished previous slice and waits $(human_duration "$wait_secs") for next concrete task"
        blocking_count=$((blocking_count + 1))
      fi
    done < "$cur"

    if [ "$blocking_count" -eq 0 ]; then
      echo "- none"
    fi
  } > "$OUT_LIVE"

  {
    echo "# Next Tasks"
    echo
    echo "Updated: $ts"
    echo
    for role in AGENT_1 AGENT_2 AGENT_3 PRODUCT_OWNER QC; do
      file="$(role_file "$role")"
      state="$(field "$file" "STATE" || true)"
      progress="$(progress_of "$file")"
      task="$(field "$file" "TASK" || true)"
      echo "## $role"
      echo "- Current: ${task:-none}"
      echo "- State: ${state:-UNKNOWN}"
      echo "- Progress: ${progress}%"
      echo "- Next: $(next_task_text "$role")"
      echo
    done
  } > "$OUT_NEXT"

  {
    echo "# Manual Orders"
    echo
    echo "Updated: $ts"
    echo
    for role in AGENT_1 AGENT_2 AGENT_3 PRODUCT_OWNER QC; do
      file="$(role_file "$role")"
      state="$(field "$file" "STATE" || true)"
      task="$(field "$file" "TASK" || true)"
      verdict="$(field "$file" "VERDICT" || true)"
      progress="$(progress_of "$file")"
      echo "## $role"
      role_manual_order "$role" "${state:-UNKNOWN}" "${task:-}" "${progress:-0}" "${verdict:-NONE}"
      echo
    done
  } > "$OUT_ORDERS"

  cp "$cur" "$prev"
}

while true; do
  write_files
  sleep 30
done
