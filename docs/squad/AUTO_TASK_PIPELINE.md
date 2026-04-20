# Auto Task Pipeline

## Status gate rules

Auto-advance is allowed only when all required conditions for the current role/task are satisfied.

### Generic gates
- IMPLEMENTING does not auto-advance
- REVIEWING does not auto-advance
- READY_FOR_QC does not auto-advance
- REWORK does not auto-advance
- BLOCKED does not auto-advance
- APPROVED_FOR_INTEGRATION may auto-advance
- Special non-delivery roles may auto-advance only on explicit terminal states

### Required transition rules
A role may move to NEXT TASK only if:
1. current task exists
2. next task exists
3. current task is closed by allowed terminal state
4. no blocker is active
5. if task requires QC, verdict must be Approved For Integration
6. if task requires report, report path must exist
7. if task was reworked, latest block only counts

---

## Agent 1 pipeline

### A1_CURRENT
Title: Backend runtime hardening
Role: AGENT_1
Allowed terminal state: APPROVED_FOR_INTEGRATION
Required report: docs/qc-reports/agent-1-runtime-hardening-ready-for-qc.md
Next: A1_NEXT_1

### A1_NEXT_1
Title: Profile downstream behavioural completion
Role: AGENT_1
Allowed terminal state: APPROVED_FOR_INTEGRATION
Required report: docs/qc-reports/agent-1-profile-downstream-behavioural-completion-ready-for-qc.md
Next: A1_NEXT_2

### A1_NEXT_2
Title: Safe deploy flow hardening follow-up
Role: AGENT_1
Allowed terminal state: APPROVED_FOR_INTEGRATION
Required report: docs/qc-reports/agent-1-safe-deploy-flow-hardening-follow-up-ready-for-qc.md
Next: A1_NEXT_3

### A1_NEXT_3
Title: Runtime logs and guard cleanup
Role: AGENT_1
Allowed terminal state: APPROVED_FOR_INTEGRATION
Required report: docs/qc-reports/agent-1-runtime-logs-and-guard-cleanup-ready-for-qc.md
Next: A1_LOOP

### A1_LOOP
Title: Narrow backend runtime risk sweep
Role: AGENT_1
Allowed terminal state: APPROVED_FOR_INTEGRATION
Required report: docs/qc-reports/agent-1-narrow-backend-runtime-risk-sweep-ready-for-qc.md
Next: A1_LOOP

---

## Agent 2 pipeline

### A2_CURRENT
Title: Job Radar bounded parity
Role: AGENT_2
Allowed terminal state: APPROVED_FOR_INTEGRATION
Required report: docs/qc-reports/agent-2-job-radar-bounded-parity-ready-for-qc.md
Next: A2_NEXT_1

### A2_NEXT_1
Title: AI cost visibility bounded slice
Role: AGENT_2
Allowed terminal state: APPROVED_FOR_INTEGRATION
Required report: docs/qc-reports/agent-2-ai-cost-visibility-bounded-slice-ready-for-qc.md
Next: A2_NEXT_2

### A2_NEXT_2
Title: Legal Hub bounded retrieval discipline follow-up
Role: AGENT_2
Allowed terminal state: APPROVED_FOR_INTEGRATION
Required report: docs/qc-reports/agent-2-legal-hub-bounded-retrieval-discipline-follow-up-ready-for-qc.md
Next: A2_NEXT_3

### A2_NEXT_3
Title: Skill Lab bounded completion follow-up
Role: AGENT_2
Allowed terminal state: APPROVED_FOR_INTEGRATION
Required report: docs/qc-reports/agent-2-skill-lab-bounded-completion-follow-up-ready-for-qc.md
Next: A2_LOOP

### A2_LOOP
Title: Narrow product/backend parity sweep
Role: AGENT_2
Allowed terminal state: APPROVED_FOR_INTEGRATION
Required report: docs/qc-reports/agent-2-narrow-product-backend-parity-sweep-ready-for-qc.md
Next: A2_LOOP

---

## Agent 3 pipeline

### A3_CURRENT
Title: Legacy interview billing parity
Role: AGENT_3
Allowed terminal state: APPROVED_FOR_INTEGRATION
Required report: docs/qc-reports/agent-3-legacy-interview-billing-ready-for-qc.md
Next: A3_NEXT_1

### A3_NEXT_1
Title: Negotiation bounded module separation
Role: AGENT_3
Allowed terminal state: APPROVED_FOR_INTEGRATION
Required report: docs/qc-reports/agent-3-negotiation-bounded-module-separation-ready-for-qc.md
Next: A3_NEXT_2

### A3_NEXT_2
Title: Daily Warmup bounded low-friction slice
Role: AGENT_3
Allowed terminal state: APPROVED_FOR_INTEGRATION
Required report: docs/qc-reports/agent-3-daily-warmup-bounded-low-friction-slice-ready-for-qc.md
Next: A3_NEXT_3

### A3_NEXT_3
Title: Settings persistence bounded follow-up
Role: AGENT_3
Allowed terminal state: APPROVED_FOR_INTEGRATION
Required report: docs/qc-reports/agent-3-settings-persistence-bounded-follow-up-ready-for-qc.md
Next: A3_LOOP

### A3_LOOP
Title: Narrow practice hidden-spend sweep
Role: AGENT_3
Allowed terminal state: APPROVED_FOR_INTEGRATION
Required report: docs/qc-reports/agent-3-narrow-practice-hidden-spend-sweep-ready-for-qc.md
Next: A3_LOOP

---

## Product Owner pipeline

### PO_CURRENT
Title: Keep board and dashboard current
Role: PRODUCT_OWNER
Allowed terminal state: ACTIVE_MERGE_GATE
Required report: none
Next: PO_NEXT_1

### PO_NEXT_1
Title: Assign next bounded tasks after QC verdicts
Role: PRODUCT_OWNER
Allowed terminal state: ACTIVE_MERGE_GATE
Required report: none
Next: PO_NEXT_2

### PO_NEXT_2
Title: Remove stalls and idle gaps
Role: PRODUCT_OWNER
Allowed terminal state: ACTIVE_MERGE_GATE
Required report: none
Next: PO_NEXT_3

### PO_NEXT_3
Title: Verify execution-board to repo alignment
Role: PRODUCT_OWNER
Allowed terminal state: ACTIVE_MERGE_GATE
Required report: none
Next: PO_LOOP

### PO_LOOP
Title: Continuous execution pressure and assignment
Role: PRODUCT_OWNER
Allowed terminal state: ACTIVE_MERGE_GATE
Required report: none
Next: PO_LOOP

---

## QC pipeline

### QC_CURRENT
Title: Review reports or scan repo risks
Role: QC
Allowed terminal state: P0_SLICES_COMPLETE
Required report: none
Next: QC_NEXT_1

### QC_NEXT_1
Title: Review active Ready For QC intakes
Role: QC
Allowed terminal state: P0_SLICES_COMPLETE
Required report: none
Next: QC_NEXT_2

### QC_NEXT_2
Title: Narrow QC cleanup with report
Role: QC
Allowed terminal state: P0_SLICES_COMPLETE
Required report: docs/qc-reports/qc-narrow-cleanup-report.md
Next: QC_NEXT_3

### QC_NEXT_3
Title: Repo risk sweep when intake is empty
Role: QC
Allowed terminal state: P0_SLICES_COMPLETE
Required report: docs/qc-reports/qc-repo-risk-sweep-current.md
Next: QC_LOOP

### QC_LOOP
Title: Continuous intake and repo-risk gate
Role: QC
Allowed terminal state: P0_SLICES_COMPLETE
Required report: none
Next: QC_LOOP
