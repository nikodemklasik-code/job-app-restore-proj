# AI Assistant — Production Ready Spec v1

## Route
`/assistant`

## FE owner
`frontend/src/app/assistant/AssistantPage.tsx`

## BE owner
`backend/src/trpc/routers/assistant.router.ts + central AI layer`

## Product goal
Szybka pomoc i routing do modułów.

## This screen is NOT
Nie ekspert od wszystkiego i nie zamiennik Analysis/Coach.

## What is still missing for production-ready
- brak spójnego context resolvera z profile/jobs/applications/reports
- brak action chips uruchamiających moduły
- brak rozróżnienia między answer-only a product-action answer
- brak trwałości sesji lub thread metadata
- brak jasnego cost/meta exposure tam gdzie trzeba

## Cross-flows that must be closed
- Assistant <-> Profile
- Assistant <-> Job Search
- Assistant <-> Document Lab
- Assistant <-> Interview / Coach
- Assistant -> Billing preflight when needed

## First bounded production slices
- context bundle resolver
- action chips to real routes
- thread persistence + clear-session
- assistant meta and cost exposure

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
