# Agent Work Split (Execution Protocol)

## Roles

### Agent A — Frontend Product/UX
- Owns page UX, layout quality, states (loading/empty/error/populated), CTA clarity.
- Owns component reuse and UI consistency across modules.
- Works in:
  - `frontend/src/app/*`
  - `frontend/src/components/*`
  - `frontend/src/features/*` (frontend side only)

### Agent B — Backend/API/Security
- Owns API contracts, auth boundaries, data integrity, and server-side correctness.
- Owns schema-safe behavior, error handling, and route/module boundaries.
- Works in:
  - `backend/src/*`
  - `shared/*` (types/contracts when API changes require it)

### Agent QC — Final Quality Gate
- Reviews outputs from Agent A and Agent B against spec and product coherence.
- Has authority to approve, reject, or block integration.
- Enforces quality formats from:
  - `docs/policies/quality-control-developer-role-spec.md`
  - folder-aware command policy in `.cursor/rules/folder-aware-commands.mdc`

## Execution Sequence

1. Agent A delivers frontend slice.
2. Agent B delivers backend/security slice.
3. Agent QC validates both against spec and against each other.
4. Integration is allowed only after explicit QC decision.

No "done" status without QC acceptance.

## Communication Flow (Mandatory)

1. Agent -> QC: execution report in repository with required template.
2. QC -> Product Owner: verified quality report with decision.
3. Product Owner -> Agent: next instructions, fixes, priority updates.
4. Product Owner -> QC: acceptance criteria, business scope, priorities.

Default rule:
- QC does not directly manage Agent backlog execution.
- QC may request quick technical clarification only.

## Task Split Rules

### Rule 1 — No ownership overlap
- If a task is primarily UI/flow, Agent A owns it.
- If a task is primarily API/auth/data, Agent B owns it.
- Mixed tasks must be split into two sub-tasks with explicit interface contract.

### Rule 2 — Contract first on mixed work
- Agent B defines request/response and error model first.
- Agent A consumes that contract and implements UI behavior/states.
- QC verifies contract adherence and user-visible behavior.

### Rule 3 — No hidden cross-edits
- Agent A does not refactor backend files "incidentally."
- Agent B does not redesign frontend UX "incidentally."
- Any needed cross-change must be declared in handoff notes.

## Definition Of Done Per Agent

### Agent A Done
- Screen matches module purpose and expected user action.
- All required states exist and are understandable.
- Naming/labels/Title Case are consistent.
- No visual regressions in touched screens.

### Agent B Done
- Correct auth model and data safety.
- No silent failure paths for critical operations.
- Error messages are actionable and consistent.
- Route/module boundaries remain clean.

### Agent QC Done
- Product alignment validated.
- UI/UX quality validated.
- Technical structure validated.
- Consistency validated.
- Explicit decision published (Approved / Rejected).

## Required Handoff Format (A and B)

```md
## Delivery
- Scope:
- Files touched:
- What changed:

## Validation
- Checks run:
- Known limits:

## Risks / Follow-ups
- ...
```

Mandatory execution reporting policy:
- `docs/policies/execution-reporting-standard.md`
- No task enters QC without repository report and explicit `READY FOR QC`.

## Required QC Decision Format

Use only:
- `Approved ... Status: Approved For Integration`
- `Rejected ... Status: Not Approved`

As defined in `docs/policies/quality-control-developer-role-spec.md`.

## Mandatory Agent Instruction Block (Current Priority)

Apply the following product updates:

### Skill Lab
Prominently expose salary relevance and CV value.

Add:
- CV Value Signals
- Market Value Signals
- Salary Potential
- High-Value Skills
- Underused Skills
- Proof And Evidence
- Skills That Increase Your Position
- Skills That Need Stronger Proof

The user must be able to understand how much financial and market value a skill may carry.

### Profile
Add:
- Growth Plan
- Roadmap

Profile must show not only current data, but also future direction, milestones, target role, target salary range, and next strategic steps.

### Skills And Courses
Connect skills directly with courses and certificates.

Show:
- Related Skills
- Courses Supporting This Skill
- This Course Strengthens
- Learning Evidence
- Still Needs Practice
- Still Needs Verification

Courses must act as visible learning evidence inside the skill system, not as isolated documents.

Reference screen blueprint:
- `docs/features/product-screens-spec-v1.0.md`
- This document is the default source for screen purpose, sections, CTA, and emotional effect consistency.
