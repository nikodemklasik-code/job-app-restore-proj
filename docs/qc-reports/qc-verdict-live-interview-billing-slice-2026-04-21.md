# QC Verdict — Live Interview billing slice (only)

**Intake (§6):** [`execution-live-interview-billing-slice-2026-04-20.md`](./execution-live-interview-billing-slice-2026-04-20.md)  
**Date:** 2026-04-21  
**Reviewer:** QC  
**Rules:** [`docs/squad/IMPLEMENTATION_EXECUTION_RULES.md`](../squad/IMPLEMENTATION_EXECUTION_RULES.md) §6 · §8 · §9 · Hard Rule 7  

**Binding:** This review **does not** approve legacy **`interview.router`**, **Negotiation**, wider **Interview**, **C-F1**, or **Practice** beyond the **Live Interview `liveInterviewRouter` spend flow** and the **named migration** in scope below.

---

## QC Scope Reviewed

- **§6 delivery:** [`execution-live-interview-billing-slice-2026-04-20.md`](./execution-live-interview-billing-slice-2026-04-20.md) — boundaries, claims, gaps, blockers.  
- **Code:** `backend/src/trpc/routers/liveInterview.router.ts` (create / complete / abandon, `commitOrRejectLiveInterviewSpend`, rollback helper, mode→feature mapping).  
- **Catalogue:** `backend/src/services/creditsConfig.ts` — `interview_lite`, `interview_standard`, `interview_deep`.  
- **Schema:** `backend/src/db/schema.ts` — `pendingCreditSpendEventId` ↔ SQL `pending_credit_spend_event_id`.  
- **Migration:** `backend/sql/2026-04-20-live-interview-pending-spend.sql`.  
- **Engine context (spot):** `backend/src/services/liveInterviewEngine.ts` — `CREATED` on create; abandon semantics vs router `CREATED`→`ABANDONED` branch.  
- **Verification command (mandatory):**  
  `cd /Users/nikodem/job-app-restore/proj/backend && npm run build && npm test`

---

## Previous QC Report Checked: Yes

Active search performed under **`docs/qc-reports/`**, **`docs/qc/`**, **`docs/squad/`** (ripgrep + file reads). Relevant prior artefacts cross-read for deltas and contradictions; **`docs/qc/`** contains only phase README placeholders (no Live Interview-specific prior verdict). **`docs/squad/`** has no dedicated Live Interview billing verdict text; squad specs provide ownership context only — **not** used to widen this verdict.

---

## Previous QC Report Path / Reference

| Path | Relevance |
|------|-----------|
| [`execution-live-interview-billing-slice-2026-04-20.md`](./execution-live-interview-billing-slice-2026-04-20.md) | **Canonical §6** for this QC cycle. |
| [`qc-verdict-c-f1-coach-follow-up-2026-04-21.md`](./qc-verdict-c-f1-coach-follow-up-2026-04-21.md) | Flags incorrect **other** §6 (`agent-3-c-f1-interview-negotiation-server-billing-2026-04-21.md`) re Live Interview — **does not** replace this intake; confirms Live Interview engine usage exists in repo. |
| [`qc-live-status.md`](./qc-live-status.md) | Broadcast; prior C-F1 / Coach / Live Interview notes. |
| [`qc-repo-sweep-current-diff-2026-04-18.md`](./qc-repo-sweep-current-diff-2026-04-18.md) | Historical map (mentions `liveInterviewEngine` in file lists only). |
| [`qc-verdict-current-gate-state-2026-04-18.md`](./qc-verdict-current-gate-state-2026-04-18.md) | Historical gate snapshot — wider Practice **NAFI** unchanged. |

---

## Previously Reported Issues Resolved

- **Gap (prior C-F1 / sweep narrative):** persisted Live Interview lacked engine reservation + settlement on **`liveInterviewRouter`** — **resolved in code** for this slice: `approveSpend` on `createSession`, pending id persistence, `commitSpend` / `rejectSpend` on complete and abandon paths, rollback on approval failure, per Functional Validation below.

---

## Previously Reported Issues Still Open

- **Legacy `interview.router`** — **unchanged** in this intake; **no** QC approval of that surface **here**.  
- **Negotiation** (Express / services) — **unchanged**; **no** QC approval **here**.  
- **Wider C-F1 / Practice / C-F2 / Community–Consent** — remain **Not Approved For Integration** under prior decisions until separate §6 + §8; **explicitly not** addressed by this intake.  
- **Dedicated Vitest** for `liveInterviewRouter` billing — **still absent** in this §6 (not a “resolved” item).

---

## New Issues Found

1. **Non-atomic boundary:** The `try`/`catch` around `approveSpend` + `UPDATE` of `pendingCreditSpendEventId` only rolls back the session when **`approveSpend`** throws. If **`approveSpend` succeeds** and the **`db.update`** then throws, there is **no** automatic `rejectSpend` or session delete in that path — **low-probability stranded reservation** risk.  
2. **No automated test file** for this router billing slice in the §6 — process gap (see Integration Status).

---

## Functional Validation

| Requirement | Result |
|-------------|--------|
| **`liveInterviewRouter` spend flow only** | Review limited to `liveInterview.router.ts` + migration + schema lines above; no other routers modified in scope. |
| **`approveSpend` after session creation** | `createSession` first (`liveInterview.router.ts` ~134–136), then `approveSpend` (~137–143). |
| **`pending_credit_spend_event_id` persistence** | `db.update(liveInterviewSessions).set({ pendingCreditSpendEventId: approval.spendEventId })` after approval; Drizzle maps to `pending_credit_spend_event_id`. |
| **`commitSpend` after successful `completeSession`** | `completeSession` in inner `try`; on success, `commitOrRejectLiveInterviewSpend(..., 'commit')`; on `completeSession` throw, **`commit` not called** — `reject` path first. |
| **`rejectSpend` on abandon** | `abandon` calls `commitOrRejectLiveInterviewSpend(..., 'reject', 'user_abandoned')` before session state mutations. |
| **`rejectSpend` on completion failure** | On `completeSession` throw: `reject` with error-derived reason. On `commitSpend` throw inside helper: `rejectSpend` in inner `catch`, clear pending, rethrow / map `BillingError`. |
| **Rollback if approval fails after session creation** | On `approveSpend` failure: `rollbackLiveInterviewSession` deletes turns + session row. |
| **`CREATED` → `ABANDONED` handling** | `abandon`: if status `CREATED`, direct `UPDATE` to `ABANDONED` with timestamps; if `ACTIVE`, `abandonSession` after reject. |
| **Migration file for pending spend column** | [`backend/sql/2026-04-20-live-interview-pending-spend.sql`](../../backend/sql/2026-04-20-live-interview-pending-spend.sql) — nullable `VARCHAR(36)` after `ended_at`; matches intake. |
| **Backend verification** | **Run In:** `/Users/nikodem/job-app-restore/proj/backend` — **Command:** `cd /Users/nikodem/job-app-restore/proj/backend && npm run build && npm test` — **Result:** `npm run build` (**tsc** OK); `npm test` — **29** test files, **125** tests passed (2026-04-21 QC run). |

**Boundaries verified against intake:** §6 states legacy **`interview.router`** unchanged, **Negotiation** unchanged, **does not** claim AFI for itself, **does not** broaden to wider C-F1/Practice — **all accurate** for this delivery document.

---

## Product Validation

- **Commit amount:** `commitSpend` uses **`minCost`** from `FEATURE_COSTS` for the feature on the pending spend event (estimated features) — conservative; matches intake *New Gaps*; **PO should confirm** product intent vs `maxCost` or future metering.  
- **Legacy rows** without `pending_credit_spend_event_id`: helper no-ops when `pending` is null — behaviour matches intake *New Gaps*.  
- **CREATED-only abandon:** user can abandon without ever starting; credits released via `reject` when pending exists — aligns with intake narrative.

---

## Risk Validation

- **Production MySQL:** Without applying the **ALTER**, runtime errors on read/write of `pending_credit_spend_event_id` — **deploy blocker** (intake §Blockers). **Mitigation:** run DDL on every target DB before traffic.  
- **Stranded approval** (New Issues #1) — document and optionally harden in a follow-up.  
- **No Vitest for this slice** — regression risk until hermetic tests exist.

---

## QC Verdict

**Live Interview billing slice** — `liveInterviewRouter` spend flow + migration artefact as described in [`execution-live-interview-billing-slice-2026-04-20.md`](./execution-live-interview-billing-slice-2026-04-20.md): **Approved For Integration**, **narrow and conditional**:

1. **Condition:** MySQL migration from `backend/sql/2026-04-20-live-interview-pending-spend.sql` **applied** on each environment before production use of this path.  
2. **No widening:** This is **not** approval of **legacy `interview.router`**, **Negotiation**, wider **Interview**, or **C-F1 / Practice**.

The §6 intake correctly **does not** self-assert **Approved For Integration**; this **§8** document is the binding integration statement **for this slice only**.

---

## Integration Status

| Surface | Status |
|---------|--------|
| **Live Interview billing slice** (`liveInterviewRouter` + pending column + SQL migration as in §6) | **Approved For Integration** (bounded, conditional on DDL) |
| **MySQL DDL** (`pending_credit_spend_event_id`) | **Mandatory pre-prod gate** — acceptable design; **must not be skipped** |
| **Hermetic Vitest for this router billing** | **Not Approved For Integration** (not delivered in this §6) |
| **Legacy `interview.router`** | **Not in scope — not approved here — unchanged by this intake** |
| **Negotiation** | **Not in scope — not approved here — unchanged by this intake** |
| **Wider C-F1 / Practice / C-F2** | **Not in scope — not approved here** |

---

## Escalation To Product Owner

- Confirm **`minCost`** at `complete` vs product expectation for “session completed” billing.  
- Confirm UX/messaging when users **abandon** sessions in **`CREATED`** (credits released when pending id exists).

---

## Required Next Action

- **Ops / Agent 3:** Apply `backend/sql/2026-04-20-live-interview-pending-spend.sql` on staging/production MySQL **before** relying on new router behaviour.  
- **Agent 3 (optional follow-up §6):** Add hermetic Vitest for `liveInterviewRouter` (mock `db` + `creditsBilling`), then request a narrow QC delta.  
- **Engineering (optional):** Harden `approveSpend` + `UPDATE` pending id (transaction or compensating `rejectSpend` on update failure).  
- **QC:** Any material change to this flow — new §6 + fresh §8; **do not** cite [`agent-3-c-f1-interview-negotiation-server-billing-2026-04-21.md`](./agent-3-c-f1-interview-negotiation-server-billing-2026-04-21.md) as accurate for Live Interview until its Live Interview row is corrected (see [`qc-verdict-c-f1-coach-follow-up-2026-04-21.md`](./qc-verdict-c-f1-coach-follow-up-2026-04-21.md)).
