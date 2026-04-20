# Agent 2 Intelligence Modules Spec

**Obowiązujący obieg wykonania (szukanie raportów, dostawa, Ready For QC):** [`./IMPLEMENTATION_EXECUTION_RULES.md`](./IMPLEMENTATION_EXECUTION_RULES.md)

**Po werdykcie QC:** tylko kod + raport §6 — **§5a**, **Hard Rule 8** (bez dyskusji zamiast implementacji).

## Owner
**Agent 2**

## Workstream
Intelligence and research modules:
- Skill Lab
- Job Radar
- Legal Hub Search

## Mission
Move the intelligence modules from concept/spec state into implemented repository state.

This is not a documentation role.
This is an implementation role.

---

## Mandatory Working Mode

You must:
- implement directly in the repository
- change real backend and frontend files
- wire value logic, source logic, cards, routes, and exports
- update tests where needed
- return implementation evidence, not planning summaries

You must not:
- restate the spec instead of coding
- create extra documents in place of module implementation
- declare completion without repository changes
- drift into billing ownership or practice-module ownership except for integration

---

## Owned Scope

### 1. Skill Lab

#### Required Outcomes
Implement or complete:
- **Skill Value Logic**
- **Salary Impact Logic**
- **CV Value Signal Generation**
- **High-Value Skill Detection**
- **Underused Skill Detection**
- **Verification State Logic**
- **Evidence State Logic**
- **Course-To-Skill Mapping**
- **Growth Recommendation Hooks**

#### Required UI Direction
Expose clearly:
- **CV Value Signals**
- **Market Value**
- **Salary Impact**
- **High-Value Skills**
- **Underused Skills**
- **Verification**
- **Proof And Evidence**
- **Courses Supporting Skills**
- **What Strengthens Your CV**
- **What Weakens Your Position**

#### Credit Logic
- **Skill Value Insight** = **2 Credits**
- **Salary Impact Insight** = **3 Credits**
- **Verification Flow** = **4 Credits**
- **CV Value Deep Review** = **5 Credits**

### 2. Job Radar

#### Required Outcomes
Refactor Job Radar into a premium opportunity intelligence module.

Implement or complete:
- one clean route identity
- strong opportunity cards
- fit / risk / freshness logic
- **Why This Is On Your Radar**
- employer context
- watchlist signals
- source signals
- alerts
- visible credit cost rules

#### Required Main Views
- **Overview**
- **Opportunities**
- **Watchlist**
- **Employers**
- **Signals**
- **Sources**
- **Alerts**

#### Credit Logic
- **Why This Match** = **1 Credit**
- **Employer Quick Review** = **2 Credits**
- **Deep Listing Analysis** = **2 Credits**
- **Employer Pattern Review** = **3 Credits**
- **Advanced Radar Scan** = **4 Credits**

### 3. Legal Hub Search

#### Required Outcomes
Build or complete:
- backend module `backend/src/modules/legal-hub-search/`
- source registry loading
- approved source scope resolution
- per-source on/off
- retrieval flow
- structured answer contract
- sources used tracking
- search scope summary
- PDF export endpoint
- frontend search screen and components

#### Required Frontend Components
- **LegalSearchBar**
- **ActiveSourcePills**
- **ResearchScopeDropdown**
- **LegalAnswerCard**
- **LegalSourcesUsedPanel**
- **LegalPdfButton**
- **LegalDisclaimerBlock**

#### Credit Logic
- **Core Sources Answer** = **2 Credits**
- **Core + Tribunal Review** = **4 Credits**
- **Core + Optional Approved Sources** = **5 Credits**
- **Deep Multi-Source Review** = **7 Credits**
- **Save As PDF** = **1 Credit**

---

## Delivery Format

Every delivery must use this structure:

### Scope Implemented
- exact sub-scope completed

### Files Changed
- exact file paths changed

### Routes / APIs / Schemas Changed
- exact routes, APIs, schemas, components, services affected

### Tests Added Or Updated
- exact test files
- exact commands run

### Integration Notes
- profile, billing, or shared-shell dependencies if any

### Existing QC reports (mandatory)

**Completion is invalid unless** the agent has **checked** `docs/qc-reports/` for an **existing QC report** that applies to this slice (same scope, resubmission, or follow-up) and has **explicitly reported its status** (e.g. file path + decision line: Approved / Not Approved / none found) **in the final delivery**.

### Ready For QC
- Yes / No

### Blockers
- real blockers only, if any

---

## Definition Of Done

Work is only done when:
- Skill Lab behaves like value intelligence, not a flat skill list
- Job Radar has one clear identity and actionable high-signal UX
- Legal Hub Search is source-restricted and exportable
- real repository code is implemented and wired
- QC can validate product meaning in code and UI
- **Existing QC reports:** completion is invalid unless the agent has checked `docs/qc-reports/` for an applicable QC report and **explicitly reported its status** in the final delivery (see *Delivery Format* → *Existing QC reports*).

---

## Dependencies
- Agent 1 for profile-driven logic and billing engine
- Agent 3 only for visual coherence if shared styling or shell overlap is required

## Must Not Touch
- billing engine ownership
- settings/community ownership
- practice-module ownership except integration points

## One-Line Instruction
```text
Own the intelligence modules: Skill Lab, Job Radar, and Legal Hub Search. Implement them in real repository code, make them product-complete, source-aware, value-driven, and aligned with the credits-first model.
```
