# 19 Screens — Chain Entry Rules (Required)

A task may enter `docs/squad/AUTO_TASK_CHAIN.tsv` only if ALL conditions below are true.

## Required Before Chain Entry
1. RFQ exists at the declared `RFQ_PATH`.
2. Physical report file exists at the declared `REPORT_PATH`.
3. Slice is bounded and tagged as one of:
   - SCREEN_SLICE
   - CROSS_FLOW_SLICE
   - INFRA_SLICE
4. Owner role is declared:
   - AGENT_1
   - AGENT_2
   - AGENT_3
5. Screen is declared, or `INFRA` for infrastructure-only work.
6. `Production readiness (this slice)` section exists in RFQ.
7. `Cross-flows touched` section exists in RFQ.
8. `In Scope` and `Out Of Scope` sections exist in RFQ.
9. Route / FE file / BE owner are declared, unless truly infra-only.
10. Slice does not widen beyond one bounded goal.

## Forbidden Chain Entries
- Missing RFQ
- Missing physical report file
- “Whole screen” or “whole module” work with no bounded slice
- Tasks with undefined owner
- Tasks with undefined rollback path
- Tasks whose scope claims whole spines (e.g. full Reports spine, full Billing spine)

## Required Status Transitions
- `ASSIGNED` only after all chain entry rules pass
- `READY_FOR_QC` only after report is updated with evidence
- `APPROVED_FOR_INTEGRATION` only after QC verdict file exists
- `APPROVED_AWAITING_NEXT_ASSIGNMENT` if next `REPORT_PATH` is missing

## QC Gate
QC must reject if:
- report claims more than RFQ scope
- route works but cross-flow declared in RFQ does not
- billing path is touched but approve/commit/reject evidence is missing
- persistence is claimed but refresh loses state
