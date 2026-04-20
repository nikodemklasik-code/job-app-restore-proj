# QC Decision — Practice surfaces + Settings / Community / Consent + Job Radar typing

**Date:** 2026-04-18  
**Subject:** Submission covering Daily Warmup, Coach, Interview, Negotiation, Settings, Consent, Community Centre, and Job Radar list typing.

## Decision

**Not Approved For Integration**

## QC Verdict (operational)

**Not Approved For Integration** — same as **Decision** above.

## Rationale (concise)

- Product scope for the listed modules was **not** completed end-to-end (navigation, copy, and partial typing only; no new persistence or APIs for consent/community backend).
- **No automated tests** were added for this submission.
- Job Radar change is a **contract / null-safety** adjustment only; it does not close broader module DoD.

## What was acceptable to merge as engineering (informational)

- Builds: `cd /Users/nikodem/job-app-restore/proj/backend && npm run build` and `cd /Users/nikodem/job-app-restore/proj/frontend && npm run build` were green at submission time.
- Settings **Community Centre** entry path (`/settings/community` → `?tab=privacy`) and shell title behaviour are coherent for navigation smoke.

## Required Next Action

- `Owning agent: required work is executed in the repository, not in chat instead of implementation — see docs/squad/IMPLEMENTATION_EXECUTION_RULES.md §5a and Hard Rule 8.`

1. Explicit test coverage for changed behaviour (at minimum: settings tab sync from URL; billing warmup debit rules if touched in same batch).  
2. Clear split of **Community** vs **Consent** product ownership in UI (if both remain one tab, document in completion report — not in this decision file).  
3. Completion report per `docs/policies/execution-reporting-standard.md` with honest **scope / gaps** and only then **`READY FOR QC`**.

## Status line for dashboards

`Practice modules + Settings/Community slice (2026-04-18)` → **Not Approved For Integration** until items above are met.
