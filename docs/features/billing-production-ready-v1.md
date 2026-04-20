# Billing — Production Ready Spec v1

## Route
`/billing`

## FE owner
`frontend/src/app/billing/BillingPage.tsx`

## BE owner
`backend/src/trpc/routers/billing.router.ts + billing engine`

## Product goal
Transparent credits-first billing screen.

## This screen is NOT
Nie saldo bez historii i pending spends.

## What is still missing for production-ready
- brak pełnej pending-spend visibility
- brak ledger parity checks across modules
- brak clear fixed vs estimated cost explanation
- brak anomaly surfacing for failed commit/reject
- brak module-level examples and trust UX

## Cross-flows that must be closed
- Billing <-> Interview
- Billing <-> Coach
- Billing <-> Daily Warmup
- Billing <-> Negotiation
- Dashboard -> Billing alerts

## First bounded production slices
- ledger parity + pending spend visibility
- fixed vs estimated policy card
- failed commit/reject anomaly surfacing
- module usage trust history

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
