# Ownership and Change Policy

## Purpose

Changes to the AI layer should remain controlled and domain-aware.

## Rules

- each domain library owns one core responsibility,
- cross-cutting rule changes should be reflected in documentation first,
- changes to `prompt-core` require extra caution,
- changes to `report-engine` must be checked against both UI and PDF needs,
- changes to `persona-kit` must not violate shared rules,
- changes to `session-engine` must not introduce domain-specific prompt logic.

## Review checklist

Before merging, confirm:
- the change belongs to the domain where it is implemented,
- Interview and Coach boundaries still hold,
- no logic is duplicated from another domain,
- feedback language policy is preserved,
- compliance rules are preserved.
