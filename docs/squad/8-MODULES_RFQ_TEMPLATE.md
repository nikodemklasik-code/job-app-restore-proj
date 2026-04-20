# RFQ Template — 8 Modules Production Slice

## Module
`<LEGAL_HUB | SKILL_LAB | CASE_PRACTICE | INTERVIEW | COACH | DAILY_WARMUP | NEGOTIATION | JOB_SEARCH>`

## Slice title
`<bounded slice name>`

## Route
`<route>`

## FE owner files
- `<path>`
- `<path>`

## BE owner files
- `<path>`
- `<path>`

## Production readiness (this slice)
- `<what exactly becomes production-closed in this slice>`
- `<what state survives refresh>`
- `<what edge-case is handled>`
- `<what billing/report/audit closure exists if applicable>`

## Cross-flows touched
- `<source screen> -> <target screen>`
- `<source screen> -> <target screen>`

## In scope
- `<bounded item>`
- `<bounded item>`

## Out of scope
- `<explicitly excluded item>`
- `<explicitly excluded item>`

## Data / DTO contract
- `<input dto>`
- `<output dto>`

## Report path
`docs/qc-reports/<slice-name>-ready-for-qc.md`

## QC acceptance checks
- route renders
- loading/empty/error/populated handled
- declared action hits backend
- declared cross-flow works
- state survives refresh
- no anti-widening
