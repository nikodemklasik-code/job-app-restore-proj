# Agent C Task Card

Owner: Agent C (Integration/Verification)  
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
