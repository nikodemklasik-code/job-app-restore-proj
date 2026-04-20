# Swiss Watch Execution Protocol

## Purpose

This protocol defines a strict execution loop for:
- Product Owner
- QC
- Agent 1
- Agent 2
- Agent 3

The goal is:
- no passive waiting,
- no discussion loops,
- no fake completion,
- no widening of bounded scope,
- constant forward movement until repo delivery, QC review, and verdict exist.

---

## Source Of Truth

Active source of truth only:
- docs/squad/TODAY_EXECUTION_BOARD.md
- docs/squad/ACTIVE_EXECUTION_AND_QC_LOOP_RULES.md
- docs/squad/SWISS_WATCH_EXECUTION_PROTOCOL.md
- docs/qc/
- docs/qc-reports/
- repository code

Archived boards are not active source of truth.

---

## Role Model

### Product Owner
Controls movement, priority, and anti-stall behaviour.

### QC
Actively reviews reports, code, and agent behaviour.

### Agent 1
Implements one bounded backend-core task.

### Agent 2
Implements one bounded intelligence task.

### Agent 3
Implements one bounded practice/user-surface task.

---

## Core Execution Loop

### Agent loop
1. implement bounded scope in repo,
2. create delivery report,
3. mark `Ready For QC`,
4. check board and QC outputs every 30–40 seconds,
5. if QC has not issued approval yet, continue with the next bounded task assigned on the board,
6. if QC issues rework, switch immediately to rework.

### QC loop
1. scan `docs/qc-reports/`, `docs/qc/`, and the board every 30–40 seconds,
2. intake every new report without waiting for a ping,
3. compare report to code and prior reports,
4. verify whether the agent is actually working the assigned scope,
5. issue verdict,
6. if no report is waiting, scan repo for defects and risks.

### Product Owner loop
1. inspect the board every 30–40 seconds,
2. verify each role is active,
3. intervene on idle behaviour,
4. assign the next bounded task immediately when current QC state is visible,
5. keep the day moving until all realistic scopes are either:
   - delivered,
   - reviewed,
   - or explicitly blocked.

---

## Definition Of Ready For QC

A scope is `Ready For QC` only if all conditions are true:

1. real repo changes exist,
2. bounded scope is clearly stated,
3. delivery report exists,
4. files changed are listed,
5. previous reports were checked,
6. test command is listed,
7. test result is listed,
8. blockers are stated honestly.

If any condition is missing, the scope is not Ready For QC.

---

## Definition Of Approved For Integration

A scope is `Approved For Integration` only if QC confirms all of the following:

1. repo implementation exists,
2. delivery report exists,
3. previous-report check exists,
4. actual code was reviewed,
5. required tests passed or explicit narrow justification was accepted,
6. no unresolved blocker exists for the bounded scope,
7. scope description matches actual code,
8. no widening claim exists.

If any of the above is missing, the scope is not Approved For Integration.

---

## Mandatory Test Rule

Every delivery must include:
- build evidence for the touched area,
- test evidence for changed critical logic,
- or an explicit written justification if a narrow path cannot be fully tested.

Critical logic includes:
- spend flows,
- source restrictions,
- approval flows,
- runtime guards,
- deploy guards,
- routing / contract parity,
- status transitions,
- production safety behaviour.

---

## If QC Has Not Approved Yet

If QC is still:
- reading reports,
- checking tests,
- comparing old findings,
- inspecting repo code,

then the agent must:
1. keep checking the board and QC outputs every 30–40 seconds,
2. continue the next bounded task already assigned,
3. prepare the next delivery report if next scope is already moving,
4. react immediately when QC posts rework or verdict.

The agent must not:
- sit idle,
- wait for manual chat notification,
- assume silence means approval.

---

## If QC Has No New Report To Review

QC must not sit idle.

QC must actively scan repo for:
- hidden spend,
- broken runtime assumptions,
- broken source restrictions,
- invalid product claims,
- UI/backend mismatch,
- broken scope boundaries,
- missing guards,
- unsafe deploy assumptions,
- misleading delivery reports,
- inactive agents pretending to work.

QC may issue:
- Approved For Integration
- Not Approved For Integration
- Rework Required

QC can also explicitly mark:
- agent active / inactive,
- report honest / dishonest,
- scope aligned / misaligned.

---

## Product Owner Enforcement

Product Owner must:
- actively verify who is working,
- stop passive waiting,
- stop planning loops,
- stop scope drift,
- stop broad rewrites,
- stop fake completion claims,
- push the next bounded task immediately,
- update the board.

If an agent finishes and QC is still reviewing, Product Owner must ensure the agent is already on the next bounded task.

If QC is idle, Product Owner must require QC to scan repo and record findings.

---

## Hard Rules

### Hard Rule 1
Ready For QC is not Approved For Integration.

### Hard Rule 2
No role waits for a personal ping if the board or QC folder can be checked directly.

### Hard Rule 3
No one sits idle between delivery and verdict.

### Hard Rule 4
QC must verify both:
- the code and report,
- the real activity of the agent.

### Hard Rule 5
If QC does not approve, the work goes back immediately for rework.

### Hard Rule 6
If QC is idle, QC reviews repo code.

### Hard Rule 7
If Product Owner sees inactivity, Product Owner intervenes immediately.

### Hard Rule 8
Bounded approval cannot be widened by implication.

---

## Required Delivery Report Sections

Every delivery report must contain:
- Scope Implemented
- Files Changed
- Existing Reports Checked
- Existing QC Reports Checked
- Test Command Run
- Test Result
- Coverage / Justification
- Known Remaining Blockers
- Ready For QC: Yes / No

---

## Required QC Verdict Sections

Every QC verdict must contain:
- QC Scope Reviewed
- Previous QC Report Checked: Yes / No
- Previous QC Report Path / Reference
- Previously Reported Issues Resolved
- Previously Reported Issues Still Open
- New Issues Found
- Functional Validation
- Product Validation
- Risk Validation
- QC Verdict
- Integration Status
- Required Next Action

---

## Final Rule

Everyone must always be in one of four states only:
- implementing,
- reviewing,
- assigning,
- or recording a real blocker.

No one waits.
No one self-approves.
No one guesses.

## Product Owner bottleneck duty

If any bottleneck appears in:
- QC bottleneck view,
- execution alerts,
- control tower,
- status files,
- QC handoff files,

then Product Owner must immediately intervene.

Intervention means:
1. identify who is blocked,
2. identify the exact next action,
3. assign or refresh that action in repo-visible files,
4. update board/dashboard visibility,
5. continue monitoring until the bottleneck state changes.

Product Owner is not allowed to passively observe a bottleneck for multiple loops without changing ownership, instruction, or visibility.
