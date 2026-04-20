# QC Verdict — C-F1 Coach follow-up (hermetic tests + Interview/Negotiation §6 review)

**Date:** 2026-04-21  
**Reviewer:** QC (active quality gate)  
**Prior binding Coach slice:** [`qc-verdict-c-f1-practice-hidden-spend-coach-slice-2026-04-20.md`](./qc-verdict-c-f1-practice-hidden-spend-coach-slice-2026-04-20.md) — **anti-widening still in force:** this verdict **does not** extend **Approved For Integration** beyond the already-approved **Coach engine migration** code path; it only updates **test file** status and rules on the **Interview/Negotiation §6** document.

**Intakes reviewed:**

- Code / tests: `backend/src/trpc/routers/__tests__/coach.router.ts`, `backend/src/trpc/routers/coach.router.ts`, `backend/src/services/creditsConfig.ts` (feature key spot-check)  
- §6 document: [`agent-3-c-f1-interview-negotiation-server-billing-2026-04-21.md`](./agent-3-c-f1-interview-negotiation-server-billing-2026-04-21.md)  
**Format:** [`docs/squad/IMPLEMENTATION_EXECUTION_RULES.md`](../squad/IMPLEMENTATION_EXECUTION_RULES.md) §8 · §9 · Hard Rule 7  

---

## QC Scope Reviewed

1. **Coach hermetic test follow-up** — full `coach.router.spec.ts`; isolated `npx vitest run …/coach.router.spec.ts`; consistency of feature key with `coach.router.ts`.  
2. **Interview / Negotiation §6 (justification)** — claims in §Routes vs repository: `interview.router.ts`, `liveInterview.router.ts`, negotiation entrypoints (`server.ts` `/api/negotiation/*` + `negotiationConversation.ts` grep).  
3. **Wider C-F1 / C-F2** — no new implementation in this review; status vs [`qc-decision-practice-modules-settings-community-2026-04-18.md`](./qc-decision-practice-modules-settings-community-2026-04-18.md) and prior gate verdicts.

---

## Previous QC Report Checked: Yes

- [`qc-verdict-c-f1-practice-hidden-spend-coach-slice-2026-04-20.md`](./qc-verdict-c-f1-practice-hidden-spend-coach-slice-2026-04-20.md) — Coach code **AFI**; Coach test **NAFI** (non-hermetic); Required Next Action #2 Interview/Negotiation.  
- [`qc-verdict-current-gate-state-2026-04-18.md`](./qc-verdict-current-gate-state-2026-04-18.md) — wider Practice / Settings context.  
- [`agent-3-c-f1-interview-negotiation-server-billing-2026-04-21.md`](./agent-3-c-f1-interview-negotiation-server-billing-2026-04-21.md) — subject §6.

---

## Previous QC Report Path / Reference

Primary amendment target: [`qc-verdict-c-f1-practice-hidden-spend-coach-slice-2026-04-20.md`](./qc-verdict-c-f1-practice-hidden-spend-coach-slice-2026-04-20.md) (Coach test row **superseded** below).

---

## Previously Reported Issues Resolved

1. **Coach test non-hermeticity / CI gate** — `coach.router.spec.ts` now uses hoisted `vi.mock` for `db/index.js`, `clerk.js`, `creditsBilling.js`, `openai.client.js`; composes `router({ coach: coachRouter })` only — **no** `appRouter`, **no** live MySQL at module load.  
2. **Verification executed:** `cd /Users/nikodem/job-app-restore/proj/backend && npx vitest run src/trpc/routers/__tests__/coach.router.spec.ts` → **1 file, 2 tests, all passed** (no `ECONNREFUSED`).

---

## Previously Reported Issues Still Open

1. **Wider C-F1** (Practice FE boundary, any further billing/product depth not in this delta) — **Not Approved For Integration** until separate §6 + §8.  
2. **C-F2** (Settings / Consent / Community wider) — **Not Approved For Integration** per 2026-04-18 decision.  
3. **Catalogue vs enforcement** for Interview/Negotiation product keys — intake §New Gaps correctly flags risk for UI copy; remains a PO/FE coordination item.

---

## New Issues Found

1. **Material factual error in [`agent-3-c-f1-interview-negotiation-server-billing-2026-04-21.md`](./agent-3-c-f1-interview-negotiation-server-billing-2026-04-21.md) §Routes:**  
   The intake states `liveInterview.router.ts` — live engine; **no** billing imports.  
   **Repository fact:** `backend/src/trpc/routers/liveInterview.router.ts` imports `approveSpend`, `commitSpend`, `rejectSpend` from `creditsBilling.js` and calls **`approveSpend` on `createSession`** (reservation + `pendingCreditSpendEventId` on session), with **`commitSpend` / `rejectSpend`** on session completion / abandon paths (see lines 16–17, 56–115, 137–147 in current file).  
   Therefore the §6 document is **not** an accurate description of server billing reality for **Live Interview**.  
2. **Partial accuracy:** `interview.router.ts` contains **no** `approveSpend` / `commitSpend` / `subscriptions` / raw credit SQL in grep — consistent with intake for **non-live** interview tRPC surface.  
3. **Negotiation (Express):** `server.ts` negotiation routes import streaming helpers only; no `approveSpend` in negotiation handler block from spot read + grep on `negotiationConversation.ts` — **consistent** with intake that negotiation AI paths surveyed do not update subscription credits (separate from Stripe webhook code elsewhere in `server.ts`).

---

## Functional Validation

- **Hermetic Coach test:** Confirmed structure: mocks before router import pattern, minimal `testApp` router, two cases (happy path + `INSUFFICIENT_FUNDS`). Suitable for default `npm test` / CI.  
- **`coach_session` naming:** `coach.router.ts` uses `requireSpendApproval('coach_session')` and `FEATURE_COSTS.coach_session`; spec expects `feature: 'coach_session'` in `approveSpendMock`. No `coach_answer_evaluation` in code paths reviewed.  
- **Intake honesty on approval:** The §6 file explicitly says it does **not** claim Interview/Negotiation **Approved For Integration** for billing — **that** sentence is honest; the **technical** description of Live Interview is not.

---

## Product Validation

- Coach test upgrade improves **trust in the gate** without changing product behaviour.  
- Relying on the 2026-04-21 §6 as sole source of truth for **all** Interview surfaces would **mislead** stakeholders about Live Interview billing — **unacceptable** for QC traceability until corrected.

---

## Risk Validation

- **Low** — Coach CI gate risk from this file: mitigated.  
- **Medium** — Process risk if the incorrect §6 is cited as evidence that “no server billing exists” for Interview overall: Live Interview already enforces engine spend at session create.

---

## QC Verdict

| Item | Verdict |
|------|---------|
| **Coach test file** (`backend/src/trpc/routers/__tests__/coach.router.spec.ts`) | **Approved For Integration** — hermetic, no live MySQL, no full `appRouter`; **suitable for CI gating**. |
| **Coach engine slice** (from prior verdict) | **Unchanged** — **Approved For Integration** only for the previously certified migration; this document **does not** widen that approval. |
| **`coach_session` feature naming** | **Verified consistent** in `coach.router.ts` + hermetic spec mocks/expectations; no stray `coach_answer_evaluation` in those paths. |
| **§6 [`agent-3-c-f1-interview-negotiation-server-billing-2026-04-21.md`](./agent-3-c-f1-interview-negotiation-server-billing-2026-04-21.md)** | **Not Approved For Integration** as a **factually complete** QC record — **must be amended or superseded**: Live Interview billing exists and contradicts the table row. The intake’s explicit disclaimer (“does not claim AFI for billing”) is **good** and should be preserved; the **routing survey text must be corrected** to include `liveInterview` engine usage and distinguish **classic `interview` router** vs **live** router vs **negotiation** Express. |
| **Wider C-F1 / C-F2** | **Not Approved For Integration** — **no change** from prior gate / 2026-04-18 Practice decision. |

---

## Integration Status

- Coach hermetic tests: **Approved For Integration** (CI gate).  
- Coach migration code: **Approved For Integration** (unchanged, prior verdict).  
- Interview/Negotiation §6 (2026-04-21): **Not Approved For Integration** (factual gap on Live Interview — **reject / rework document**).  
- Wider C-F1 / C-F2: **Not Approved For Integration**.

---

## Escalation To Product Owner

- **Live Interview** already charges via engine on **session create** — PO/product should confirm UX copy and whether **non-live** `interview.router` flows should align or remain free at server layer; QC does not decide pricing, only flags **documentation vs code** mismatch.

---

## Required Next Action

- **Agent 3 (C):** Revise [`agent-3-c-f1-interview-negotiation-server-billing-2026-04-21.md`](./agent-3-c-f1-interview-negotiation-server-billing-2026-04-21.md) §Routes to **accurately** describe `liveInterview.router.ts` (`approveSpend` / `commitSpend` / `rejectSpend`) vs `interview.router.ts` vs negotiation Express; re-file or bump date so QC can issue a **narrow** “documentation accepted” §8 if desired.  
- **QC:** Treat Live Interview billing as **in scope** for any future “Interview billing parity” reviews — do not use the uncorrected 2026-04-21 §6 as evidence of absence.

---

**Canonical one-liner:** Coach test — **AFI** (hermetic, CI-ready). Interview/Negotiation §6 (2026-04-21) — **NAFI** until Live Interview row fixed. Wider C-F1/C-F2 — **still NAFI**. Coach slice code approval — **not widened** here.
