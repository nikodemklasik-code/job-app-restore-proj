# Agent 3 — C-F1 Interview / Negotiation — server billing (§6 intake: corrected scope)

**Date:** 2026-04-21 · **Resubmitted:** 2026-04-22 (§Scope / §Routes headings aligned with [`qc-verdict-c-f1-reeval-coach-intake-practice-boundaries-2026-04-22.md`](./qc-verdict-c-f1-reeval-coach-intake-practice-boundaries-2026-04-22.md) *Required Next Action*; no change to approved Coach or Live Interview code slices.)  
**Errata (2026-04-21):** An earlier draft of this intake incorrectly stated that `liveInterview.router` had no server billing. That was **factually wrong**. Live Interview uses `approveSpend` / `commitSpend` / `rejectSpend` in `liveInterview.router.ts` and is covered by a **separate** QC verdict (see below). This document is resubmitted **Ready For QC** as a **corrected intake** only — it does **not** claim **Approved For Integration** for legacy Interview, Negotiation, or any billing slice beyond what QC has already ruled.

**Mandatory first line (§5a / Hard Rule 8):** Owning agent: required work is executed in the repository, not in chat instead of implementation — see [`docs/squad/IMPLEMENTATION_EXECUTION_RULES.md`](../squad/IMPLEMENTATION_EXECUTION_RULES.md) §5a and Hard Rule 8.

**Prior QC (Coach follow-up):** [`qc-verdict-c-f1-coach-follow-up-2026-04-21.md`](./qc-verdict-c-f1-coach-follow-up-2026-04-21.md) — *Required Next Action*: correct the Interview/Negotiation intake so it does not misdescribe Live Interview billing.

**Prior QC (Live Interview billing — already AFI, separate slice):** [`qc-verdict-live-interview-billing-slice-2026-04-21.md`](./qc-verdict-live-interview-billing-slice-2026-04-21.md).

---

## Scope Implemented

### Scope

**Documentation correction only.** Clarify three **distinct** server surfaces (classic / live / negotiation) so QC is not asked to approve a false premise. This intake **does not** claim that “Interview” as a product umbrella has **no** server debits — **Live Interview** debits via `liveInterviewRouter` per the separate billing verdict.

**What this intake argues (narrowly):** For **legacy** `interview.router` and **negotiation** Express paths, Agent 3 is **not** claiming **AFI** for new billing wiring, nor asserting that those paths match product’s eventual debit boundary. **Wider C-F1 / C-F2 / Practice–Settings–Community** stays outside this document’s closure claims.

### Routes

Server surfaces and billing reality (surveyed paths):

| Surface | Router / entry | Server billing (`approveSpend` / `commitSpend` / `rejectSpend` or equivalent) in surveyed code |
|--------|----------------|--------------------------------------------------------------------------------------------------|
| **Legacy Interview (tRPC)** | `backend/src/trpc/routers/interview.router.ts` | **No** — session CRUD / scoring helpers; no `creditsBilling` imports in that file. |
| **Live Interview (tRPC)** | `backend/src/trpc/routers/liveInterview.router.ts` | **Yes** — imports from `../../services/creditsBilling.js`; `approveSpend` on `createSession`; `commitSpend` / `rejectSpend` via `commitOrRejectLiveInterviewSpend`; `pendingCreditSpendEventId` on `liveInterviewSessions`. **Not** bundled into this intake’s justification — **AFI** only per [`qc-verdict-live-interview-billing-slice-2026-04-21.md`](./qc-verdict-live-interview-billing-slice-2026-04-21.md). |
| **Negotiation** | Express `/api/negotiation/*` in `backend/src/server.ts` → `backend/src/services/negotiationConversation.ts` | **Not claimed** — no `approveSpend` / `commitSpend` wiring asserted or **AFI**-requested in this intake. |

---

## Files Changed

- `docs/qc-reports/agent-3-c-f1-interview-negotiation-server-billing-2026-04-21.md` (this file — headings + factual table + cross-links).

---

## Routes / APIs / Schemas / Components Changed

**None in application code** for this resubmission — only this QC intake document was updated.

---

## Tests Added Or Updated

None — documentation-only intake.

---

## Existing Reports Checked

| Path | Notes |
|------|--------|
| [`qc-verdict-c-f1-coach-follow-up-2026-04-21.md`](./qc-verdict-c-f1-coach-follow-up-2026-04-21.md) | Required correction to this intake; Coach test file **AFI** (do not re-open unless new QC finding). |
| [`qc-verdict-live-interview-billing-slice-2026-04-21.md`](./qc-verdict-live-interview-billing-slice-2026-04-21.md) | Live Interview billing slice **AFI** — authoritative for that router. |
| [`qc-verdict-c-f1-practice-hidden-spend-coach-slice-2026-04-20.md`](./qc-verdict-c-f1-practice-hidden-spend-coach-slice-2026-04-20.md) | Original Coach slice context. |
| [`qc-verdict-c-f1-reeval-coach-intake-practice-boundaries-2026-04-22.md`](./qc-verdict-c-f1-reeval-coach-intake-practice-boundaries-2026-04-22.md) | Required rewrite of §Scope / §Routes vs repo. |
| [`docs/qc-reports/qc-repo-sweep-current-diff-2026-04-18.md`](./qc-repo-sweep-current-diff-2026-04-18.md) §2.9 | C-F1 Practice scope reference. |
| [`docs/qc-reports/qc-decision-practice-modules-settings-community-2026-04-18.md`](./qc-decision-practice-modules-settings-community-2026-04-18.md) | Wider gate still open. |

---

## Existing QC Reports Checked

Same as table above.

---

## Integration Notes

Documentation-only delta. No deploy artefacts, no SQL, no PM2. Does not alter integration status of Coach or Live Interview billing slices.

---

## Previously Reported Issues Resolved

- **Factual error removed:** Live Interview is **not** described as having “no billing imports”; billing is explicitly attributed to `liveInterview.router.ts` and cross-referenced to the **AFI** Live Interview billing verdict.
- **Legacy vs live vs negotiation** are separated in one table so Required Next Action #2 is not satisfied by a false blanket “no server debit.”

---

## Previously Reported Issues Still Open

- **Legacy Interview / Negotiation:** Product/engineering still must define **where** to charge if server enforcement is required beyond current behaviour; any future wiring belongs in a **new** delivery + §6 intake — **not AFI** from this document.
- C-F1 FE boundary, C-F2, Community — unchanged from prior QC decision documents.

---

## New Gaps Or Limitations

- **Catalogue vs enforcement:** `FEATURE_COSTS` keys for `interview_*` / `negotiation_*` may apply to Live Interview modes or future wiring; legacy `interview.router` paths surveyed still show **no** `creditsBilling` usage in that file — coordinate with PO/FE so UI does not imply enforcement where none exists on that surface.

---

## Ready For QC: Yes

**Yes** — for **review of this corrected intake document** (truthful separation of legacy Interview, Live Interview, and Negotiation; no widening of AFI; no claim of AFI for Interview or Negotiation billing). **Not** a request to approve billing for legacy Interview or Negotiation.

---

## Blockers

**None** for completing this documentation correction.
