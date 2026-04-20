# QC — Agents 1 / 2 / 3 bounded slices (revalidation + status sync)

**Date:** 2026-04-19  
**Sources reviewed:** `docs/qc-reports/` (active intakes + prior verdicts), `docs/qc/` (index + certification spec), `docs/squad/TODAY_EXECUTION_BOARD.md`, `docs/status/*.status`.

---

## QC Scope Reviewed

| Agent | Active scope (board + delivery) | Intake path |
|-------|----------------------------------|-------------|
| **Agent 1** | Backend runtime hardening only | [`agent-1-runtime-hardening-ready-for-qc.md`](./agent-1-runtime-hardening-ready-for-qc.md) |
| **Agent 2** | Job Radar bounded REST parity only | [`agent-2-job-radar-bounded-parity-ready-for-qc.md`](./agent-2-job-radar-bounded-parity-ready-for-qc.md) |
| **Agent 3** | Legacy `interview.router` billing parity only | [`agent-3-legacy-interview-billing-ready-for-qc.md`](./agent-3-legacy-interview-billing-ready-for-qc.md) |

**Code / tests checked this pass:** Report file lists vs repo; `job-radar.express.router.ts` rework narrative (FORBIDDEN → 404 + `SCAN_NOT_FOUND` / `REPORT_NOT_FOUND` on GET scan/report); independent Vitest runs per declared commands; `npx tsc --noEmit` error sampling for merge-gate honesty.

---

## Previous QC Report Checked: **Yes**

## Previous QC Report Path / Reference

- [`qc-verdict-three-bounded-slices-runtime-jobradar-legacy-interview-2026-04-19.md`](./qc-verdict-three-bounded-slices-runtime-jobradar-legacy-interview-2026-04-19.md) — first full three-intake pass (AFI all three).  
- [`qc-verdict-live-interview-billing-slice-2026-04-21.md`](./qc-verdict-live-interview-billing-slice-2026-04-21.md) — Live Interview only; used as semantic baseline for Agent 3 mode→feature + `minCost` commit.  
- Agent 2 delivery now includes **resubmission / rework** note (GET scan/report error surface vs OpenAPI) — checked against current router code.

---

## Previously Reported Issues Resolved

- **Agent 2 (rework in delivery doc):** Cross-user `FORBIDDEN` from handlers for GET scan/report is mapped to **404** + `SCAN_NOT_FOUND` / `REPORT_NOT_FOUND` in `job-radar.express.router.ts` (lines ~147–149, ~171–173) — matches the resubmission description.

---

## Previously Reported Issues Still Open

- **Branch merge gate:** `cd …/backend && npm run build` / `tsc` still fails on **`liveInterview.router.ts`** and **`profile.router.ts`** (schema / imports / column drift) — **outside** the three agents’ declared touched-file lists; unchanged honest blocker from prior verdicts.  
- **Agent 3 carry-forward (not blocking AFI for this intake):** `finishAnswer` public path unchanged by design; `downloadCredential` join bug (`users.clerkId` vs internal `ctx.user.id`) remains **pre-billing-diff** in the same file — backlog, not part of billing parity slice.

---

## New Issues Found

1. **Agent 1 test count drift (documentation only):** Delivery report states **7** tests for the two runtime spec files; current repo run: **8** passed (extra case in `express-trust-proxy.spec.ts`: non-numeric `TRUST_PROXY` → disabled). **Code is correct;** report undercounts — optional doc refresh, **not** a code rework trigger.  
2. **Agent 3 test file:** Hermetic suite now reports **6** tests (QC run); delivery text emphasises assertions rather than exact count — **aligned** with behaviour under test.

---

## Functional Validation

| Agent | Declared test command | QC re-run result |
|-------|----------------------|------------------|
| 1 | `npx vitest run src/runtime/__tests__/express-trust-proxy.spec.ts src/runtime/__tests__/mysql-closed-state-guard.spec.ts` | **2 files, 8 tests, all passed** |
| 2 | `npx vitest run src/modules/job-radar` | **18 files, 50 tests, all passed** (matches resubmission note) |
| 3 | `npx vitest run src/trpc/routers/__tests__/interview.router.spec.ts` | **1 file, 6 tests, all passed** |

**`tsc` sample (honesty):** First errors remain `liveInterview.router.ts` (`pendingCreditSpendEventId` vs schema type) and `profile.router.ts` (missing exports/modules) — **no** errors pointing at `backend/src/runtime/*`, Job Radar REST slice files, or `interview.router.ts` / its spec.

---

## Product Validation

- **Agent 1:** Trust proxy + MySQL guard behaviour matches production expectations (rate limit / `req.ip` behind proxy; supervised restart on fatal DB disconnect).  
- **Agent 2:** Literal `/job-radar/*` REST surface exists; auth middleware consistent with “Clerk → app user”; GET not-found semantics for foreign resources do not leak via spurious 403/OpenAPI mismatch after rework.  
- **Agent 3:** Legacy recorded interview path charges via approve→commit/reject on start/failure/complete; idempotent `completeSession` avoids double commit.

---

## Risk Validation

- **Residual:** merge blocked until unrelated routers compile — **process risk**, not undetected slice defect.  
- **Residual:** legacy `finishAnswer` / long-lived `approved` without `completeSession` — **documented** in Agent 3 intake.  
- **Low:** Agent 1 delivery doc test total slightly stale.

---

## QC Verdict

| Agent | Verdict |
|-------|---------|
| **Agent 1** | **Approved For Integration** |
| **Agent 2** | **Approved For Integration** |
| **Agent 3** | **Approved For Integration** |

---

## Integration Status

**Approved For Integration** for each **bounded slice** as defined in its delivery report. **Repository-wide** integration / merge to a protected branch remains **dependent** on clearing existing **`backend` TypeScript build** failures in **Live Interview** and **Profile** routers (not owned by these three intakes).

---

## Required Next Action

1. **Product Owner / integration owner:** Drive **`cd /Users/nikodem/job-app-restore/proj/backend && npm run build`** to green (fix `liveInterview.router.ts` vs Drizzle schema for `pendingCreditSpendEventId`; restore `profile.router.ts` imports / shared types / missing services per branch plan).  
2. **Agent 1 (optional hygiene):** Update delivery report test count **7 → 8** if the intake is resubmitted for archival accuracy.  
3. **Agents 1–3:** Treat bounded work as **QC-complete**; take new tasks only from PO/board after merge gate plan is explicit.
