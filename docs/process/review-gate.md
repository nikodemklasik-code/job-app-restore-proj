# Review Process

A screen is complete only when backend, frontend, data, tests and visible UI work together.

## Completion checklist

- Backend API exists for every required screen capability.
- Backend uses real data, validation, authorisation and target business logic.
- Frontend is integrated with backend contracts.
- UI follows shared layout, hierarchy and module standards.
- Unit tests pass.
- Integration tests pass where applicable.
- Smoke checks pass where applicable.
- Build succeeds.
- CI checks are green.
- Frontend confirms: `Integrated and tested`.
- Backend confirms: `Contract implemented and tested`.
- Reviewer confirms: `Done`.

## Workflow

A single completion claim is not enough.

When one layer says `Finished`, the other layer must confirm integration and test results.

If any required item is missing, the screen returns to the responsible developers until completion is confirmed.

No next screen starts until the current screen has confirmation.

## Pull request requirements

Each PR should include affected screen, backend changes, frontend changes, data changes, tests run, smoke check status, screenshots or logs for visible changes and known limitations.

## Branch protection recommendation

`main` should require PR review, passing CI checks and resolved conversations before merge.

Recommended required status check: `quality`.
