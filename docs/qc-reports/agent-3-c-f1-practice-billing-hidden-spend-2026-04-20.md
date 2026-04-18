# Agent 3 — C-F1 Practice hidden-spend cleanup (partial) — READY FOR QC

**Date:** 2026-04-20 (intake) · **Errata / follow-up:** 2026-04-21 — feature key naming corrected to **`coach_session`** everywhere (QC: [`qc-verdict-c-f1-practice-hidden-spend-coach-slice-2026-04-20.md`](./qc-verdict-c-f1-practice-hidden-spend-coach-slice-2026-04-20.md)).  
**Owner:** Agent 3 (C) — practice modules + settings/community  
**Mandatory first line (§5a / Hard Rule 8):** Owning agent: required work is executed in the repository, not in chat instead of implementation — see [`docs/squad/IMPLEMENTATION_EXECUTION_RULES.md`](../squad/IMPLEMENTATION_EXECUTION_RULES.md) §5a and Hard Rule 8.  
**Execution rules:** [`docs/squad/IMPLEMENTATION_EXECUTION_RULES.md`](../squad/IMPLEMENTATION_EXECUTION_RULES.md) §4 · §6  
**Prior QC carry (A-F1 verdict):** [`qc-verdict-agent-1-foundations-a-f1-a-f2-a-f4-2026-04-18.md`](./qc-verdict-agent-1-foundations-a-f1-a-f2-a-f4-2026-04-18.md) — direct SQL debit in `coach.router.ts` must migrate to the billing engine.

---

## Scope Implemented

### Priority 1 — Practice hidden-spend cleanup (backend)

- **Coach (`coach.evaluateAnswer`):** Removed direct `db.update(subscriptions).set({ credits: … })`. Implementation uses **`coach_session`** (estimated, 5 credits) via **`requireSpendApproval('coach_session')`** in `backend/src/trpc/routers/_shared.ts` + **`settleSpendSuccess` / `settleSpendFailure`** in `backend/src/trpc/routers/coach.router.ts`. **approveSpend** runs in middleware before the procedure body; **commitSpend** after a successful evaluation payload; **rejectSpend** on outer failure before spend finalisation. **Protected** procedure — unauthenticated callers get `UNAUTHORIZED` (no silent skip).
- **Daily Warmup:** Unchanged — paid tiers route through `billing.deductCredits` → `approveSpend` on `warmup_session_30s` / `45s` / `60s` (`billing.router.ts`).
- **Interview / Negotiation (documentation):** Separate §6 intake: [`agent-3-c-f1-interview-negotiation-server-billing-2026-04-21.md`](./agent-3-c-f1-interview-negotiation-server-billing-2026-04-21.md) — splits **legacy** `interview.router`, **`liveInterviewRouter`** (billing **AFI** only per [`qc-verdict-live-interview-billing-slice-2026-04-21.md`](./qc-verdict-live-interview-billing-slice-2026-04-21.md)), and **Negotiation**; does **not** claim AFI for legacy Interview or Negotiation billing.

### Priority 2–4 (boundary FE, Settings/Consent wider, Community)

- **Not implemented** in the Coach-only deltas — see *Previously Reported Issues Still Open*.

---

## Files Changed (canonical list — Coach slice)

- `backend/src/trpc/routers/_shared.ts` — `requireSpendApproval`, `settleSpendSuccess`, `settleSpendFailure`, `billingToTrpc`.
- `backend/src/trpc/trpc.ts` — `TrpcContext.spendReservation`.
- `backend/src/trpc/routers/coach.router.ts` — spend flow via middleware + engine; **feature `coach_session`**.
- `backend/src/services/creditsConfig.ts` — **`coach_session`** catalogue entry (estimated 5–5) used by Coach.
- `backend/src/services/__tests__/creditsBilling.spec.ts` — policy test for **`coach_session`** band.
- `backend/src/trpc/routers/__tests__/coach.router.spec.ts` — **hermetic** router tests (mocked `db` + `creditsBilling`, no `appRouter`, passes with `DATABASE_URL` unset).

---

## Routes / Components / Stores / Persistence Logic Changed

| Area | Change |
|------|--------|
| **tRPC `coach.evaluateAnswer`** | `protectedProcedure` + `requireSpendApproval('coach_session')` → evaluation → `settleSpendSuccess` / failure paths. |
| **`billing.deductCredits`** | Unchanged — Warmup paid tiers. |

---

## Tests Added Or Updated

- `backend/src/services/__tests__/creditsBilling.spec.ts` — policy row for **`coach_session`** (flat 5–5 estimated band).
- `backend/src/trpc/routers/__tests__/coach.router.spec.ts` — hermetic tests (success path + `INSUFFICIENT_FUNDS` before commit).

**Verification:**

```bash
cd /Users/nikodem/job-app-restore/proj/backend && npm run build && npm test
env -u DATABASE_URL npx vitest run src/trpc/routers/__tests__/coach.router.spec.ts
```

**Latest run:** `npm test` — **29 files / 125 tests passed**; coach spec passes with **`DATABASE_URL` unset**.

---

## Existing Reports Checked

| Location | What was scanned |
|----------|------------------|
| `docs/qc-reports/` | A-F1 verdict, repo sweep §2.9, Practice/Settings decision 2026-04-18, **Coach slice verdict 2026-04-20**, `qc-live-status.md` |
| `docs/qc/` | Phase README placeholders |
| `docs/squad/` | `Agent_3_Practice_And_Preferences_Spec.md`, `IMPLEMENTATION_EXECUTION_RULES.md` |

---

## Existing QC Reports Checked

| Report | Outcome |
|--------|---------|
| [`qc-verdict-c-f1-practice-hidden-spend-coach-slice-2026-04-20.md`](./qc-verdict-c-f1-practice-hidden-spend-coach-slice-2026-04-20.md) | Coach code **Approved For Integration**; test file was **NAFI** until hermetic rewrite — addressed in repo follow-up. |
| [`qc-decision-practice-modules-settings-community-2026-04-18.md`](./qc-decision-practice-modules-settings-community-2026-04-18.md) | Wider slice **still Not Approved** — no claim of closure here. |

---

## Previously Reported Issues Resolved

- A-F1 carry: **Coach** direct SQL debit — **closed** (per Coach QC verdict + grep).

---

## Previously Reported Issues Still Open

- C-F1 Interview/Negotiation **billing** when product defines debit boundary — see justification intake 2026-04-21 (not claiming approval).
- C-F1 FE module boundary, C-F2, Community — unchanged.

---

## New Gaps Or Limitations

- Catalogue vs server enforcement for `interview_*` / `negotiation_*` — documented in justification intake.

---

## Ready For QC

**Yes** — for **re-review of hermetic `coach.router.spec.ts`** only (QC previously **NAFI** that file).  
**No** — for widening beyond the **Coach slice** already **Approved For Integration**.

---

## Blockers

**None.**
