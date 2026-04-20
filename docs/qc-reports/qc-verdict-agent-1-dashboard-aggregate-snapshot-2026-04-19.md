# QC verdict — Agent 1 — Dashboard aggregate snapshot (`A1_T3`)

**Date:** 2026-04-19  
**Intake:** [`dashboard-dashboard-aggregate-snapshot-ready-for-qc.md`](./dashboard-dashboard-aggregate-snapshot-ready-for-qc.md)  
**Status file:** `docs/status/agent-1.status` (`READY_FOR_QC`, `A1_T3`)

---

## QC Scope Reviewed

- Delivery report (scope, files, tests, claims).  
- Code: `backend/src/trpc/routers/dashboard.router.ts` (`getSnapshot`), `dashboard-snapshot.mapper.ts`, `backend/src/trpc/routers/index.ts`, `frontend/src/app/dashboard/DashboardPage.tsx`, `frontend/src/components/dashboard/DashboardSnapshot.tsx` (consumer).  
- Tests: `backend/src/trpc/routers/__tests__/dashboard.router.spec.ts`.

---

## Previous QC Report Checked: **Yes**

## Previous QC Report Path / Reference

- Tranche 1 runtime / follow-ups — not the same slice; no prior verdict on **this** dashboard intake.  
- [`PO_PRODUCTION_VERDICT_AND_EXECUTION_ORDER-v1.md`](../squad/PO_PRODUCTION_VERDICT_AND_EXECUTION_ORDER-v1.md) / gap docs — context only; **no** widening of approval beyond this intake.

---

## Report vs code (honesty)

| Delivery claim | Evidence |
|----------------|----------|
| `dashboard.getSnapshot` protected, session-scoped | **Confirmed** — `protectedProcedure`, uses `ctx.user.id`, no client `userId`. |
| Dashboard UI → `api.dashboard.getSnapshot.useQuery` | **Confirmed** in `DashboardPage.tsx`. |
| “Hermetic vitest for **bootstrap branch** (`dashboard.router.spec.ts`)" | **Not accurate.** The spec file only tests **`mapApplicationStatusToDashboard`** (mapper). It does **not** call `dashboard.getSnapshot`, does **not** mock `db` for aggregate query, does **not** assert bootstrap / empty / billing-degraded branches. |

---

## Bounded scope vs touched files

- Core dashboard + router registration: **aligned** with “aggregate snapshot” slice.  
- `index.ts` also wires **`legalHub`** — slightly **wider** than dashboard-only wording; acceptable only if PO explicitly wanted router parity; delivery mentions it — **OK if intentional**, still not a reason to approve on misleading tests.

---

## Tests declared vs actually run

**QC re-ran:**

```bash
cd /Users/nikodem/job-app-restore/proj/backend && npx vitest run src/trpc/routers/__tests__/dashboard.router.spec.ts
```

**Result:** **1 file, 10 tests, PASS** — all are **mapper** table-driven cases; **zero** coverage of `getSnapshot` implementation.

---

## New issues found

1. **Material mismatch:** intake overstates automated coverage for the **router** path.  
2. **Residual product risk (informational):** `getSnapshot` throws `NOT_FOUND` if `users` row missing — may be correct security-wise but is not the “soft empty snapshot” some products use; not blocking if PO accepts.

---

## QC Verdict

**Rework Required**

---

## Integration status

**Not Approved For Integration** until rework closes — primarily **test evidence or report correction** for `getSnapshot` (see below). **Do not** treat mapper-only green tests as proof of aggregate snapshot correctness.

---

## Required next action (named, for Agent 1)

**Pick one (or both):**

1. **Tests:** Add hermetic Vitest for `dashboard.getSnapshot` with **mocked `db`** (and optional `getAccountState` path): at least happy path shape + one error/degraded path you claim in the report.  
2. **Report:** Rewrite the “Tests” / “Hermetic” / “bootstrap” language to **exactly** match what `dashboard.router.spec.ts` covers today (mapper only), and add a separate honest line: “`getSnapshot` not covered by automated tests yet — manual / follow-up intake”.

After resubmission: new QC pass with previous-report = this document.
