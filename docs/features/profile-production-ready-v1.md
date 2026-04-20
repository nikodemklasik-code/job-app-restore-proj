# Profile — Production Ready Spec v1

## Route
`/profile`

## FE owner
`frontend/src/app/profile/ProfilePage.tsx`

## BE owner
`backend/src/trpc/routers/profile.router.ts + profile source-of-truth services`

## Product goal
Jedno źródło prawdy o użytkowniku sterujące resztą produktu.

## This screen is NOT
Nie martwy formularz bez wpływu na downstream.

## What is still missing for production-ready
- brak twardego completeness score z missing critical fields
- brak rozdzielenia raw profile data i derived signals
- brak gwarancji downstream refresh po zmianie profilu
- brak walidacji salary / thresholds / role targets
- brak wersjonowania lub audytu kluczowych zmian preferencji

## Cross-flows that must be closed
- Profile -> Job Search relevance i filtry startowe
- Profile -> Job Radar fit context
- Profile -> Document Lab tailoring input
- Profile -> Skill Lab signals
- Profile -> Negotiation salary context

## First bounded production slices
- profile completeness + missing critical fields
- derived signals refresh trigger
- salary and threshold validation hardening
- profile-to-search sync

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
