# QC To PO — Assistant + Case Practice Integration Slice (2026-04-16)

## Scope Covered By This Packet

This decision covers the integration slice described across:

- `docs/qc-reports/agent-a-report.md`
- `docs/qc-reports/agent-b-report.md`
- `docs/qc-reports/agent-c-report.md`

Primary product intent: structured Assistant metadata end-to-end, Case Practice shell/navigation, and sensitive-case safety visibility consistent with the agents’ stated contracts.

## Evidence Executed By QC (Technical)

- Backend tests + TypeScript build:
  - `cd /Users/nikodem/job-app-restore/proj/backend && npm test && npm run build`
  - Result: all tests passed; `tsc` succeeded.
- Frontend TypeScript check + production build:
  - `cd /Users/nikodem/job-app-restore/proj/frontend && npm run build`
  - Result: succeeded.

## Product Risks / Known Gaps (Non-blocking For Integration, But PO Should Track)

- Case Practice remains a frontend shell until a deterministic scenario lifecycle backend exists (called out in Agent A report).
- Assistant history metadata reconstruction for legacy rows may be conservative/inferred (called out in Agent C report).
- Sensitive-case copy consistency across warning vs block may still need a focused UX wording pass (called out in Agent C report).

## QC Decision

Status: **Approved For Integration** for the Assistant + Case Practice integration slice described in the three agent reports, conditioned on PO awareness of the tracked gaps above.

Notes:

- This is not a blanket sign-off for unrelated roadmap items outside the agents’ stated delivery scope.
- If PO wants stricter policy isolation for safety note injection, treat that as a follow-up engineering task (not a regression blocker for this slice).
