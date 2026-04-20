# Backend Completion Spec And QC Checklist

> **Repo copy:** canonical monolith for this track. Modular split: [`README.md`](./README.md). Podział na agentów: [`../backend-completion-three-developer-split-v1.0.md`](../backend-completion-three-developer-split-v1.0.md).

## Purpose

This document defines the backend completion roadmap and Quality Control checklist for the current product state.

The backend is not empty and not purely placeholder-driven.  
However, it is not yet fully product-complete.

The goal of this spec is to:
- identify what already exists
- identify what is still missing
- define what must be completed next
- define how Quality Control should validate backend work
- prevent technical “done” from being mistaken for product completion

---

## Current Backend Status

### Honest Assessment
The backend looks:
- technically real
- partially tested
- structurally alive
- strongest around core scaffolding and Job Radar contract work

But it does **not** yet look:
- product-complete
- billing-complete
- legal-search-complete
- skill-value-complete
- fully aligned with the new credits-first philosophy
- fully aligned with the new module boundaries

### Approximate State
- **Technical Foundation:** about **60–70%**
- **Product Completion:** about **35–45%**

This means:
- a usable backend structure exists
- but major product logic still needs to be completed

---

# 1. Credits And Billing Engine

## Status
This is one of the largest remaining backend gaps.

The old billing model does not yet appear to be fully aligned with the new philosophy:
- full product access for all
- monthly free allowance
- credits-first usage
- visible cost per action
- approval before dynamic spend
- no hidden credit consumption

## Required Backend Features
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
- **No Rollover Logic** unless intentionally added later

## Required Data Model Areas
- user credit balance
- monthly free allowance balance
- action cost type
- spend status
- approval status
- usage history entries
- reset timestamps
- pack purchases

## Required API / Service Logic
- get current balance
- get monthly allowance remaining
- estimate action cost
- approve spend
- deduct spend
- reject spend if insufficient balance
- create usage history entries
- reset allowance monthly

## QC Must Validate
- fixed cost actions deduct correctly
- estimated cost actions require user approval
- actual spend never exceeds approved maximum
- free allowance resets correctly
- no hidden spend occurs
- billing and usage history remain consistent

---

# 2. Profile As Source Of Truth

## Status
Profile exists conceptually, but backend logic does not yet appear fully expanded into the rest of the product.

The backend must stop treating profile as:
- just basic user info
- just CV fields
- just passive storage

It must become the source of truth for downstream product behaviour.

## Required New Profile Logic
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

## Required Downstream Effects
Profile data must influence:
- **Jobs**
- **Job Radar**
- **Employer Validation**
- **Auto-Apply Eligibility**
- **Skill Lab**
- **Growth Recommendations**
- **Manual Review Recommendations**

## Required Backend Tasks
- extend profile schema
- extend profile persistence
- add profile → downstream mapping logic
- expose profile-driven filtering and thresholds
- expose work values for employer and listing evaluation
- expose roadmap / growth plan in API shape

## QC Must Validate
- values are saved and returned correctly
- auto-apply threshold actually changes eligibility logic
- growth fields are not just stored, but used
- profile updates propagate correctly into dependent modules
- no “dead data” fields exist with no product effect

---

# 3. Skill Lab Logic

## Status
Skill Lab appears partially started, but not fully product-complete in backend logic.

It still needs stronger backend support for:
- value interpretation
- salary interpretation
- CV impact
- verification logic
- course linkage
- growth signalling

## Required Backend Features
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

## Required Skill States
- **Declared**
- **Observed**
- **Strengthening**
- **Verified**
- **Strong Signal**

## Required Outputs
Skill Lab backend should support outputs such as:
- skill market value
- salary relevance
- CV value strength
- underexposed strength
- missing proof
- related courses
- suggested next verification action

## QC Must Validate
- salary impact is not fabricated without logic
- skill value outputs are consistent and explainable
- courses actually link to skills
- evidence and verification are not fake labels only
- the module behaves like capability intelligence, not a flat list

---

# 4. Legal Hub Search Backend

## Status
This area appears far more complete in documentation than in implemented backend.

This should be treated as a build target, not a minor patch.

## Required Backend Module
Create or complete:

```text
backend/src/modules/legal-hub-search/
```

## Required Features
- **Legal Query Validation**
- **Source Registry Loading**
- **Approved Source Scope Resolution**
- **Per-Source Toggle Handling**
- **Core vs Optional Source Filtering**
- **Prompt Orchestration**
- **Retrieval Flow**
- **Structured Answer Contract**
- **Sources Used Tracking**
- **Search Scope Summary**
- **PDF Export Endpoint**

## Required Source Logic
The backend must support:
- core sources on by default
- optional approved sources off by default
- user-controlled source scope
- answer restricted to active approved sources
- source transparency in output

## Required PDF Export Logic
- generate PDF from current answer payload
- include question, timestamp, jurisdiction, search scope, sources used, answer sections, disclaimer
- exclude internal system metadata, model IDs, vector store IDs, file IDs, debug info

## QC Must Validate
- answers are source-backed
- source toggles actually change retrieval scope
- sources used reflect real active sources
- PDF contains required sections
- PDF excludes internal-only metadata
- no answer escapes approved corpus without explicit expanded mode

---

# 5. Warmup, Coach, Interview, And Negotiation Backend Cleanup

## Status
The greatest confusion here may currently be more product-boundary confusion than pure backend absence.

Still, backend logic must be aligned with the new front-end and module separation.

## Required Backend Separation
Create or cleanly separate:
- session types
- pricing rules
- session duration logic
- mode definitions
- analytics events
- output contracts
- usage consumption rules

## Module-Specific Logic

### Daily Warmup
Must support:
- timed short practice
- fixed cost durations
- low-friction session creation
- progress tracking
- no deep interview / coach / negotiation logic

### Coach
Must support:
- topic-based guidance
- depth-based estimated cost
- strategic session outputs
- action plan output
- approval before spend

### Interview
Must support:
- realistic session-based interview flow
- lite / standard / deep modes
- answer review
- session summary
- free monthly interview allowance logic

### Negotiation
Must support:
- reply draft mode
- counter-offer mode
- strategy mode
- simulation mode
- credit costs per mode
- negotiation-specific outputs

## QC Must Validate
- Daily Warmup does not consume Interview logic
- Coach does not behave like interview question flow
- Interview is not reduced to timed warmup behaviour
- Negotiation has its own distinct mode logic
- session types and credit rules are cleanly separated

---

# 6. Community, Settings, And Consent Backend

## Status
This area appears conceptually defined but likely not fully completed backend-wise.

## Required Features
Implement or complete:
- **Social Consent**
- **Email Settings**
- **Case Study Preferences**
- **Community Visibility**
- **Referral Participation**
- **Shared Session Discoverability**
- **AI Settings**
- **Credit Purchase Linkage**
- **Preference Persistence**

## QC Must Validate
- all toggles persist
- settings are respected across the product
- discoverability flags actually affect shared session availability
- social / case study / email preferences are not cosmetic only

---

# 7. Deploy Integrity Guards

## Status
This currently appears more like a required policy direction than a fully complete implementation.

## Required Features
Implement:
- **.canonical-repo-key**
- **remote deploy marker**
- **local canonical path validation**
- **remote canonical path validation**
- **deploy target host validation**
- **deploy target domain validation**
- **DNS mismatch guard**
- **wrong-folder deploy block**

## Required Rules
Deploy must fail if:
- local working directory is non-canonical
- repo marker is missing
- remote target path is wrong
- remote marker is missing
- host or domain mismatch is detected
- copied folder tries to deploy

## QC Must Validate
- deploy from copied repo is blocked
- canonical path rules are enforced
- remote target validation exists
- no deploy path relies only on user memory

---

# 8. Existing Strongest Area: Job Radar Contract Work

## Status
Job Radar currently appears to be the strongest backend area in terms of:
- real module structure
- contract testing
- DTO and mapper cleanup
- test execution
- repository and worker logic

## QC Reminder
Do not mistake “strongest current area” for “whole module is fully complete.”

QC must still confirm:
- source of truth discipline
- contract coverage
- mapper correctness
- unresolved documented gaps vs full OpenAPI scope

---

# 9. Backend Completion Priority Order

Complete backend work in this order:

1. **Credits And Billing Engine**
2. **Profile As Source Of Truth**
3. **Skill Lab Logic**
4. **Legal Hub Search Backend**
5. **Warmup / Coach / Interview / Negotiation Cleanup**
6. **Community / Settings / Consent Backend**
7. **Deploy Integrity Guards**

This order matters because:
- credits-first logic affects the whole product
- profile logic affects downstream match and evaluation systems
- Skill Lab and Legal Hub Search are high-value but currently underpowered
- session module cleanup should follow clarified product rules

---

# 10. Quality Control Method

QC must validate backend work across three layers for each module.

## A. Functional Validation
Check:
- does it run
- does it persist
- does it return correct outputs
- does it influence dependent modules where required

## B. Product Validation
Check:
- does it match the product spec
- does it support the intended user value
- is it more than a technical placeholder
- does it actually change behaviour in the product

## C. Risk Validation
Check:
- does cost logic behave honestly
- do source restrictions hold
- do approvals really protect the user
- do deploy guards actually block dangerous actions
- do settings and preferences actually constrain behaviour

---

# 11. Module-by-Module QC Checklist

## Credits And Billing Engine
- monthly free allowance exists
- free allowance resets correctly
- fixed cost spend works
- estimated cost spend requires approval
- actual spend never exceeds approved max
- usage history is correct
- insufficient balance is handled properly

## Profile As Source Of Truth
- work values persist
- auto-apply threshold persists
- growth plan persists
- roadmap persists
- profile fields influence downstream module logic
- no dead profile fields with no product effect

## Skill Lab
- skill value logic exists
- salary impact logic exists
- CV value signals exist
- verification states are meaningful
- courses map to skills
- evidence states are meaningful

## Legal Hub Search
- source registry loads correctly
- source scope toggles work
- answer uses only active approved sources
- sources used are shown honestly
- search scope summary is correct
- PDF export is complete and clean

## Warmup / Coach / Interview / Negotiation
- session types are separated
- pricing models are separated
- outputs match module purpose
- analytics and usage rules are separated
- modules no longer share accidental logic

## Community / Settings / Consent
- settings persist
- preferences affect product behaviour
- discoverability flags work
- case study preferences are respected
- social consent is respected

## Deploy Integrity
- canonical repo marker exists
- wrong-folder deploy is blocked
- remote path validation exists
- host and domain validation exists
- copied repo cannot deploy by default

---

# 12. Definition Of Done

The backend is not “done” when:
- endpoints exist
- tests pass
- DTOs compile
- a module can be demoed once

The backend is only “done” when:
- product logic is fully implemented
- dependent modules receive the expected effects
- costs are honest and protected
- sources are constrained correctly
- settings and consent really work
- QC validates both technical and product completion

---

# 13. One-Line Developer Instruction

```text
Complete the backend by prioritizing credits-and-billing, profile as source-of-truth, Skill Lab value logic, Legal Hub Search backend, and the session-boundary cleanup for Warmup, Coach, Interview, and Negotiation, and ensure each module is product-complete rather than only technically runnable.
```

# 14. One-Line Quality Control Instruction

```text
Validate backend work not only for technical correctness but also for product completion, downstream behavioural impact, cost honesty, source restriction integrity, consent enforcement, and deploy safety.
```
