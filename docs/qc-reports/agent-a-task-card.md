# Agent A Task Card

Owner: Agent A (Frontend Product/UX)  
Priority: High  
Gate: Must end with `READY FOR QC`

## Scope

1. Assistant UI must match product structure:
- Assistant Hero Header
- Conversation Panel
- Context Sidebar
- Suggested Actions Rail
- Insight / Routing Layer

2. Case Practice frontend shell:
- route already present must be kept stable
- screen sections and CTA aligned with product spec
- all states present: Loading, Empty, Error, Populated

3. Naming and UX consistency:
- Title Case labels
- no placeholder/dead copy
- clear CTA hierarchy

## Changed Areas Expected

- `frontend/src/app/assistant/AssistantPage.tsx`
- `frontend/src/app/case-practice/*`
- `frontend/src/components/layout/Sidebar.tsx` (only if needed for nav consistency)

## Acceptance Criteria

- Assistant is not a single chat wall anymore (has sidebar + actions + routing blocks)
- Case Practice has usable shell with visible state handling
- No visual regressions in touched screens
- Lints pass for touched files

## Required Report

File: `docs/qc-reports/agent-a-report.md`  
Format: `docs/policies/execution-reporting-standard.md`  
Status line required: `READY FOR QC`
