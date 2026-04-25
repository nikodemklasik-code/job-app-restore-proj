# Completion checklist

## Scope

- Screen / feature:
- Linked issue/spec:
- Frontend owner:
- Backend owner:
- Reviewer:
- Backend changes:
- Frontend changes:
- Data changes:

## Required checks

- [ ] `npm run build:frontend` passes.
- [ ] `npm run test:frontend` passes.
- [ ] `npm run build:backend` passes if backend changed.
- [ ] `npm run test:backend` passes if backend changed.
- [ ] `npm run smoke:local` passes or deploy smoke is attached.
- [ ] CI checks are green.

## Completion quality

- [ ] Visible data comes from backend endpoints, persisted state, or documented empty states.
- [ ] Frontend is integrated with backend contracts.
- [ ] Loading, empty and error states are implemented.
- [ ] Missing backend data is listed and blocks Done until resolved.
- [ ] All functions required by the linked repo issue/spec are implemented.
- [ ] Main user flow works end to end.
- [ ] This screen/feature is not described as Done if it is only a seed, spec, or partial pass.

## Code quality

- [ ] No production mocks.
- [ ] No placeholder content presented as finished UI.
- [ ] No commented-out code.
- [ ] No temporary debug code.
- [ ] No TODO/FIXME left in changed production files.

## Visual consistency

- [ ] Layout follows the shared app rhythm.
- [ ] Spacing, buttons, typography and cards are consistent with the rest of the product.
- [ ] Light/dark/neuro-friendly themes are readable.
- [ ] Mobile layout is usable or has an explicit blocking follow-up.

## Evidence

Add screenshots, recordings, logs or API examples for visible or contract-sensitive changes.

## Cross-role confirmation

Frontend:

```text
I confirm the screen/feature is integrated with real backend data and passes required checks.
```

Backend:

```text
I confirm the endpoint/data contract is available, integrated and tested.
```

Reviewer:

```text
I confirm this is canonical Done. If not, return it to developers.
```
