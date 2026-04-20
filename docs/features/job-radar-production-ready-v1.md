# Job Radar — Production Ready Spec v1

## Route
`/job-radar`

## FE owner
`frontend/src/app/job-radar/*`

## BE owner
`backend/src/trpc/routers/jobRadar.router.ts + backend/src/modules/job-radar/*`

## Product goal
Intelligence layer on jobs and employers with immutable scan reports.

## This screen is NOT
Nie kolejna tabelka z jobami.

## What is still missing for production-ready
- brak pełnego immutable scan versioning
- brak scan progress orchestration polish
- brak complaint/rescan governance domknięcia
- brak pełnego source transparency w raporcie
- brak gładkiego handoff do applications/documents/assistant

## Cross-flows that must be closed
- Job Search -> Job Radar start scan
- Job Radar -> Applications add to pipeline
- Job Radar -> Document Lab tailor CV
- Job Radar -> Assistant ask follow-up
- Job Radar Admin -> trust governance

## First bounded production slices
- start scan from saved job hardening
- immutable report versioning
- report CTA handoff to applications/documents
- complaint + rescan flow polish

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
