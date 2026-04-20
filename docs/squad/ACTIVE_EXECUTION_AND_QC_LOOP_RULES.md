# Active Execution And QC Loop Rules

## Purpose

This file defines the active execution loop for:
- Agents
- QC
- Product Owner

It exists to stop passive waiting, stale summaries, fake completion, and manual babysitting.

---

## Source Of Truth

Current active source of truth:
- `docs/squad/TODAY_EXECUTION_BOARD.md`
- `docs/squad/IMPLEMENTATION_EXECUTION_RULES.md`
- `docs/qc/`
- `docs/qc-reports/`
- repository code

Archived boards and old task cards are not active source of truth.

---

## Agent Rule

After an agent marks a scope as:

- `Ready For QC`

the agent must actively check for QC output every **30 to 40 seconds** in:

- `docs/squad/TODAY_EXECUTION_BOARD.md`
- `docs/qc-reports/`
- any current QC review file linked from the board

The agent must not wait for a personal message.

### While waiting for QC

While QC is reviewing, the agent must immediately continue with the next bounded task already assigned on the board.

If no next bounded task is assigned, the agent must:
1. check the board again,
2. pick the next explicitly allowed bounded task,
3. continue implementation work in repo.

The agent must not:
- wait passively,
- post repeated summaries,
- treat silence as approval,
- treat `Ready For QC` as `Approved For Integration`.

---

## QC Rule

QC must actively check:
- `docs/qc-reports/`
- `docs/qc/`
- `docs/squad/TODAY_EXECUTION_BOARD.md`

every **30 to 40 seconds** for:
- new delivery reports,
- new resubmissions,
- new bounded implementation slices,
- follow-up reports needing verdict.

QC must not wait for agents to manually ping.

### When no new intake is waiting

When no new report is waiting, QC must actively review the repository for:
- hidden spend,
- broken billing paths,
- false product claims,
- broken module boundaries,
- untested critical logic,
- unsafe deploy assumptions,
- source-integrity issues,
- misleading UI-to-backend mismatches,
- missing guards,
- technical risks likely to block integration.

QC records findings as:
- QC report,
- QC verdict,
- Required Next Action,
- Not Approved / Approved / Rework / Conditional,
- integration status.

QC does not sit idle.

---

## Product Owner Rule

Product Owner must actively monitor:
- board status,
- delivery flow,
- QC queue,
- current repo work,
- whether agents are actually implementing.

Product Owner must:
- push agents into bounded implementation,
- stop discussion loops,
- assign next bounded task immediately when one finishes,
- verify whether an agent is working or stalling,
- verify whether QC is reviewing or stalling,
- keep the team moving until all realistic scopes for the day are either:
  - delivered,
  - reviewed,
  - blocked with an explicit blocker.

Product Owner does not allow:
- passive waiting,
- fake completion,
- widening of narrow approvals,
- work outside the active board.

---

## Definition Of Ready For QC

A scope may be marked `Ready For QC` only if all of the following exist:

1. real repo changes,
2. bounded scope clearly defined,
3. delivery report created,
4. files changed listed,
5. relevant previous reports checked,
6. test command listed,
7. actual test result listed,
8. current blockers listed honestly.

If any of the above is missing, the scope is **not** Ready For QC.

---

## Definition Of Approved For Integration

A scope is `Approved For Integration` only if QC has issued a valid verdict and all required checks below are satisfied.

### Mandatory conditions

1. repo implementation exists,
2. delivery report exists,
3. previous-report check exists,
4. QC reviewed the actual code,
5. required tests passed,
6. no blocker remains for the bounded scope,
7. no false widening of scope exists.

If any of the above is missing, the scope is **not** Approved For Integration.

---

## Mandatory Test Rule

Each delivery must include tests appropriate to the slice.

Minimum requirement:
- build must pass for the touched area,
- changed critical logic must have test coverage or an explicit written justification,
- if a route, spend path, source restriction, approval flow, or safety gate changes, that path must be tested or explicitly justified.

### Required test evidence in delivery report

Each delivery report must contain:

- `Test Command Run`
- `Test Result`
- `Coverage / Justification`
- `Known Remaining Blockers`

---

## If Tests Do Not Exist Or Do Not Pass

If required tests do not exist, fail, or cannot run, then:

- the agent must state that honestly in the delivery report,
- QC must treat the scope as:
  - `Not Approved For Integration`
  - or `Rework Required`
  unless the bounded scope explicitly allows a narrower exception.

The absence of tests is not treated as silence.
Silence is not proof.
Lack of proof is not approval.

---

## What Agents Must Do While QC Is Still Testing

If QC is still:
- running tests,
- checking 10 files,
- comparing old reports,
- reviewing code,
- verifying claims,

then the agent must:

1. keep checking the board and QC reports every 30–40 seconds,
2. keep implementing the next bounded task already assigned,
3. prepare the next delivery report if the next task is already in progress,
4. respond immediately if QC writes a correction, blocker, or rework note.

The agent must not:
- sit idle,
- wait for chat notification,
- claim “I am blocked” unless the blocker is explicitly real and written on the board.

---

## What QC Must Do While No Fresh Report Exists

If no fresh report is waiting, QC must:

1. inspect repo code,
2. inspect recently changed slices,
3. search for broken assumptions,
4. search for unguarded spend,
5. search for broken source restrictions,
6. search for invalid wording versus backend behaviour,
7. search for unreviewed integration risks,
8. prepare findings proactively.

QC must behave like an active quality gate, not a passive inbox.

---

## What Product Owner Must Do While QC Or Agents Are Busy

If agents are working and QC is reviewing, Product Owner must:

1. verify that each role is still active,
2. update the board,
3. confirm next bounded scope is ready,
4. remove stale or invalid tasks,
5. intervene if anyone is idle,
6. force movement if someone falls back into summaries or planning loops.

Product Owner must actively maintain execution pressure.

---

## Hard Rules

### Hard Rule 1
`Ready For QC` is not `Approved For Integration`.

### Hard Rule 2
No one waits for a manual ping if the board or QC folder can be checked directly.

### Hard Rule 3
No one sits idle after delivery.

### Hard Rule 4
If QC has not approved a scope, the agent continues with the next bounded task.

### Hard Rule 5
If QC is not currently reviewing a report, QC reviews repo risks.

### Hard Rule 6
If Product Owner sees inactivity, Product Owner intervenes immediately.

### Hard Rule 7
A scope without honest test evidence is not integration-ready.

### Hard Rule 8
A bounded approval cannot be widened by implication.

---

## Delivery Report Minimum Sections

Every delivery report must contain:

- `Scope Implemented`
- `Files Changed`
- `Routes / APIs / Components / Schemas Changed`
- `Existing Reports Checked`
- `Existing QC Reports Checked`
- `Test Command Run`
- `Test Result`
- `Coverage / Justification`
- `Known Remaining Blockers`
- `Ready For QC: Yes / No`

---

## QC Verdict Minimum Sections

Every QC report must contain:

- `QC Scope Reviewed`
- `Previous QC Report Checked: Yes / No`
- `Previous QC Report Path / Reference`
- `Previously Reported Issues Resolved`
- `Previously Reported Issues Still Open`
- `New Issues Found`
- `Functional Validation`
- `Product Validation`
- `Risk Validation`
- `QC Verdict`
- `Integration Status`
- `Required Next Action`

---

## Operational Loop

### Agent loop
- finish bounded scope
- create delivery report
- mark `Ready For QC`
- check board / QC files every 30–40 seconds
- continue next bounded scope

### QC loop
- scan report locations every 30–40 seconds
- intake new reports
- review code and prior findings
- issue verdict
- if idle, scan repo for risks

### Product Owner loop
- monitor all roles
- keep board current
- assign next bounded scopes
- stop stalls and fake completion

---

## Final Rule

Nobody waits.
Nobody guesses.
Nobody self-approves.
Nobody widens approval.
Everyone either:
- implements,
- reviews,
- assigns,
- or records a real blocker.
