# Active Progress And Task Chain

## Purpose

This file is the live execution layer between:
- current task,
- previous task,
- next task,
- reported progress,
- delta vs previous snapshot,
- stall detection.

It exists so every role knows:
1. what was just finished,
2. what is being done now,
3. what must happen next,
4. whether real progress happened since the previous report.

---

## Global Progress Rule

Progress must be a real number from `1` to `100`.

It must not use broad buckets only.
It must reflect actual movement inside the current bounded slice.

### Required interpretation

- `1–9` = task opened, context loaded, no meaningful repo movement yet
- `10–24` = implementation path identified, first real changes started
- `25–39` = bounded slice partially implemented
- `40–54` = main implementation path exists, still incomplete
- `55–69` = implementation materially advanced, report/test prep in progress
- `70–79` = implementation done or near done, delivery report being finalized
- `80–89` = Ready For QC candidate, report + checks mostly complete
- `90–99` = QC-facing completion state, only final bounded corrections remain
- `100` = task approved for integration or otherwise fully closed in the defined gate

`100` must not be used unless the role-specific completion condition is satisfied.

---

## Delta Rule

Every role must compare current state to previous snapshot.

### Delta meaning
- positive delta = real progress happened
- zero delta = no measurable progress
- negative delta = regression, rework, rollback, or rejection

### Required fields
Each role must always expose:
- Previous task
- Current task
- Next task
- Previous progress
- Current progress
- Delta
- Waiting / stale time

Formula:

`Delta = Current Progress - Previous Progress`

Examples:
- `12 -> 18` = `+6`
- `41 -> 41` = `0`
- `78 -> 62` = `-16`

---

## Waiting / Stale Rule

Waiting time must be visible.

### Waiting / stale timer definition
Measure seconds since the last meaningful state movement:
- progress changed,
- task changed,
- verdict changed,
- next task assigned,
- blocker recorded.

### Meaning
- `0s–120s` = fresh
- `121s–300s` = slowing
- `301s+` = stale
- `600s+` = requires Product Owner intervention
- `900s+` = execution failure unless explicit blocker exists

---

## Status Comparison Rule

Each role must be shown as:

- Role
- State
- Progress
- Delta
- Waiting / Stale
- Previous task
- Current task
- Next task
- Last meaningful change
- Expected next action

---

# Live Task Chain

## AGENT_1

### Previous task
Production/runtime safety foundations already bounded and previously moved toward hardening.

### Current task
Backend runtime hardening only.

### Exact scope now
- trust proxy handling
- minimal MySQL closed-state runtime guard
- minimal runtime files required for that slice
- minimal tests or explicit written justification
- delivery report:
  `docs/qc-reports/agent-1-runtime-hardening-ready-for-qc.md`

### Next task
Only after QC verdict:
- if approved: next bounded backend safety or downstream behaviour task assigned by Product Owner
- if rework: fix only QC-listed runtime-hardening defects
- if not approved: correct report / tests / scope mismatch only

### Progress interpretation for Agent 1
- `1–20`: runtime issue identified, files opened, implementation path chosen
- `21–45`: trust proxy and/or MySQL guard partially implemented
- `46–65`: main hardening code exists
- `66–79`: delivery report + validation being finalized
- `80–99`: Ready For QC candidate
- `100`: QC approved for integration

---

## AGENT_2

### Previous task
Job Radar bounded tranche and parity follow-up work.

### Current task
Job Radar bounded parity only.

### Exact scope now
- close one real remaining bounded Job Radar parity gap
- touch minimal files required for that slice
- minimal tests required for that slice
- minimal frontend touch only if strictly required by parity
- delivery report:
  `docs/qc-reports/agent-2-job-radar-bounded-parity-ready-for-qc.md`

### Next task
Only after QC verdict:
- if approved: next bounded Job Radar or adjacent backend slice assigned by Product Owner
- if rework: fix only the mismatch named by QC
- if not approved: correct scope/test/report mismatch only

### Progress interpretation for Agent 2
- `1–20`: parity gap identified and bounded
- `21–45`: implementation started on the exact gap
- `46–65`: main parity fix exists
- `66–79`: report/tests/report-to-code alignment being finished
- `80–99`: Ready For QC candidate
- `100`: QC approved for integration

---

## AGENT_3

### Previous task
Bounded practice billing work and live/legacy interview billing follow-up.

### Current task
Legacy interview billing parity only.

### Exact scope now
- approveSpend before effect
- commitSpend on success
- rejectSpend on failure or abandon path as applicable
- minimal files required for that slice
- minimal tests or explicit written justification
- delivery report:
  `docs/qc-reports/agent-3-legacy-interview-billing-ready-for-qc.md`

### Next task
Only after QC verdict:
- if approved: next bounded practice/billing task assigned by Product Owner
- if rework: fix only QC-listed billing parity defects
- if not approved: correct report/test/scope mismatch only

### Progress interpretation for Agent 3
- `1–20`: legacy billing path analyzed
- `21–45`: approve/commit/reject flow partially aligned
- `46–65`: main parity path implemented
- `66–79`: report/tests/failure-path verification being finalized
- `80–99`: Ready For QC candidate
- `100`: QC approved for integration

---

## PRODUCT_OWNER

### Previous task
Execution enforcement, board cleanup, dashboard maintenance.

### Current task
Keep board and dashboard current, detect stalls, and assign next bounded work immediately after visible QC state.

### Exact scope now
- maintain:
  - `docs/squad/TODAY_EXECUTION_BOARD.md`
  - `docs/squad/PROJECT_CHECKPOINTS_DASHBOARD.md`
  - `docs/squad/LIVE_EXECUTION_DASHBOARD.md`
- verify whether Agent 1, 2, 3, and QC are active
- compare current vs previous report
- detect stale roles
- update current task, next task, and bottleneck visibility
- assign next bounded task only when QC state exists
- intervene immediately if anyone is idle, stale, drifting scope, or looping summaries

### Next task
Continuously:
- redirect work after verdict,
- kill stalls,
- publish next bounded assignment,
- keep execution pressure real.

### Progress interpretation for Product Owner
- `1–20`: board visible but weakly maintained
- `21–40`: board/dashboard being actively updated
- `41–60`: stale/bottleneck visibility working
- `61–79`: next-task assignment discipline working
- `80–99`: full active movement enforcement working
- `100`: all current bounded slices either approved, in explicit rework, or blocked with real blocker

---

## QC

### Previous task
Review current bounded intakes and perform repo-risk scanning.

### Current task
Review reports or scan repo risks.

### Exact scope now
- inspect:
  - `docs/qc-reports/`
  - current repo changes
  - bounded scope honesty
  - report-to-code match
  - test evidence
- issue only:
  - Approved For Integration
  - Not Approved For Integration
  - Rework Required
- if no fresh report is waiting:
  - inspect repo for narrow risks
  - write QC findings
  - do controlled narrow cleanup only if truly low-risk and documented

### Next task
- review next Ready For QC intake immediately,
- otherwise continue bounded repo-risk verification,
- otherwise publish rework with exact required next action.

### Progress interpretation for QC
- `1–20`: intake queue checked
- `21–40`: active review started
- `41–60`: code/report/test validation materially underway
- `61–79`: verdict being finalized
- `80–99`: verdict text/report almost ready
- `100`: current intake closed with published verdict

---

# Mandatory Display Format

Every live dashboard / loop output should expose:

| Role | State | Progress | Delta | Waiting / Stale | Previous task | Current task | Next task |
|---|---:|---:|---:|---:|---|---|---|

Example:

| AGENT_1 | IMPLEMENTING | 34% | +8 | 74s | Runtime safety prep | Backend runtime hardening | Wait for QC then next bounded backend slice |
| AGENT_2 | READY_FOR_QC | 83% | +11 | 19s | Identify parity gap | Job Radar bounded parity | QC review / rework if needed |
| AGENT_3 | IMPLEMENTING | 52% | +7 | 65s | Practice billing follow-up | Legacy interview billing parity | Report finalization then QC |
| PRODUCT_OWNER | IMPLEMENTING | 43% | +5 | 48s | Board cleanup | Keep board and dashboard current | Assign next bounded task after QC state |
| QC | REVIEWING | 58% | +9 | 32s | Repo sweep | Review reports or scan repo risks | Publish verdict or next rework |

---

# Stall Detection Rule

A role is stalled when all of these are true:
- delta = `0`
- task unchanged
- waiting/stale > `300s`
- no new blocker recorded
- no new report/verdict/state change

If stalled:
- Product Owner must intervene immediately
- the role must receive a next explicit bounded action
- the stale period must remain visible until movement resumes

---

# Next Step For Repo Integration

After this file is adopted, every role should be traceable through:
1. previous task,
2. current task,
3. next task,
4. current progress,
5. delta vs previous snapshot,
6. stale timer.

No role should appear with only:
- state,
- vague task,
- no previous task,
- no next task,
- no delta.

That is not execution.
That is decoration.
