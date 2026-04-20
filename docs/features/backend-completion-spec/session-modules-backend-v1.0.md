# Warmup, Coach, Interview, Negotiation — backend cleanup spec

Index: [`README.md`](./README.md) · Monolit §5: [`_imported-full-spec-v1.0.md`](./_imported-full-spec-v1.0.md)

---

## Status

The greatest confusion here may currently be more product-boundary confusion than pure backend absence.

Still, backend logic must be aligned with the new front-end and module separation.

---

## Required backend separation

Create or cleanly separate:
- session types
- pricing rules
- session duration logic
- mode definitions
- analytics events
- output contracts
- usage consumption rules

---

## Module-specific logic

### Daily Warmup

Must support:
- timed short practice
- fixed cost durations
- low-friction session creation
- progress tracking
- no deep interview / coach / negotiation logic

### Coach

Must support:
- topic-based guidance
- depth-based estimated cost
- strategic session outputs
- action plan output
- approval before spend

### Interview

Must support:
- realistic session-based interview flow
- lite / standard / deep modes
- answer review
- session summary
- free monthly interview allowance logic

### Negotiation

Must support:
- reply draft mode
- counter-offer mode
- strategy mode
- simulation mode
- credit costs per mode
- negotiation-specific outputs

---

## QC must validate

- Daily Warmup does not consume Interview logic
- Coach does not behave like interview question flow
- Interview is not reduced to timed warmup behaviour
- Negotiation has its own distinct mode logic
- session types and credit rules are cleanly separated
