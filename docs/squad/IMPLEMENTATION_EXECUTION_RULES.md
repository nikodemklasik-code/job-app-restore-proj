# Implementation Execution Rules And Source Of Truth

**Binding:** Agent 1, Agent 2, Agent 3, QC, and Product Owner use this file as the execution source of truth — including **§5** *Execution enforcement — same-day scope declaration (anti-stall)* and **Hard Rule 9** when Agent **2 (B)** or **3 (C)** is flagged **stalled**.

## Purpose

This document defines the execution rules for moving the team from planning and documentation into real implementation.

Its purpose is to ensure that:

- agents start implementing instead of discussing
- agents know where to find reports and do not wait to be told manually
- Quality Control actively finds and evaluates reports instead of waiting for handoff
- Product Owner actively supervises execution discipline, coherence, and forward movement
- work moves through implementation, QC, and integration without falling back into planning loops

This file is intended to unify and operationalize the rules previously spread across:

- QC status vocabulary
- QC reporting requirements
- implementation-phase enforcement
- squad execution discipline
- Product Owner oversight expectations

---

## Wall: one table (flow summary)

| Krok | Aktor | Miejsce w repo | Referencja |
|------|--------|----------------|-------------|
| **1. Zgłoszenie dostawy** | Agent | Nowy plik w `docs/qc-reports/` + commit na `claude/improvements` | Ten dokument **§6**; [`execution-reporting-standard.md`](../policies/execution-reporting-standard.md) §3–§7 |
| **2. Aktywne przeszukanie** | QC | `docs/qc-reports/`, `docs/qc/`, `docs/squad/` | **§4** + **§7** + **Hard Rule 2** |
| **3. Werdykt + certyfikat / cofnięcie** | QC | Nowy plik `docs/qc-reports/qc-*.md` w formacie **§8** + mapowanie **§9** + obowiązkowa **pierwsza linia** (odniesienie do **§5a** / **Hard Rule 8** — reakcja zespołu = kod, nie relitigacja werdyktu na czacie); można też uzupełnić broadcast w [`qc-live-status.md`](../qc-reports/qc-live-status.md) z tym samym przypomnieniem | **§8**, **§9** |
| **4. Reakcja na werdykt = kod** | Agent | Diff w repo + nowy raport **§6** albo **jeden** udokumentowany *Blocker* | **§5a** + **Hard Rule 8** |
| **5. Integracja** | Agent (guardy + PO gdy wymagane) | Deploy pipeline (`scripts/deploy.sh` + canonical guards); ew. product sign-off wg **§11** | Mapowanie **§9**; **§10**; **§11** |

---

## 1. Source Of Truth

### Canonical Source Of Truth Hierarchy

When there is any conflict, use the following order:

### 1. Operational Truth For Implementation Execution

**This file**

- `docs/squad/IMPLEMENTATION_EXECUTION_RULES.md`

This file is the canonical source of truth for:

- implementation-phase discipline
- report lookup obligations
- agent execution rules
- QC execution rules
- Product Owner oversight rules
- movement from coding to QC to integration

### 2. Canonical QC Operating Model

- `docs/qc/qc-reporting-certification-and-po-communication-spec-v1.0.md`

This is the canonical source of truth for:

- QC report discovery
- QC continuity rules
- QC verdict structure
- QC certification behaviour
- Product Owner escalation rules

### 3. QC Repo Entry / Usage Guide

- `docs/qc/README.md`

This is the practical repo entry point for:

- where reports live
- how verdicts map to integration
- how QC is expected to behave in day-to-day repo usage

### 4. Squad Ownership And Phase Structure

- `docs/squad/README.md`
- `docs/squad/Squad_Workboard.md`
- agent specs
- QC spec
- Product Owner spec

These are the canonical source of truth for:

- who owns which workstream
- which phase a scope belongs to
- how work is split between agents

### 5. QC Reports And Execution Reports

- `docs/qc-reports/`

These are the canonical source of truth for:

- actual review history
- actual rework history
- actual implementation delivery history for a given scope

---

## 2. Core Team Goal

The team is no longer in discussion mode.

The team is now in:

**implementation, review, certification, and integration mode.**

This means:

- agents implement
- QC reviews and certifies
- Product Owner supervises execution and product coherence
- no one treats documentation as a substitute for real code delivery

---

## 3. Global Execution Rules

### Rule 1

Planning is not implementation.

### Rule 2

Documentation is not delivery.

### Rule 3

A scope is not done because it is well described.

### Rule 4

A scope is not approved because an agent says it is ready.

### Rule 5

A scope is not approved for integration until QC has issued a valid verdict.

### Rule 6

A scope is not considered product-safe if Product Owner intervention is required and has not happened yet.

### Rule 7

No team member may wait for manual prompting if the required report or reference should already be discoverable in the repo.

---

## 4. Mandatory Report Search Locations

Every agent and QC reviewer must search these locations before acting on a scope:

- `docs/qc-reports/`
- `docs/qc/`
- `docs/squad/`

Additionally, they must check:

- prior execution / resubmission / rejection / rework reports related to the same scope
- earlier notes for the same module, phase, route, or feature area

No one may claim:

- "I did not know where to look"
- "No one told me a report existed"
- "I only reviewed the latest message"

These are invalid excuses under this execution model.

---

## 5. Agent Execution Rules

### Agent Mission

Agents exist to implement owned scope in repository code.

They do not exist to:

- continue planning
- restate specs
- generate more documents instead of implementation
- wait for manual report lookup help

### Every Agent Must

#### Before starting work

1. identify the owned scope
2. search for relevant earlier reports in:
   - `docs/qc-reports/`
   - `docs/qc/`
   - `docs/squad/`
3. identify whether the scope was:
   - previously reviewed
   - previously rejected
   - previously reworked
   - previously escalated

#### During work

4. implement directly in the repository
5. change real files
6. wire the actual logic
7. align changes with prior findings where applicable

#### Before handing off

8. compare implementation against earlier findings
9. create an implementation delivery report
10. mark the scope only as:
   - **Ready For QC**

### Agents Must Not

- mark work as approved
- mark work as integrated
- skip report lookup
- deliver summaries instead of code
- claim completion without real repository implementation
- **replace a QC verdict with chat debate** (see **§5a**)
- **loop discussion** on a scope that Product Owner or QC has flagged **stalled** instead of posting the **same-day declaration** below (see **Execution enforcement — same-day scope declaration**)

### Execution enforcement — same-day scope declaration (anti-stall)

When **Product Owner** or **QC** records that **Agent 2 (B)** or **Agent 3 (C)** is **stalled** (planning or chat without corresponding **repository** movement in the current working window), the following is **mandatory**:

1. **Same calendar day** — the owning agent commits to `docs/qc-reports/` (branch per repo policy) an **implementation scope declaration**. It may be a **new** §6 delivery file or an **update** to the active §6 file for that slice, but it must contain **all** of the following in one place:
   - **Owned slice** — one bounded sentence: what will be implemented in **this** pass only.
   - **Exact repo file targets** — concrete paths under `frontend/`, `backend/`, `shared/`, `infra/`, or other tracked roots (no “the router area” or “settings generally”).
   - **Delivery report path** — full path to the §6 markdown file that will list *Files Changed*, tests, and *Existing Reports Checked* / *Existing QC Reports Checked* for this pass.
   - **Ready For QC target** — either the honest line **`READY FOR QC`** with the intended submission window, or **one** documented **Blocker** (owner, date, dependency) if work truly cannot proceed after a repo attempt.
2. **Block further discussion loops** on that scope until the declaration is **committed**: further messages must be **edits to that file** or **diffs**, not multi-round chat without repo evidence.
3. **If** the agent does **not** commit the declaration **and** does **not** land a **meaningful repo diff** for the declared slice within that same day (unless PO documents a shorter/longer window in [`qc-live-status.md`](../qc-reports/qc-live-status.md)), **Product Owner** may mark the scope **STALLED** in `qc-live-status.md` and **narrow** the slice, **reassign**, or **suspend** work until a fresh §6 intake exists.

---

## 5a. After A QC Verdict Is Published (Agents)

When a QC document in `docs/qc-reports/` or `docs/qc/` records a **verdict** and **Integration Status** for your scope:

1. **Do not** use chat or comments to re-litigate the verdict instead of coding. Prose disagreement is **not** a delivery.
2. **Do** read **Required Next Action** and any **Issues Still Open** / **New Issues** in that QC document, then **implement** in the repository against those items.
3. **Do** submit a fresh **§6** delivery report and **Ready For QC** when the implementation delta is real.

If the verdict is **Not Approved For Integration** or **Rework Required**, extended discussion is allowed **only** where **§9–§10** (QC / PO specs) explicitly require Product Owner or QC clarification — and must still result in a **tracked** outcome (repo note or updated QC doc), not an endless thread. Otherwise: **code first**.

---

## 6. Agent Delivery Format

Every agent delivery must include:

### Scope Implemented

### Files Changed

### Routes / APIs / Schemas / Components Changed

### Tests Added Or Updated

### Existing Reports Checked

### Existing QC Reports Checked

### Integration Notes

### Ready For QC: Yes / No

### Blockers

If these sections are missing, the delivery is incomplete.

---

## 7. QC Execution Rules

### QC Mission

QC exists to validate implemented work, not intentions.

QC must operate with continuity.

QC must not review each delivery as if history does not exist.

### Before issuing any verdict, QC must

1. identify the scope
2. identify the module, phase, and owner
3. search for previous reports in:
   - `docs/qc-reports/`
   - `docs/qc/`
   - `docs/squad/`
4. identify:
   - previous QC reports
   - previous rejections
   - previous rework requests
   - previous conditional approvals
   - previous Product Owner concerns, where documented

### During review, QC must

5. inspect real repository implementation
6. compare previous findings against the current state
7. verify whether earlier issues are:
   - resolved
   - still open
   - replaced by new issues

### After review, QC must

8. issue a structured verdict
9. map verdict to integration status
10. escalate to Product Owner if product-risk remains

### QC Must Not

- wait for someone to hand over a prior report
- review only the current message
- approve documentation in place of implementation
- ignore earlier rejected issues
- issue a verdict without recording previous-report status

---

## 8. QC Review Format

Every QC review must include:

### QC Scope Reviewed

### Previous QC Report Checked: Yes / No

### Previous QC Report Path / Reference

### Previously Reported Issues Resolved

### Previously Reported Issues Still Open

### New Issues Found

### Functional Validation

### Product Validation

### Risk Validation

### QC Verdict

### Integration Status

### Escalation To Product Owner: Yes / No

### Required Next Action

- **Mandatory first line (QC must copy verbatim into every review that records a `QC Verdict`, before scope-specific bullets):**  
  `Owning agent: required work is executed in the repository, not in chat instead of implementation — see docs/squad/IMPLEMENTATION_EXECUTION_RULES.md §5a and Hard Rule 8.`  
  Acceptable agent responses: repository changes plus a fresh **§6** delivery report, **or** **one** documented **Blocker** in that report.
- scope-specific required next steps (bulleted)

If these sections are missing, the QC review is incomplete.

A **Required Next Action** that omits the **Mandatory first line** above while a **QC Verdict** is recorded is also **incomplete**.

---

## 9. QC Verdict Vocabulary

### QC Operational Verdicts

- **Approved**
- **Rejected**
- **Rework Required**
- **Conditionally Approved**

### Integration Status Vocabulary

- **Approved For Integration**
- **Not Approved For Integration**

### Mandatory Mapping

- **Approved** → **Approved For Integration**
- **Rejected** → **Not Approved For Integration**
- **Rework Required** → **Not Approved For Integration**
- **Conditionally Approved** → **Not Approved For Integration** by default

### Conditional Approval Exception

Conditionally Approved may become integration-ready only if:

- all listed conditions are explicitly closed

or

- Product Owner explicitly accepts the remaining risk

---

## 10. Product Owner Execution Rules

### Product Owner Mission

The Product Owner exists to ensure:

- execution continues
- work stays aligned with product meaning
- module boundaries remain coherent
- the team does not drift back into endless discussion
- integration happens only when the product is actually coherent enough

### Product Owner Must

- monitor progress by phase and ownership
- ensure agents are implementing, not looping in discussion
- ensure QC is actively reviewing and comparing reports
- intervene when:
  - product meaning is weak
  - module boundaries blur
  - technically acceptable work is product-risky
  - credits / cost logic feels misleading
  - naming / route identity creates confusion
- decide on risk acceptance only where PO involvement is explicitly required

### Product Owner Must Not

- replace QC
- do repo report search on behalf of agents
- do repo report search on behalf of QC
- sign off work just because it is technically neat
- allow documentation state to masquerade as implementation state

---

## 11. Product Owner Review Format

Where Product Owner review is required, the review must include:

### Scope Reviewed

### QC Approved: Yes / No

### Product Meaning Clear: Yes / No

### Module Boundary Clear: Yes / No

### Cost / Credit Logic Honest: Yes / No

### Naming / Route Identity Coherent: Yes / No

### Product Concerns

### Product Signoff: Approved / Rework Required / Hold

---

## 12. Required Phase Flow

Every scope must move through this sequence:

### 1. Agent Intake

Agent identifies owned scope and finds earlier reports.

### 2. Implementation

Agent changes real repository code.

### 3. Delivery Report

Agent submits implementation delivery report.

### 4. Ready For QC

Agent marks the scope as Ready For QC.

### 5. QC Intake

QC identifies the scope and searches prior reports.

### 6. QC Review

QC validates implementation, compares previous findings, and issues verdict.

### 7. Integration Status

QC maps verdict to Approved For Integration or Not Approved For Integration.

### 8. Product Owner Review

Used only where product sense, risk, or final UX coherence requires Product Owner involvement.

No scope may skip the QC step.

---

## 13. Enforcement Rules

### Hard Rule 1

An agent delivery is invalid unless the agent checked for existing reports and documented that check.

### Hard Rule 2

A QC verdict is invalid unless QC checked for previous QC reports and documented that check.

### Hard Rule 3

A scope is not done because it is Ready For QC.

### Hard Rule 4

A scope is not integration-ready because an agent says so.

### Hard Rule 5

A scope is not product-complete until the required QC and Product Owner checks are complete.

### Hard Rule 6

Documentation alone never satisfies implementation-phase completion.

### Hard Rule 7 — Definition of **done** (implementation phase)

For implementation-phase work, **done** means **all** of the following exist in the repository:

1. **Implementation evidence** — real code or configuration change in the tree for the claimed scope.
2. **Fresh agent delivery** — a current delivery report that satisfies **§6** (including *Existing Reports Checked* and *Existing QC Reports Checked*), with **Ready For QC** only where honest.
3. **QC review in this model** — a QC document that satisfies **§8** (including *Previous QC Report Checked* and paths), a verdict under **§9**, and an explicit **Integration Status** mapping.

Chat-only claims, oral status, stale Product Owner pins, or **old** assignments without a **current** §6 report **and** a **current** §8 QC review **do not** close the scope and **do not** close history for that scope. Re-opening work requires a new pass through **§12** from agent intake onward.

### Hard Rule 8 — After a QC verdict: implement, do not discuss

A published QC verdict for a scope is **not** permission to debate the outcome in place of work. The owning agent must respond with **repository changes** plus a **§6** delivery report, or **one** documented **Blocker** (owner, date, dependency) in that same report — not multi-day discussion without diff.

### Hard Rule 9 — Stalled Agents 2 / 3: declare or be marked stalled

When **Agent 2 (B)** or **Agent 3 (C)** is flagged **stalled** under **§5** *Execution enforcement — same-day scope declaration*, the agent **must** commit that declaration **the same calendar day** (or within the PO-documented window in [`qc-live-status.md`](../qc-reports/qc-live-status.md)). **Chat-only** updates **do not** satisfy this rule. If the agent does **not** commit the declaration **and** does **not** produce a **meaningful repository diff** aligned to it, **Product Owner** may record the scope as **STALLED**, then **narrow**, **reassign**, or **suspend** until a new §6 intake is filed.

---

## 14. Practical Team Commands

### Agent Command

```text
You are in implementation mode, not discussion mode.

Before starting work, identify your scope and search for existing reports in:
- docs/qc-reports/
- docs/qc/
- docs/squad/

Do not wait for someone to manually tell you where reports are.
Find them yourself.

Then:
1. implement the owned scope directly in the repository,
2. compare your implementation against previous findings,
3. submit a delivery report,
4. mark the scope only as Ready For QC.

If PO or QC flags you **stalled** (Agent **2** or **3**): **same day**, commit to `docs/qc-reports/` your **implementation scope declaration** with: bounded **slice**, **exact file paths** you will touch, **delivery report path** (§6 file), and **Ready For QC** target (or **one Blocker**). **No discussion loops** until that is in the repo.

Do not mark work as done, approved, or integrated.
Documentation is not implementation.

After QC publishes a verdict on your scope: read Required Next Action, then commit code — do not argue the verdict in chat instead of implementing.
```

### QC Command

```text
You are the active quality gate.

Before issuing any verdict, search for previous reports in:
- docs/qc-reports/
- docs/qc/
- docs/squad/

Do not wait for someone to hand you a previous report.
Find it yourself.

Then:
1. identify the scope,
2. compare previous findings to the current implementation,
3. review the actual repository changes,
4. issue a structured verdict,
5. map the verdict to integration status,
6. escalate product-risk issues to Product Owner when needed.

A QC verdict is invalid if the previous-report check is missing.
```

### Product Owner Command

```text
You are responsible for execution discipline and product coherence.

You must ensure that:
- agents are implementing, not discussing,
- agents are following ownership and phase order,
- QC is actively reviewing and comparing against previous reports,
- product-risk issues are escalated to you,
- no scope is treated as complete before QC verdict,
- no module is signed off if it is technically acceptable but product-incoherent.

When Agent 2 or Agent 3 is stalled: require **same-day** committed **implementation scope declaration** in `docs/qc-reports/` (bounded slice, **exact repo file paths**, **delivery report path**, **Ready For QC** target or one Blocker). **Block discussion loops** until that exists. If they still do not move: mark **STALLED** in `qc-live-status.md`, then **narrow**, **reassign**, or **suspend**.

Your role is to keep the team moving toward implementation and integration, not back into planning loops.
```

---

## 15. Repo Placement

This document lives at:

`docs/squad/IMPLEMENTATION_EXECUTION_RULES.md`

That path governs:

- the entire squad
- the execution model
- implementation discipline
- the transition from planning to coding to QC to integration

---

## 16. Final Rule
Binding execution rule for the whole team:

Use docs/squad/IMPLEMENTATION_EXECUTION_RULES.md as the execution source of truth.

From now on:
- agents implement and find prior reports themselves,
- QC reviews and finds prior reports themselves,
- Product Owner supervises execution discipline and product coherence,
- documentation does not count as implementation,
- Ready For QC does not mean Approved For Integration.

The team must behave as follows:

- agents implement and self-locate relevant reports
- QC reviews, self-locates previous reports, and certifies only implemented work
- Product Owner supervises meaning, progress, and discipline
- no one waits for manual prompting where the repo already contains the needed source of truth

This is the binding execution model for implementation-phase work.

### Policy statement — definition of **done** (authoritative wording)

**PL:** Od teraz **„zrobione”** = wyłącznie **ślad w repozytorium** zgodnie z tym dokumentem (**Hard Rule 7**). **Stare** zlecenia **bez** świeżego raportu dostawy agenta (**§6**, w tym sprawdzenie wcześniejszych raportów) **oraz** świeżej recenzji QC w formacie **§8** (werdykt + status integracji wg **§9**) **nie zamykają** historii zakresu.

**EN:** From now on, **“done”** means **only** **repository evidence** under this document (**Hard Rule 7**). **Legacy** assignments **without** a **fresh** agent delivery report (**§6**, including prior-report checks) **and** a **fresh** QC review in the **§8** format (verdict + integration status per **§9**) **do not** close scope history.

---

## 17. Transition: Re-Verify Prior Scopes Under This Model

Work started before this file landed in the repo is **not exempt**.

For any new or resumed slice, the owning agent must:

1. Treat chat history and informal queues as **non-authoritative** relative to `docs/qc-reports/`, `docs/qc/`, and `docs/squad/`.
2. **Search** those locations for the same module, phase, route, or feature area and **list** in the delivery report (see §6) which paths were checked and whether prior QC or PO findings were **addressed**, **still open**, or **not applicable**.

QC must apply the same rule in reverse when comparing the new delivery to prior verdicts.

Until a scope has a **fresh** §6 delivery report and a **fresh** §8 QC review under this file, it remains **open** in process terms regardless of how long ago it was commissioned or discussed.

---

## History

| Date | Change |
|------|--------|
| 2026-04-18 | Added `IMPLEMENTATION_EXECUTION_RULES.md` (Agent 2 / B) — operational hierarchy, mandatory search locations, delivery and QC formats, PO rules, §17 transition. |
| 2026-04-19 | **Hard Rule 7** — definition of **done** (repo evidence + fresh §6 delivery + fresh §8 QC + integration mapping); stale commissions do not close history. §17 — explicit *open until* pairing. §16 — jawna definicja PL/EN „zrobione” = ślad w repo; stare zlecenia bez pary §6 + §8 nie zamykają historii. |
| 2026-04-19 | **§5a** + **Hard Rule 8** — po opublikowanym werdykcie QC agenci: implementacja w repo, nie dyskusja zamiast kodu; blokada = jeden wpis w §6, nie wątek bez diffu. |
| 2026-04-19 | **Wall: one table (flow summary)** — jedna tabela 5 kroków (Agent → QC → integracja) + link z `qc-live-status.md`. |
| 2026-04-22 | **§5** *Execution enforcement — same-day scope declaration (anti-stall)* + **Hard Rule 9** — Agent 2 / 3: deklaracja w repo tego samego dnia (slice, ścieżki plików, raport §6, cel Ready For QC); zakaz pętli dyskusji; przy braku ruchu PO może oznaczyć **STALLED** i zwęzić / przydzielić ponownie / zawiesić. |
