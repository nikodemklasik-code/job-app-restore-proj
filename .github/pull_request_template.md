# Completion checklist

## Summary

- Affected screen/module:
- Linked issue/spec:
- Frontend owner:
- Backend owner:
- QC reviewer:
- Backend changes:
- Frontend changes:
- Data model / migrations:

## Integration status

- [ ] Backend confirms: `Contract implemented and tested`.
- [ ] Frontend confirms: `Integrated and tested`.
- [ ] QC confirms: `Done`.

## Required checks

- [ ] `npm run build:frontend` passes.
- [ ] `npm run test:frontend` passes.
- [ ] `npm run build:backend` passes if backend changed.
- [ ] `npm run test:backend` passes if backend changed.
- [ ] `npm run smoke:local` passes or deploy smoke is attached.
- [ ] CI quality gate is green.

## No unfinished work

- [ ] No production mocks.
- [ ] No placeholder content presented as finished UI.
- [ ] No placeholder API responses are used for completed flows.
- [ ] No frontend placeholder data hides missing backend logic.
- [ ] No commented-out code.
- [ ] No temporary debug code.
- [ ] No TODO/FIXME left in changed production files.
- [ ] No screen-specific workaround replaces a shared component or contract.

## Real data and contracts

- [ ] Visible data comes from backend endpoints, persisted state, or documented empty states.
- [ ] API contracts are real, validated and authorised.
- [ ] Error states are handled.
- [ ] Loading, empty and error states are implemented.
- [ ] Missing backend data is listed and blocks Done until resolved.

## Completeness

- [ ] All functions required by the linked repo issue/spec are implemented.
- [ ] Main user flow works end to end.
- [ ] This screen/feature is not described as Done if it is only a seed, spec, or partial pass.

## Visual consistency

- [ ] Layout follows the shared app rhythm.
- [ ] Spacing, buttons, typography and cards are consistent with the rest of the product.
- [ ] Light/dark/neuro-friendly themes are readable.
- [ ] Mobile layout is usable or has an explicit blocking follow-up.

## Commands/results

```text
paste command output or CI links here
```

## Screenshots / evidence

Add screenshots, recordings, logs or API response examples for visible or contract-sensitive changes.

## Known limitations

List any limitations. If a limitation affects the required behaviour of the screen, this PR is not ready for `Done`.

## Cross-role confirmation

Frontend:

```text
I confirm the screen/feature is integrated with real backend data and passes required checks.
```

Backend:

```text
I confirm the endpoint/data contract is available, integrated and tested.
```

QC:

```text
I confirm this is canonical Done. If not, return it to developers.
```
