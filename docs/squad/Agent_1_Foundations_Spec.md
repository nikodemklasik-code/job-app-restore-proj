# Agent 1 Foundations Spec

**Obowiązujący obieg wykonania (szukanie raportów, dostawa, Ready For QC):** [`./IMPLEMENTATION_EXECUTION_RULES.md`](./IMPLEMENTATION_EXECUTION_RULES.md)

**Po werdykcie QC:** tylko kod + raport §6 — **§5a**, **Hard Rule 8** (bez dyskusji zamiast implementacji).

## Owner
**Agent 1**

## Workstream
System foundations:
- Credits And Billing Engine
- Monthly Free Allowance
- Profile As Source Of Truth
- Deploy Integrity Guards

## Mission
Move owned scope from specification state into implemented repository state.

This is not a documentation role.
This is an implementation role.

---

## Mandatory Working Mode

You must:
- implement directly in the repository
- change real code
- wire backend and frontend where required
- update schemas, services, stores, routes, and tests
- deliver implementation, not restated plans

You must not:
- rewrite the spec instead of coding
- produce more planning documents as a substitute for implementation
- declare work done because the concept is clear
- expand scope outside your ownership unless required for integration

---

## Owned Scope

### 1. Credits And Billing Engine

#### Required Outcomes
Implement:
- **Monthly Free Allowance**
- **Credit Balance**
- **Credit Packs**
- **Credit Spend Events**
- **Fixed-Cost Actions**
- **Estimated-Cost Actions**
- **Approval Before Spend**
- **Maximum Approved Cost**
- **Usage History**
- **Monthly Reset Logic**
- **No Rollover Logic**

#### Required API / Service Logic
- get current balance
- get monthly allowance remaining
- estimate action cost
- approve spend
- deduct spend
- reject spend if insufficient balance
- create usage history entries
- reset allowance monthly

#### Required UI Support
Ensure the system supports frontend rendering of:
- **Current Credit Balance**
- **Monthly Free Allowance**
- **Credits Used This Month**
- **Buy Credits**
- **Usage History**
- **Estimated Cost Rules**

### 2. Profile As Source Of Truth

#### Required Outcomes
Add and integrate:
- **Work Values**
- **Auto-Apply Threshold**
- **Growth Plan**
- **Roadmap**
- **Skills-Course Relationships**
- **Target Role**
- **Target Seniority**
- **Target Salary Range**
- **Practice Areas**
- **Blocked Areas**
- **High-Impact Improvements**

#### Required Downstream Effects
Profile data must influence:
- **Jobs**
- **Job Radar**
- **Employer Validation**
- **Auto-Apply Eligibility**
- **Skill Lab**
- **Growth Recommendations**
- **Manual Review Recommendations**

#### Required Backend Tasks
- extend profile schema
- extend profile persistence
- add profile → downstream mapping logic
- expose profile-driven filtering and thresholds
- expose work values for employer and listing evaluation
- expose roadmap / growth plan in API shape

### 3. Deploy Integrity Guards

#### Required Outcomes
Implement:
- **.canonical-repo-key**
- **remote deploy marker**
- **local canonical path validation**
- **remote canonical path validation**
- **deploy target host validation**
- **deploy target domain validation**
- **DNS mismatch guard**
- **wrong-folder deploy block**

#### Required Rules
Deploy must fail if:
- local working directory is non-canonical
- repo marker is missing
- remote target path is wrong
- remote marker is missing
- host or domain mismatch is detected
- copied folder tries to deploy

---

## Delivery Format

Every delivery must use this structure:

### Scope Implemented
- exact sub-scope completed

### Files Changed
- exact file paths changed

### Routes / APIs / Schemas Changed
- exact routes, APIs, schemas, stores, services affected

### Tests Added Or Updated
- exact test files
- exact commands run

### Integration Notes
- where other agents depend on this implementation

### Existing QC reports (mandatory)

**Completion is invalid unless** the agent has **checked** `docs/qc-reports/` for an **existing QC report** that applies to this slice (same scope, resubmission, or follow-up) and has **explicitly reported its status** (e.g. file path + decision line: Approved / Not Approved / none found) **in the final delivery**.

### Ready For QC
- Yes / No

### Blockers
- real blockers only, if any

---

## Definition Of Done

Work is only done when:
- real repository code is changed
- backend logic is wired
- required UI support is exposed where needed
- tests are added or updated where applicable
- no hidden spend or dead profile logic remains
- QC can validate the result in code
- **Existing QC reports:** completion is invalid unless the agent has checked `docs/qc-reports/` for an applicable QC report and **explicitly reported its status** in the final delivery (see *Delivery Format* → *Existing QC reports*).

---

## Dependencies
- coordinate with Agent 3 for frontend credit display
- coordinate with Agent 2 for profile-driven effects in Skill Lab and Job Radar

## Must Not Touch
- Legal Hub Search implementation ownership
- Skill Lab UI ownership
- Job Radar UI ownership
- practice-module ownership except required integration points

## One-Line Instruction
```text
Own the product foundations: credits-and-billing, monthly free allowance, profile as source-of-truth, and deploy integrity guards. Implement them in real repository code now, deliver only wired changes, and do not substitute documentation for implementation.
```
