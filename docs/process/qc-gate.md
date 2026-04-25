# QC Gate Process

## Role

QC is the final quality gate for every screen.

No screen can be marked as `Done` unless it satisfies the product requirements, backend contract, frontend integration, database behaviour, tests and visible UI quality defined in the repository.

QC does not accept verbal completion claims as sufficient proof of completion.

## Rejection rule

If a screen fails any defined requirement, QC must return the screen to the responsible developers.

The team must continue work on that same screen until it is completed canonically.

No developer may move to the next screen without QC authorisation for the current screen.

## Definition of Done

A screen is `Done` only when all of the following are true:

1. Backend API exists for every required screen capability.
2. Backend uses real data, real validation, real authorisation and target business logic.
3. Backend does not return mock, placeholder or fake production responses.
4. Frontend is fully integrated with backend contracts.
5. Frontend does not use placeholder data to hide backend gaps.
6. UI matches the product rhythm, layout hierarchy and module standards.
7. Unit tests pass.
8. Integration tests pass where applicable.
9. Smoke tests pass where applicable.
10. Build succeeds.
11. CI quality gate is green.
12. Frontend confirms: `Integrated and tested`.
13. Backend confirms: `Contract implemented and tested`.
14. QC confirms: `Done`.

## Zero tolerance for provisional work

The following are not allowed in completed work:

- mocks presented as final functionality;
- placeholder API responses;
- temporary frontend fallbacks hiding missing backend logic;
- undocumented workarounds;
- skipped tests without explanation and follow-up issue;
- dead code;
- debug-only code;
- inconsistent UI patterns;
- screen-specific hacks where a shared component or contract is required.

## Communication protocol

A developer may say `Finished` only after their own tests pass.

The other layer must respond with one of the following:

- `Confirmed, integrated and tested`;
- `Rejected, integration failed`;
- `Rejected, missing data or contract support`;
- `Rejected, UI quality or consistency failed`.

A screen cannot be marked `Done` on a one-sided declaration.

## Required GitHub process

Pull requests must include:

- affected screen/module;
- backend changes;
- frontend changes;
- data model or migration changes;
- tests run;
- smoke checks run;
- confirmation that there are no mocks or placeholders;
- screenshots or screen notes for visible UI changes;
- known limitations, if any.

If a limitation affects the required behaviour of the screen, the PR is not complete.

## Branch protection recommendation

The `main` branch should require:

- pull request review before merge;
- at least two approvals where practical;
- one cross-layer approval when backend and frontend are both affected;
- passing CI checks;
- no direct pushes;
- conversation resolution before merge;
- up-to-date branch before merge.

Recommended required status check:

- `quality-gate` from `.github/workflows/quality-gate.yml`.

## QC authority

QC may reject a PR or screen even if code compiles.

Passing build is not enough.

Passing tests is not enough if the implementation violates product requirements.

A screen is only done when it works as a coherent product surface: backend, frontend, data, tests and visible experience together.
