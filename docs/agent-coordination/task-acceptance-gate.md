# Shared Task Acceptance Gate

This gate applies to all agents and all screens.

A task is accepted only when it is complete across backend, frontend, data, integration and tests. Compilation alone is not enough. A green unit test beside a broken screen is not enough. A polished screen backed by sample data is not enough.

## Definition of Done

A screen or feature is `Done` only when all items below are true:

1. Backend contract exists for every required capability.
2. Backend uses real data, validation, authorization and ownership checks.
3. Backend does not return mock, placeholder or fake production responses.
4. Frontend uses the real backend contract.
5. Frontend does not use placeholder data to hide backend gaps.
6. UI exposes loading, empty, error, permission and success states where relevant.
7. Billable actions show cost before spend and handle failure paths.
8. Private data never depends on client-supplied user identity.
9. Data-loss and ownership edge cases are covered by tests.
10. Build succeeds.
11. Relevant backend tests pass.
12. Relevant frontend tests pass.
13. Smoke path is run for the affected screen.
14. Backend confirms: `Backend contract implemented and tested.`
15. Frontend confirms: `Frontend integrated with real backend contract and tested.`
16. QC confirms: `Done.`

## Automatic rejection rules

QC must reject the task if any of these are present:

- public endpoint controls private user data by client-supplied `userId`,
- ownership checks are missing for private records,
- partial update can accidentally delete unrelated user data,
- setting appears saved but does not persist,
- payment or credit action trusts client identity,
- frontend shows success before backend confirmation,
- placeholder data is presented as final functionality,
- CTA performs no real backend-backed action,
- backend ignores persistence errors silently,
- migration is required but missing,
- tests are skipped without a blocking follow-up,
- PR description says Done without evidence.

## Evidence required in PRs

Each PR must include:

- affected screen or module,
- backend procedures changed,
- frontend components changed,
- data model or migration notes,
- authorization and ownership model,
- tests run with command names,
- smoke path tested,
- screenshots or API response examples for visible or contract-sensitive changes,
- known limitations.

If a known limitation affects required screen behaviour, the PR is not ready.

## Agent communication protocol

Backend agent posts:

`Backend contract implemented and tested.`

Frontend agent posts:

`Frontend integrated with real backend contract and tested.`

QC posts one of:

- `Done.`
- `Rejected: backend contract incomplete.`
- `Rejected: frontend integration incomplete.`
- `Rejected: authorization or ownership failure.`
- `Rejected: data-loss risk.`
- `Rejected: placeholder or fake functionality.`
- `Rejected: tests or smoke evidence missing.`

## Current high-priority blockers

1. Protect security router and remove client `userId` ownership.
2. Protect private applications router flows.
3. Protect billing spend, account and payment flows.
4. Fix profile `updateFull` partial data-loss risk.
5. Fix or remove settings `aiSuggestions` compatibility alias.
6. Secure or remove interview legacy `finishAnswer`.
7. Protect Style Studio user-specific AI generation endpoints.
8. Split public job discovery from protected personalized job intelligence.
9. Add or clarify backend contracts for Community Centre, Daily Warmup, Negotiation and AI Analysis.

## Final rule

No screen is complete until it works as one product surface: database, backend, API contract, frontend, UI behaviour, tests and smoke path together.

Anything less is not a finished task. It is just code with ambition.
