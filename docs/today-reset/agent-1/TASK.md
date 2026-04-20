# Agent 1 — Task

## Scope
Backend runtime hardening only.

## Exact work
1. Fix reverse-proxy trust handling in backend runtime.
2. Add the smallest safe guard for the MySQL closed-state path seen in logs.
3. Touch only the minimal runtime files needed.
4. Add the smallest possible test or explicit written justification.

## Likely files
- backend/src/server.ts
- minimal runtime / retention files only
- minimal related tests only

## Required report
docs/qc-reports/agent-1-runtime-hardening-ready-for-qc.md

## Not allowed
- no billing redesign
- no profile redesign
- no frontend work
- no unrelated cleanup
