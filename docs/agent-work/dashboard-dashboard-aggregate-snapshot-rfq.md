# Dashboard — dashboard aggregate snapshot — RFQ

## Screen
- Name: Dashboard
- Route: `/dashboard`

## Bounded slice
- Slice title: dashboard aggregate snapshot
- Why now: Single server-backed snapshot for profile completeness, billing, applications pipeline, practice signals, recommendations, and alerts — closes the “no aggregate” gap for the home surface.
- In scope:
  - `dashboard.getSnapshot` protected tRPC query (no client-supplied user id; identity from session).
  - Dashboard page consumes snapshot with loading / empty / error / populated states.
  - Degraded bootstrap payload when local user row is missing (explicit alerts, no silent blank).
- Out of scope:
  - New billing mutations or ledger writes.
  - Full redesign of downstream modules (profile editor, applications CRUD, Job Radar scan).
  - Real-time subscriptions / push.

## FE owner files
- `frontend/src/app/dashboard/DashboardPage.tsx`

## BE owner files
- `backend/src/trpc/routers/dashboard.router.ts`
- `backend/src/trpc/routers/index.ts` (router registration)

## Data contract
- query: `dashboard.getSnapshot` (void input)
- minimal DTO fields: `profile`, `billing`, `applications`, `practice`, `recommendations`, `alerts`, `recentActivity` (shape aligned with UI + route contract docs)
- loading / empty / error / populated states: Clerk loading gate; query error banner; snapshot always returns structured object (bootstrap path for missing user)

## Production readiness (this slice)
- AuthZ: only authenticated caller; no cross-user id from client.
- Billing read via `getAccountState(clerkId)` only; failures degrade to defaults without throwing.
- No new secrets; MySQL reads only on existing tables.

## Cross-flows touched
- Dashboard → Profile / Documents / Jobs / Applications / Interview / Billing / Assistant (href targets in recommendations and activity only)

## Expected report path
- `docs/qc-reports/dashboard-dashboard-aggregate-snapshot-ready-for-qc.md`

## QC acceptance checks
- [ ] `npm run build` passes in `backend/` and `frontend/`
- [ ] Hermetic or smoke proof for `getSnapshot` (bootstrap or happy path)
- [ ] No `userId` in client input for aggregate query

## Rollback note
- Revert `dashboard.router.ts`, remove `dashboard` from `appRouter`, restore previous `DashboardPage.tsx` if slice fails QC.
