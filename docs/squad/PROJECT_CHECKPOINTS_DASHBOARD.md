# Project Checkpoints Dashboard

## Live bounded execution

| Role | Previous task | Current task | Next task |
|---|---|---|---|
| AGENT_1 | Backend runtime hardening | QC intake for runtime hardening RFQ | MySQL DDL evidence on target DB |
| AGENT_2 | Job Radar bounded parity | QC intake for Job Radar bounded parity RFQ | Job Radar post-DDL smoke |
| AGENT_3 | Legacy interview billing parity | QC intake for legacy interview billing RFQ | Legacy interview followups acknowledgement |
| PRODUCT_OWNER | Keep board and dashboard current | Force QC intake and keep board synced | Assign tranche 2 after verdicts |
| QC | Repo sweep with no fresh intake | Review three READY_FOR_QC slices | Return verdicts and monitor tranche 2 |

## Current real progress
- Agent 1: 14%
- Agent 2: 100%
- Agent 3: 27%
- Product Owner: 90%
- QC: 38%

## Auto-advance rule
Agent auto-advance is allowed only when:
1. current state matches AUTO_ADVANCE_FROM
2. QC verdict exists
3. next bounded task path is already named
