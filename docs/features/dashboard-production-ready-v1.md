# Dashboard — Production Ready Spec v1

## Route
`/dashboard`

## FE owner
`frontend/src/app/dashboard/DashboardPage.tsx`

## BE owner
`dashboard aggregate over profile/billing/applications/jobs/reports/assistant`

## Product goal
Jedno centrum operacyjne z jasnym next step, bez zlepku 15 spinnerów.

## This screen is NOT
Nie landing marketingowy. Nie śmietnik wszystkich kart.

## What is still missing for production-ready
- brak jednego agregatu dashboard snapshot
- brak priorytetyzacji next-best-action
- brak partial-failure handling dla sekcji
- brak realnych alertów low balance / profile incomplete / follow-up overdue
- brak odświeżenia dashboardu po akcjach downstream

## Cross-flows that must be closed
- Dashboard -> Profile przy niskim completeness
- Dashboard -> Job Search gdy brak discovery activity
- Dashboard -> Daily Warmup / Interview dla practice next step
- Dashboard -> Billing dla low balance
- Dashboard -> Reports dla świeżych wyników

## First bounded production slices
- dashboard aggregate snapshot
- next-best-action ranking
- alert strip + low balance / incomplete profile
- recent activity + reports summary

## Minimum QC checks
- route renders without mock-only dependency
- loading / empty / error / populated states exist
- main user action hits real backend path
- refresh preserves state
- cross-flow declared in this slice works end-to-end
- if paid path exists, billing approval/commit/reject or fixed-cost exposure is correct

## Definition of Done
- screen has real data path
- state is durable
- declared next-step CTA works
- no dead toggles / dead buttons
- slice report explicitly states done / not done / out of scope
