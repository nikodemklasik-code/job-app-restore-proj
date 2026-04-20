# QC Re-evaluation — Hermetic Coach test, Interview/Negotiation §6 intake, practice boundaries

**Date:** 2026-04-22  
**Reviewer:** QC  
**Rules:** [`docs/squad/IMPLEMENTATION_EXECUTION_RULES.md`](../squad/IMPLEMENTATION_EXECUTION_RULES.md) §5a · §6 · §8 · Hard Rule 7  

**Binding:** This document **re-evaluates only** (1) the **hermetic Coach test** follow-up, (2) the **Interview / Negotiation §6 intake** [`agent-3-c-f1-interview-negotiation-server-billing-2026-04-21.md`](./agent-3-c-f1-interview-negotiation-server-billing-2026-04-21.md), and (3) **unchanged** status for **wider C-F1 / C-F2 / Practice–Settings–Community**. It **does not** broaden **Approved For Integration** beyond the **already approved Coach engine migration slice** (see [`qc-verdict-c-f1-practice-hidden-spend-coach-slice-2026-04-20.md`](./qc-verdict-c-f1-practice-hidden-spend-coach-slice-2026-04-20.md) + amendment). It **does not** treat the **2026-04-18** full Practice / Settings / Community submission as approved.

---

## QC Scope Reviewed

- `backend/src/trpc/routers/__tests__/coach.router.spec.ts` — hermetic pattern (hoisted mocks, `router({ coach: coachRouter })`, no `appRouter`).  
- [`agent-3-c-f1-interview-negotiation-server-billing-2026-04-21.md`](./agent-3-c-f1-interview-negotiation-server-billing-2026-04-21.md) — full §6 text vs repo.  
- `backend/src/trpc/routers/liveInterview.router.ts` — spot: `approveSpend` import and `createSession` usage (billing reality for Live Interview).  
- `backend/src/trpc/routers/interview.router.ts` — grep-level confirmation unchanged re billing (no `approveSpend` in file).  
- [`qc-decision-practice-modules-settings-community-2026-04-18.md`](./qc-decision-practice-modules-settings-community-2026-04-18.md) — authoritative **Not Approved** for wider slice.  
- Prior QC on this thread: [`qc-verdict-c-f1-coach-follow-up-2026-04-21.md`](./qc-verdict-c-f1-coach-follow-up-2026-04-21.md), [`qc-verdict-live-interview-billing-slice-2026-04-21.md`](./qc-verdict-live-interview-billing-slice-2026-04-21.md) (Live Interview **separate** §6 / §8 — **not** merged into this intake).

---

## Explicit status (required outputs)

| Item | Integration status | Notes |
|------|--------------------|--------|
| **Coach test file** (`coach.router.spec.ts`) | **Approved For Integration** | Hermetic: mocks `db`, `creditsBilling`, `openai`; no `appRouter`; no MySQL at collect. **Run In:** `/Users/nikodem/job-app-restore/proj/backend` — **Command:** `npx vitest run src/trpc/routers/__tests__/coach.router.spec.ts` — **2/2 passed** (2026-04-22). |
| **Coach engine migration slice** (prior verdict) | **Unchanged — Approved For Integration** (narrow only) | **Not extended** by this re-evaluation; still excludes wider C-F1 / Practice. |
| **Interview / Negotiation §6 intake** [`agent-3-c-f1-interview-negotiation-server-billing-2026-04-21.md`](./agent-3-c-f1-interview-negotiation-server-billing-2026-04-21.md) | **Not Approved For Integration** (as a **factually reliable** §6) | **Material errors remain:** §Routes still states `liveInterview.router.ts` — “**no** billing imports” — **false** (`approveSpend` / `commitSpend` / `rejectSpend` are imported and used; e.g. `approveSpend` on `createSession`). §Scope still claims “**Interview** … practice flows **do not debit** on the server today” — **overbroad** while **Live Interview** debits via engine per [`qc-verdict-live-interview-billing-slice-2026-04-21.md`](./qc-verdict-live-interview-billing-slice-2026-04-21.md). **Accurate elements:** `interview.router.ts` has no `approveSpend` in grep; intake correctly **does not** self-claim AFI for billing; Negotiation Express stack still plausibly without subscription credit mutations in surveyed paths — **does not rescue** the false Live Interview / headline Interview claim. |
| **Wider C-F1 / C-F2 / Practice–Settings–Community** | **Not Approved For Integration — unchanged** | [`qc-decision-practice-modules-settings-community-2026-04-18.md`](./qc-decision-practice-modules-settings-community-2026-04-18.md) remains the binding **Not Approved** decision for that **full** submission scope until a new §6 + §8 closes it. This re-evaluation **does not** narrow or overturn that decision. |

---

## QC Verdict (summary)

1. **Coach test follow-up:** **Approved For Integration** — suitable CI gate; aligns with prior follow-up verdict; **no widening** of Coach product scope.  
2. **Interview / Negotiation justification §6:** **Not Approved For Integration** as QC-trustworthy documentation — **amend or replace** before any “accepted justification” can be cited; distinguish **classic `interview.router`**, **`liveInterviewRouter` (engine billing)**, and **Negotiation**.  
3. **Wider Practice / Settings / Community (C-F1/C-F2 umbrella):** **Not Approved For Integration** — **explicitly unchanged**; do not infer approval from Coach or Live Interview slices.

---

## Required Next Action

- **Agent 3:** Rewrite [`agent-3-c-f1-interview-negotiation-server-billing-2026-04-21.md`](./agent-3-c-f1-interview-negotiation-server-billing-2026-04-21.md) §Scope and §Routes to match repo (Live Interview = **separate** billing slice already §8-approved elsewhere); then re-submit for QC if a **documentation-only** acceptance is still desired.  
- **PO / team:** Do **not** treat the 2026-04-18 Practice/Settings/Community package as integrated — unchanged **NAFI**.  
- **QC:** Next delta on C-F1/C-F2 — new §6 + §8 per Hard Rule 7.
