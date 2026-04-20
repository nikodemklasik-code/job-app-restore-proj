# QC Reporting, Certification, And Product Owner Communication Spec

## Purpose

This document defines the concrete Quality Control operating model for:

- report discovery  
- report review  
- certification  
- communication with Product Owner  
- implementation-phase enforcement  

It exists to stop QC from becoming:

- a passive reviewer  
- a one-time approver  
- a green-check machine  
- a person who reviews only the current message in isolation  

QC must work as an active quality gate with memory, continuity, and escalation discipline.

**Implementation execution (squad-wide — ranks above this doc for “where to look” and phase flow):** [`../squad/IMPLEMENTATION_EXECUTION_RULES.md`](../squad/IMPLEMENTATION_EXECUTION_RULES.md)

**Repo index:** [`README.md`](./README.md) · squad QC behaviour also in [`../squad/Quality_Control_Developer_Spec.md`](../squad/Quality_Control_Developer_Spec.md) · live broadcast: [`../qc-reports/qc-live-status.md`](../qc-reports/qc-live-status.md).

**Integration vocabulary (this repo):** [`../policies/quality-control-developer-role-spec.md`](../policies/quality-control-developer-role-spec.md) requires an explicit merge/release line: **Approved For Integration** or **Not Approved For Integration**. Map this spec’s verdicts as follows: **Approved** → *Approved For Integration*; **Rejected** and **Rework Required** → *Not Approved For Integration* (with required next action in the report); **Conditionally Approved** → still *Not Approved For Integration* until the listed minor issues are closed **or** PO explicitly accepts the condition in writing in the same thread — then QC may re-issue *Approved For Integration*.

---

## 1. QC Role

Quality Control is responsible for:

- validating implementation, not intentions  
- checking whether earlier QC findings already exist  
- comparing current delivery against earlier findings  
- issuing a structured verdict  
- certifying only what is genuinely ready  
- escalating unresolved risk or product incoherence to Product Owner  

QC is not responsible for:

- implementing features  
- rewriting specs in place of review  
- approving because a developer sounds confident  
- approving because tests alone are green  

---

## 2. Core QC Principle

**A QC verdict is invalid unless QC checks whether previous reports exist for the same scope and explicitly reports their status.**

QC must not review the current delivery in isolation if:

- the same module  
- the same phase  
- the same scope  
- or the same route / screen / backend area  

has already been reviewed before.

---

## 3. QC Mandatory Responsibilities

QC must do all of the following before issuing a verdict:

### A. Scope Identification

Identify:

- module  
- phase  
- owner / agent  
- exact implementation scope  
- related routes / files / backend services  
- whether the scope overlaps a previously reviewed area  

### B. Previous Report Check

Check whether a previous QC report exists for:

- the same module  
- the same phase  
- the same workstream  
- or the same implementation area  

### C. Current Delivery Review

Review:

- real repository changes  
- claimed files changed  
- claimed tests  
- actual implementation completeness  
- wiring and product effect  
- not just code presence  

### D. Delta Review

Compare:

- what was previously flagged  
- what is now fixed  
- what remains unresolved  
- what is newly broken  

### E. Certification Decision

Issue one of:

- **Approved**  
- **Rejected**  
- **Rework Required**  
- **Conditionally Approved** (use sparingly and only if clearly justified)  

### F. Product Owner Escalation

If the work creates:

- product ambiguity  
- major UX inconsistency  
- cross-module meaning conflict  
- cost honesty concern  
- source-trust concern  
- release risk  

QC must explicitly communicate this to Product Owner.

---

## 4. Where QC Checks Reports

QC must check reports in all designated QC / squad / implementation tracking locations used by the repo.

At minimum, QC must look in:

- [`docs/squad/`](../squad/)  
- **`docs/qc/`** (this tree — phase and module reports)  
- **`docs/review/`** (if present)  
- module-specific docs folders if they contain QC outputs  
- **[`docs/qc-reports/`](../qc-reports/)** — **mandatory**: historical decisions, `qc-live-status`, agent reports, intake decisions  
- previous delivery notes attached to the same scope  
- previous rejection / rework notes for the same phase  

### Canonical QC storage (this repo)

Use:

```text
docs/qc/
  README.md
  phase-1/
  phase-2/
  phase-3/
  phase-4/
  modules/
```

Per report naming (new reports):

```text
QC_<module>_<phase>_<date>.md
```

Examples:

```text
QC_Billing_Phase_1_2026-04-16.md
QC_Job_Radar_Phase_3_2026-04-16.md
QC_Legal_Hub_Search_Phase_3_2026-04-16.md
```

Legacy and broadcast material **remain** under `docs/qc-reports/` until migrated; **search both** `docs/qc/` and `docs/qc-reports/` until PO/QC agree migration is complete.

---

## 5. How QC Searches For Reports

Before issuing a new verdict, QC must actively search for existing reports.

### Search Strategy

QC should search by:

- module name  
- phase name  
- route name  
- feature name  
- prior rejection wording  
- agent ownership area  

### Required Search Targets

QC must search for:

- previous QC report  
- previous rejection note  
- previous rework request  
- previous conditional approval  
- previous Product Owner concern if documented  

### Search Questions QC Must Ask

- Has this scope been reviewed before?  
- Was it rejected previously?  
- Was it conditionally approved?  
- Were there open issues that must now be rechecked?  
- Did Product Owner request follow-up on this scope?  

---

## 6. How QC Certifies Work

QC does not “certify effort”.  
QC certifies only implemented, reviewable, product-valid work.

### Certification Levels

#### Approved

Use only when:

- implementation is real  
- previous critical issues are resolved  
- no major open blocker remains  
- module is technically and product-wise acceptable for this phase  

#### Rejected

Use when:

- implementation is missing or fake-complete  
- critical issues remain unresolved  
- scope is still mixed / unclear / unsafe  
- delivery is mostly documentation or partially wired work  

#### Rework Required

Use when:

- meaningful work exists  
- but the scope is not yet clean enough for approval  
- some issues are resolved, but essential gaps remain  

#### Conditionally Approved

Use only if:

- the module is acceptable to proceed  
- remaining issues are minor, explicitly listed, and time-bounded  
- no hidden risk remains  

QC must avoid conditional approval as a lazy shortcut.

---

## 7. QC Certification Rules

QC may certify only if all of the following are true:

- previous report status was checked  
- implementation exists in repository code  
- delivery format is complete  
- claimed files changed are real  
- claimed tests are real  
- module behaviour matches spec  
- product meaning is coherent  
- no silent hidden risk remains  
- unresolved issues are explicitly recorded  
- whenever a **QC Verdict** is recorded, **Required Next Action** begins with the **Mandatory first line** defined in **§8** (same verbatim text in every verdict-bearing review)

If any of the above are missing, QC review is incomplete.

---

## 8. Required QC Review Format

Every QC review must use this structure:

### QC Scope Reviewed

- module  
- phase  
- owner / agent  
- exact scope  

### Previous QC Report Checked

- Yes / No  

### Previous QC Report Path / Reference

- exact path or note  
- if none: `No previous QC report found for this scope.`  

### Previously Reported Issues Resolved

- list exact resolved issues  

### Previously Reported Issues Still Open

- list exact remaining issues  

### New Issues Found

- list new problems found in the current review  

### Functional Validation

- what works  
- what persists  
- what returns correct outputs  
- what is still broken  

### Product Validation

- whether module purpose is now clear  
- whether implementation matches intended product role  
- whether the module is still mixed or incoherent  

### Risk Validation

- cost honesty  
- source restriction integrity  
- consent behaviour  
- deploy safety  
- user-facing risk  

### QC Verdict

- Approved / Rejected / Rework Required / Conditionally Approved  

### Required Next Action

- **Mandatory first line (copy verbatim into every QC review that records a `QC Verdict`):**  
  `Owning agent: required work is executed in the repository, not in chat instead of implementation — see docs/squad/IMPLEMENTATION_EXECUTION_RULES.md §5a and Hard Rule 8.`  
  (Purpose: each verdict reminds the owning agent that the next acceptable response is **diff in repo** plus a fresh agent **§6** delivery report, **or** **one** documented **Blocker** in that same report — not a multi-day debate without implementation evidence.)
- exact scope-specific required next steps (bulleted)

### Escalation To Product Owner

- Yes / No  
- if yes, what exactly must PO review  

---

## 9. QC Communication With Product Owner

QC must communicate with Product Owner whenever the issue is not only technical.

### QC must escalate to Product Owner if:

- module meaning is still unclear  
- two modules overlap product-wise  
- naming / routing causes user confusion  
- cost behaviour is technically correct but product-wise misleading  
- a source-restricted module feels too open or unsafe  
- a module is technically ready but product-coherence is weak  
- approval would create downstream UX inconsistency  

### QC should not escalate to Product Owner for:

- minor syntax fixes  
- simple test failures with no product meaning  
- implementation details that do not affect user-facing coherence  

---

## 10. Product Owner Communication Format

When escalating, QC must send a short structured note:

### Product Owner Escalation Note

- **Scope**  
- **Current QC Verdict**  
- **Why QC Is Escalating**  
- **What Is Technically Fine**  
- **What Is Product-Risky**  
- **What PO Must Decide**  
- **Recommended Outcome**  
  - approve  
  - require rework  
  - hold until alignment  

### Example

```text
Scope: Job Radar Phase 3
Current QC Verdict: Rework Required
Why QC Is Escalating: Route identity and cards are technically implemented, but the module still feels too close to Jobs and does not clearly communicate premium signal intelligence.
What Is Technically Fine: routing, data loading, watchlist wiring, alerts
What Is Product-Risky: user-facing distinction between Jobs and Job Radar remains weak
What PO Must Decide: whether current differentiation is sufficient for release candidate
Recommended Outcome: require rework before signoff
```

---

## 11. QC Recheck Rule

If a scope returns after rejection or rework request, QC must not perform a fresh naive review.

QC must:

- re-open the previous QC report  
- explicitly compare old issues against new implementation  
- state which rejected items are resolved  
- state which rejected items remain  

This prevents:

- report amnesia  
- re-reviewing from zero  
- accidental approval of previously rejected risk  

---

## 12. QC Completion Rule

QC review is complete only when:

- previous report check is documented  
- verdict is explicit  
- remaining issues are explicit  
- next step is explicit (**Required Next Action** must open with the **Mandatory first line** from **§8** whenever a **QC Verdict** is present)  
- Product Owner escalation is explicit where needed  

If those are missing, the QC review itself is incomplete.

---

## 13. Repo-Ready QC Folder Recommendation

Recommended structure:

```text
docs/qc/
  README.md
  phase-1/
  phase-2/
  phase-3/
  phase-4/
  modules/
    billing/
    profile/
    skill-lab/
    job-radar/
    legal-hub-search/
    practice/
    settings/
    community/
    deploy/
```

### Recommended module report naming

```text
QC_<module>_<phase>_<status>_<date>.md
```

Examples:

- `QC_Billing_Phase_1_Rework_2026-04-16.md`  
- `QC_Profile_Phase_2_Approved_2026-04-16.md`  
- `QC_Legal_Hub_Search_Phase_3_Rejected_2026-04-16.md`  

This makes searching and continuity much easier.

---

## 14. Enforcement Rules To Add To QC Workflow

### Hard Rule 1

**QC must not issue a verdict without checking for previous QC reports.**

### Hard Rule 2

**QC must not approve documentation in place of implementation.**

### Hard Rule 3

**QC must compare the current delivery against previous rejected or rework-required issues where such issues exist.**

### Hard Rule 4

**QC must escalate product-risk issues to Product Owner instead of quietly approving technically neat but product-weak work.**

---

## 15. One-Line QC Execution Command

```text
Before issuing any QC verdict, you must identify the scope, search for previous QC reports for the same module or phase, compare old findings with the current implementation, certify only implemented and product-valid repository work, and explicitly escalate any product-risk issues to Product Owner.
```

---

## 16. One-Line Product Owner Communication Rule

```text
QC must communicate with Product Owner whenever a delivery is technically workable but still product-risky, module-confused, cost-misleading, naming-incoherent, or unsafe in source / trust terms.
```

---

## Historia

| Data | Zmiana |
|------|--------|
| 2026-04-18 | v1.0 — import specu; powiązanie z `docs/qc-reports/` i `docs/squad/`. |
