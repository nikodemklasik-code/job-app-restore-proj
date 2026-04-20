# Dashboard — dashboard aggregate snapshot — READY FOR QC

> **QC (2026-04-19):** **Rework Required** — [`qc-verdict-agent-1-dashboard-aggregate-snapshot-2026-04-19.md`](./qc-verdict-agent-1-dashboard-aggregate-snapshot-2026-04-19.md). Intake przeszacowuje pokrycie testami (`getSnapshot` nie jest w hermetycznych testach; plik spec testuje tylko mapper).

## Scope delivered
- Protected aggregate query `dashboard.getSnapshot` (no client `userId`); bootstrap path when local user row missing.
- Dashboard UI wired to `api.dashboard.getSnapshot.useQuery(undefined, { enabled: … })`.
- Hermetic vitest for bootstrap branch (`dashboard.router.spec.ts`).

## Files touched
- `backend/src/trpc/routers/dashboard.router.ts`
- `backend/src/trpc/routers/index.ts` (`dashboard`, `legalHub` for FE/router parity)
- `backend/src/trpc/routers/__tests__/dashboard.router.spec.ts`
- `frontend/src/app/dashboard/DashboardPage.tsx`

## Data paths checked
- `trpc.dashboard.getSnapshot` — session-scoped user; billing read path

## Tests run
- unit/integration: `cd /Users/nikodem/job-app-restore/proj/backend && npx vitest run src/trpc/routers/__tests__/dashboard.router.spec.ts`
- route/manual: (optional smoke on `/dashboard` after deploy)
- billing path, if relevant: read-only `getAccountState`; failure = degraded defaults; not invoked on bootstrap path

## Production readiness (this slice)
- closed: authZ on aggregate; structured error-free bootstrap; builds green
- not closed: full happy-path DB integration test (optional)
- out of scope: Legal Hub product scope beyond router registration

## Cross-flows touched
- Dashboard → Profile, Documents, Jobs, Applications, Review, Interview, Billing, Assistant (navigation only)
- result: hrefs from recommendations / recent activity unchanged in contract

## Known limits / blockers
- None for path alignment; `19-SCREENS_FIRST_PRODUCTION_SLICES.tsv` Dashboard row matches `REMAINING-SCREENS_FIRST_PRODUCTION_SLICES.tsv`.

## Claim
- [x] done for this bounded slice
- [x] not full module closure
