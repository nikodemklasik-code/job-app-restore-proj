# §6 Delivery Report — Live Interview billing-engine slice

**Date:** 2026-04-20  
**Scope label:** Live Interview (`liveInterviewRouter`) spend flow only — **not** Approved For Integration (AFI); **not** a verdict; submission for QC intake per [`IMPLEMENTATION_EXECUTION_RULES.md`](../squad/IMPLEMENTATION_EXECUTION_RULES.md) §6 and [`execution-reporting-standard.md`](../policies/execution-reporting-standard.md).

**Explicit boundaries (do not widen when reviewing):**

- **Live Interview billing slice implemented** — yes, as described below.
- **`interview.router` (legacy)** — **unchanged** in this iteration.
- **Negotiation** — **unchanged** in this iteration.
- **Wider C-F1 / wider Practice** — **out of scope**; no claim of coverage or approval.

**READY FOR QC:** Yes

---

## Scope Implemented

- **tRPC `liveInterview` router only:** integrated credits engine for persisted live interview sessions.
- **`createSession`:** after `liveInterviewEngine.createSession` persists the row, calls **`approveSpend`** with `referenceId` = session id, maps interview **mode** → catalogue feature (`interview_lite` | `interview_standard` | `interview_deep`), stores returned spend event id in **`live_interview_sessions.pending_credit_spend_event_id`**. On **`approveSpend` failure**, deletes the newly created session row and any turns (**rollback**), then maps `BillingError` via **`billingToTrpc`**.
- **`complete`:** on successful **`completeSession`**, calls **`commitSpend`** with **`actualCost`** derived from `FEATURE_COSTS` for the feature recorded on the spend event (estimated → **minCost**). Clears **`pending_credit_spend_event_id`** after success. If **`completeSession`** throws, calls **`rejectSpend`** (when a pending id exists) before surfacing TRPC errors. Commit failure path: attempt **`rejectSpend`**, clear pending column, rethrow / map billing errors.
- **`abandon`:** **`rejectSpend`** when pending id present; then **`abandonSession`** if status was **ACTIVE**, else if **CREATED** updates row to **`ABANDONED`** with timestamps (engine previously did not abandon **CREATED**-only sessions).
- **Migration artifact:** SQL file adding nullable **`pending_credit_spend_event_id`** on **`live_interview_sessions`** for operators / deploy prep.
- **Verification:** backend **`npm run build`** and full **`npm test`** run on the submitting tree.

---

## Files Changed

| Path | Role |
|------|------|
| `backend/src/trpc/routers/liveInterview.router.ts` | Spend flow, mode→feature mapping, rollback, complete/abandon settlement |
| `backend/src/db/schema.ts` | `liveInterviewSessions.pendingCreditSpendEventId` column definition (Drizzle) |
| `backend/sql/2026-04-20-live-interview-pending-spend.sql` | MySQL `ALTER TABLE` for production / staging |
| `docs/qc-reports/execution-live-interview-billing-slice-2026-04-20.md` | This §6 report |

---

## Routes / APIs / Schemas Changed

| Area | Change |
|------|--------|
| **tRPC `liveInterview.createSession`** | Same public contract; server-side **`approveSpend`** + optional DB update for pending spend id; rollback deletes session on approval failure. |
| **tRPC `liveInterview.complete`** | Same input/output shape; post-`completeSession` **`commitSpend`** + clear pending id. |
| **tRPC `liveInterview.abandon`** | Same input/output shape; **`rejectSpend`** first; **CREATED** → **ABANDONED** via direct row update when applicable. |
| **`liveInterview.startSession` / `respond` / `getSession`** | No billing change to procedure contracts. |
| **MySQL `live_interview_sessions`** | New nullable column **`pending_credit_spend_event_id`** (see SQL file). Drizzle schema aligned. |

---

## Tests Added Or Updated

- **Initial §6 submission:** none (regression only).
- **Follow-up (QC Required Next Action):** `backend/src/trpc/routers/__tests__/liveInterview.router.spec.ts` — hermetic Vitest (mock `db`, `creditsBilling`, `liveInterviewEngine`, `clerk`; `router({ liveInterview: liveInterviewRouter })` only). Covers: `approveSpend` feature mapping (`behavioral` → `interview_standard`), rollback on approval failure, **`rejectSpend` after successful approval when pending-row `UPDATE` fails** (QC stranded-approval note), `complete` → `commitSpend` with `minCost` 4 for `interview_lite`, `abandon` on **CREATED** → `rejectSpend` without `abandonSession`.

---

## Existing Reports Checked

- [`docs/qc-reports/qc-live-status.md`](./qc-live-status.md) — broadcast and C-F1 follow-up context.
- [`docs/qc-reports/qc-verdict-c-f1-practice-hidden-spend-coach-slice-2026-04-20.md`](./qc-verdict-c-f1-practice-hidden-spend-coach-slice-2026-04-20.md) — *Issues Still Open* (Interview / Negotiation paths).
- [`docs/squad/IMPLEMENTATION_EXECUTION_RULES.md`](../squad/IMPLEMENTATION_EXECUTION_RULES.md) — §6 delivery / anti-widening.

---

## Existing QC Reports Checked

- **C-F1 Coach slice verdict** (link above) — used only to align **engine pattern** (`approveSpend` → persist reservation → `commitSpend` / `rejectSpend`); this delivery is **not** a re-submission of the Coach slice and does **not** request merging verdicts.

---

## Previously Reported Issues Resolved

- **QC C-F1 — “Live Interview billable path had no `approveSpend` / `commitSpend`”** for the **persisted AI live interview** surface (`liveInterviewRouter` + `live_interview_sessions`): server now approves on create, commits on successful complete, rejects on abandon or failed complete before settlement, with audit trail via existing **`credit_spend_events`** pipeline (through `creditsBilling`).

---

## Previously Reported Issues Still Open

- **`interview.router`** (legacy recorded interview: `interview_sessions` / `interview_answers`) — **no engine spend wiring** in this iteration.
- **Negotiation** product/API surfaces — **unchanged**; no spend engine in this slice.
- **Wider C-F1** (Practice FE boundary, warmup/skill_lab/job_radar cost routes, etc.) — **explicitly not addressed**.
- **Wider Practice / C-F2 / Community–Consent** — unchanged; prior **Not Approved** decisions remain authoritative for those scopes.

---

## New Gaps Or Limitations

- **DB migration must be applied** on any environment that runs this code against MySQL before relying on writes to **`pending_credit_spend_event_id`**; until then, runtime may error on `UPDATE`/`SELECT` of the new column. Apply: `backend/sql/2026-04-20-live-interview-pending-spend.sql`.
- **Pricing semantics:** **`commitSpend`** uses **`minCost`** for the approved estimated interview feature (conservative session completion fee within the approved cap). Metering by turn count is **not** implemented.
- **No dedicated automated test** for the new router paths in this submission.
- **Sessions created before this change** have `pending_credit_spend_event_id` null — **`complete`** / **`abandon`** behave as before regarding billing (no commit/reject for those legacy rows).

---

## Ready For QC: Yes

Work is complete for the **declared slice**, build and full backend tests pass on the submitting tree, and limits above are stated explicitly. **This is not a claim of Approved For Integration** — QC must issue a fresh §8 verdict if the slice is accepted.

---

## Blockers

- **Operational:** MySQL must expose the new column (**run the provided `ALTER TABLE`** on each deployed database) before production traffic uses the new `liveInterview` billing paths; otherwise deploy is blocked at runtime (schema mismatch), independent of CI passing on the repo checkout.

---

## Verification commands (folder-aware)

**Run In:** `/Users/nikodem/job-app-restore/proj/backend`

**Command:**

```bash
cd /Users/nikodem/job-app-restore/proj/backend && npm run build && npm test
```

---

**READY FOR QC:** Yes
