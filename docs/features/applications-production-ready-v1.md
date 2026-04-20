# Applications — Production Ready Spec v1

## Route
`/applications`

## FE owner
`frontend/src/app/applications/ApplicationsPage.tsx + ApplicationsPipeline.tsx`

## BE owner
`backend/src/trpc/routers/applications.router.ts`

## Product goal
Trwały pipeline aplikacji z historią etapów.

## This screen is NOT
Nie luźna lista bez audytu.

## What is still missing for production-ready
- brak pełnego audit trail dla stage transitions
- brak linked context: job, radar report, document version, notes
- brak transition guardów dla terminal stages
- brak follow-up due logic
- brak stabilnego manual-add flow

## Cross-flows that must be closed
- Job Search -> Applications create
- Job Radar -> Applications add from report
- Applications -> Interview przy stage interview
- Applications -> Negotiation przy offer stage
- Applications -> Document Lab dla attach selected version

## First bounded production slices
- durable stage transitions + audit trail
- linked entities drawer
- manual application create
- follow-up due markers

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
