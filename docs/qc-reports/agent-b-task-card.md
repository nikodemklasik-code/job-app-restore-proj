# Agent B Task Card

Owner: Agent B (Backend/API/Safety)  
Priority: High  
Gate: Must end with `READY FOR QC`

## Scope

1. Assistant backend single-source meta logic:
- remove/avoid duplicated inference paths
- one canonical builder for intent/actions/routes/context/safety

2. Contract stability:
- `sendMessage` and `getHistory` return consistent meta structure
- no field drift between shared types and runtime payload

3. Legal/safety layer completion:
- cautious non-legal-advice framing
- sensitive workplace detection
- high-risk note behavior
- jurisdiction-safe fallback wording

## Changed Areas Expected

- `backend/src/trpc/routers/assistant.router.ts`
- `backend/src/services/openai.ts`
- `shared/assistant.ts`

## Acceptance Criteria

- Meta contract is consistent and deterministic
- Safety notes/compliance flags appear on sensitive prompts
- No regressions in Assistant history payload
- Lints/build pass for touched backend/shared files

## Required Report

File: `docs/qc-reports/agent-b-report.md`  
Format: `docs/policies/execution-reporting-standard.md`  
Status line required: `READY FOR QC`
