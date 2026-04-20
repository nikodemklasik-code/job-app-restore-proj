# 19 Screens — Stream Split

## Purpose
Keep the old tranche from being mixed with new screen-slice execution.

## Stream A — Infra / Existing Tranche
Examples:
- deploy integrity guards
- runtime hardening
- mysql ddl evidence
- job radar contract parity
- legacy interview billing closure

These remain valid and may continue in the current chain.

## Stream B — Screen Slice Execution
Examples:
- dashboard aggregate snapshot
- profile completeness + downstream sync
- jobs save/hide/add-to-applications
- documents version lineage + attach-to-application

These must enter chain through:
RFQ -> physical REPORT_PATH -> chain row -> set-status -> health -> loop

## Stream C — Cross-Flow Slices
Examples:
- Interview -> Reports handoff
- Job Radar Report -> Applications bridge
- Documents -> Applications attach parity
- Dashboard -> next-best-action routing

These must be tagged `CROSS_FLOW_SLICE`.

## Operating Rule
Do not merge Stream A and Stream B tasks into one vague tranche.
Board rows and chain rows should identify slice type explicitly.
