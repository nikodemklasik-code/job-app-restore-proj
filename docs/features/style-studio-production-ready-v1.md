# Style Studio — Production Ready Spec v1

## Route
`/style`

## FE owner
`frontend/src/app/style/StyleStudio.tsx`

## BE owner
`backend/src/trpc/routers/style.router.ts`

## Product goal
Poprawa stylu dokumentów i self-presentation outputs.

## This screen is NOT
Nie generator przypadkowego tonu bez zapisania efektu.

## What is still missing for production-ready
- brak before/after compare
- brak jasnych trybów style mode
- brak save-as-document-version
- brak cost visibility jeśli AI path kosztuje
- brak walidacji wejścia document/text

## Cross-flows that must be closed
- Document Lab -> Style Studio input
- Style Studio -> Document Lab as new version
- Style Studio -> Applications attachment path

## First bounded production slices
- style mode selector + compare view
- save styled output as document version
- cost exposure for AI style path

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
