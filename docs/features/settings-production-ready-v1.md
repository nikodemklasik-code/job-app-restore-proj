# Settings — Production Ready Spec v1

## Route
`/settings`

## FE owner
`frontend/src/app/settings/*`

## BE owner
`emailSettings/security/jobSources/privacy-related routers`

## Product goal
Miejsce kontroli ustawień z realnym backend effect.

## This screen is NOT
Nie śmietnik toggle’i.

## What is still missing for production-ready
- brak gwarancji backend effect per setting
- brak pełnego URL tab sync and reload parity
- brak cleanup między settings a security
- brak versioned/migratable settings model
- brak server-authoritative state in all tabs

## Cross-flows that must be closed
- Settings -> Job Search sources and notifications
- Settings -> Security
- Settings -> privacy/consent
- Settings -> Assistant/AI preferences if supported

## First bounded production slices
- server-authoritative settings read/write
- URL tab sync hardening
- job sources settings effect parity
- separate security entrypoint

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
