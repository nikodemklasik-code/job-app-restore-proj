# Applications Review — Production Ready Spec v1

## Route
`/applications/review`

## FE owner
`frontend/src/app/review/ReviewQueue.tsx or dedicated ApplicationsReview surface`

## BE owner
`review router + applications timeline sources`

## Product goal
Pomoc po wysłaniu aplikacji: wait, follow up, archive, mark interview.

## This screen is NOT
Nie osobna wyspa bez wpływu na pipeline.

## What is still missing for production-ready
- brak queue logic based on sentAt + silence days
- brak recommendation engine wait/follow-up/archive
- brak listing status reconciliation
- brak direct actions updating application timeline
- brak widocznych powodów rekomendacji

## Cross-flows that must be closed
- Applications -> Applications Review intake
- Applications Review -> Applications stage update
- Applications Review -> Assistant follow-up phrasing
- Applications Review -> Reports optional history

## First bounded production slices
- review queue based on silence days
- recommended action with reasons
- follow-up action persistence
- listing-status awareness

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
