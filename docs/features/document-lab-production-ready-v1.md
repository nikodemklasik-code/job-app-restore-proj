# Document Lab — Production Ready Spec v1

## Route
`/documents`

## FE owner
`frontend/src/app/documents/DocumentLab.tsx`

## BE owner
`backend/src/trpc/routers/documents.router.ts + cv.router.ts`

## Product goal
Upload, parse, version, tailor and attach documents.

## This screen is NOT
Nie jednorazowy upload bez wersji i bez tekstu.

## What is still missing for production-ready
- brak version lineage dla CV/cover letter variants
- brak parse/extraction state machine
- brak primary CV semantics
- brak attach-to-application flow z selected version
- brak duplicate handling i parse-failure UX

## Cross-flows that must be closed
- Profile -> Document Lab suggestions
- Job Search / Job Radar -> tailor document
- Document Lab -> Applications attach
- Document Lab -> Style Studio
- Document Lab -> AI Analysis and Reports

## First bounded production slices
- version lineage + parentDocumentId
- parse status and extraction UX
- primary CV and selected version attach
- tailor-to-job variant creation

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
