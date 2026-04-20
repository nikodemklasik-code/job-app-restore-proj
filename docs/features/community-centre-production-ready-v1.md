# Community Centre — Production Ready Spec v1

## Route
`/community`

## FE owner
`dedicated Community Centre page required`

## BE owner
`referral/patron/visibility/credit-entry backend slice required`

## Product goal
Dodatkowa warstwa społecznościowa i referral/credits.

## This screen is NOT
Nie zakładka-widmo w Settings.

## What is still missing for production-ready
- brak dedykowanej route i page component
- brak trwałej backendowej akcji
- brak bounded MVP
- brak rozdzielenia od settings/privacy
- brak referral or credits entry end-to-end

## Cross-flows that must be closed
- Community -> Billing / buy credits
- Community -> discoverability / visibility preferences
- Community -> referral credits

## First bounded production slices
- community route + placeholder shell
- referral code generate and persist
- credits entry CTA
- visibility settings handoff

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
