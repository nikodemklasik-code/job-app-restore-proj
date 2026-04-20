# Agent 3 — Task

## Scope
Legacy interview billing parity only.

## Exact work
1. Implement billing-engine parity for legacy interview.router only.
2. approveSpend before effect.
3. commitSpend on success.
4. rejectSpend on failure / abandon path as applicable.
5. Add minimal test coverage or explicit written justification.

## Likely files
- backend/src/trpc/routers/interview.router.ts
- minimal shared spend helper files only if strictly required
- minimal legacy interview tests only

## Required report
docs/qc-reports/agent-3-legacy-interview-billing-ready-for-qc.md

## Not allowed
- no Coach changes
- no Live Interview changes unless compile strictly requires it
- no Negotiation work
- no broader Practice cleanup
