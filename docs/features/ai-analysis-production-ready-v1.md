# AI Analysis — Production Ready Spec v1

## Route
`/analysis`

## FE owner
`frontend/src/app/analysis/AiAnalysisPage.tsx`

## BE owner
`structured analysis services on central AI layer`

## Product goal
Głębsza analiza dokumentów, answers, fit and rewrite suggestions.

## This screen is NOT
Nie większy chat box.

## What is still missing for production-ready
- brak jawnych input modes document/job/profile/answer
- brak structured result schema
- brak evidence vs inference separation
- brak deep mode billing approval
- brak save/export to reports

## Cross-flows that must be closed
- Document Lab -> AI Analysis
- Profile/Job Search -> fit analysis
- AI Analysis -> Document rewrite suggestions
- AI Analysis -> Reports

## First bounded production slices
- input mode selector + schema
- structured strengths/gaps output
- deep mode cost approval
- save to reports

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
