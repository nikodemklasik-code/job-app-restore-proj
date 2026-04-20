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

## QC Verdict (operational)

**Approved For Integration** — same scope and conditions as **QC Decision** above.

## Required Next Action

- `Owning agent: required work is executed in the repository, not in chat instead of implementation — see docs/squad/IMPLEMENTATION_EXECUTION_RULES.md §5a and Hard Rule 8.`

1. **PO:** track gaps listed under **Product Risks / Known Gaps** in this packet (product coherence, not a request to re-litigate the verdict in chat).  
2. **Agents:** follow-up engineering for stricter isolation or Case Practice backend lifecycle — **in repository** with fresh **§6** delivery reports where scope changes.  
3. **QC:** any re-open of this slice uses previous-report check + delta per [`../squad/IMPLEMENTATION_EXECUTION_RULES.md`](../squad/IMPLEMENTATION_EXECUTION_RULES.md).
