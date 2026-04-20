# Agent C Task Card

Owner: Agent C (Integration/Verification)  
**Alias zespołowy (2026-04-16, QC → zespół):** w komunikacji **„Vo” = Agent C** — ta sama rola i ten sam task card; używajcie aliasu tylko gdy wszyscy znają mapowanie (unikajcie „Vo” w copy produktu / UI).  
**Visual Consistency Owner (2026-04-16):** ten sam **Agent C (Vo)** — kapelusz normatywny dla motywów / AppShell wg `visual-consistency-owner-role-spec.md` + `qc-live-status.md` (obok integracji z tego task card).  
Priority: Critical  
Gate: Must end with `READY FOR QC`

## Scope

1. Integrate A + B changes end-to-end:
- Assistant UI consumes structured backend response
- route suggestions and actions work from real payload
- safety notes render correctly

2. Integration verification:
- sensitive prompts (tribunal/ACAS/discrimination/harassment/emergency)
- normal prompts (CV/interview/salary/general)
- history reload preserves meta correctly

3. Regression guard:
- no breakage in Applications/Profile/Skills navigation paths
- no broken Assistant route flow

## Changed Areas Expected

- integration glue in frontend assistant store/page
- small alignment fixes in shared types if required
- no large feature expansion outside integration scope

## Acceptance Criteria

- End-to-end assistant flow works with structured meta
- Safety behavior visible and coherent in UI
- QA steps reproducible from report
- Lints/build pass for touched files

## Required Report

File: `docs/qc-reports/agent-c-report.md`  
Format: `docs/policies/execution-reporting-standard.md`  
Status line required: `READY FOR QC`
