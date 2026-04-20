# QC OpenAI Models And Secrets Spec

**Execution flow:** [`./IMPLEMENTATION_EXECUTION_RULES.md`](./IMPLEMENTATION_EXECUTION_RULES.md) · **Agent scope:** [`./Agent_OpenAI_Models_And_Secrets_Spec.md`](./Agent_OpenAI_Models_And_Secrets_Spec.md) · **PO:** [`./Product_Owner_OpenAI_Models_And_Secrets_Spec.md`](./Product_Owner_OpenAI_Models_And_Secrets_Spec.md)

## Owner
**Quality Control**

## Scope
Validate the OpenAI model integration and secrets handling implementation.

QC must confirm that the implementation is:
- real
- centralized
- safe
- aligned with product architecture
- not leaking secrets
- not hardcoding model sprawl across feature code

---

## Critical Validation Rule

QC must reject any implementation that:
- commits real secrets into the repo
- leaks `OPENAI_API_KEY` to frontend code
- hardcodes model names across multiple feature files without a shared registry
- creates multiple ungoverned OpenAI clients
- claims Legal Hub Search is source-restricted but uses open web by default
- exposes internal model or secret details unnecessarily to the frontend

---

## Required QC Checks

### 1. Secret Storage
Validate:
- `OPENAI_API_KEY` is not committed
- real secrets are environment-based
- `.env` / `.env.local` strategy is safe
- ignored files are properly configured

### 2. Shared OpenAI Client
Validate:
- one shared OpenAI client exists
- feature modules reuse it
- no unnecessary duplicated client creation exists

### 3. Shared Model Registry
Validate:
- model selection is centralized
- registry contains default / premium / routing / realtime / legal models
- features consume registry values rather than random string literals

### 4. Responses API Helper
Validate:
- helper exists
- helper is used for standard text flows
- model selection can be controlled centrally

### 5. Realtime Helper
Validate:
- voice / realtime logic is separated from standard text helper
- realtime model selection is centralized
- practice modules do not embed raw realtime plumbing unnecessarily

### 6. Legal Hub Search Wiring
Validate:
- Legal Hub Search uses the shared client
- default model is the legal search model
- deeper mode uses legal deep model only intentionally
- `file_search` is wired for approved retrieval
- open web is not the default research path

### 7. Frontend Safety
Validate:
- frontend receives safe product-level mode information only
- frontend is not given secrets
- frontend is not overexposed to backend model plumbing

### 8. Credit Mapping
Validate:
- credit mapping exists for product actions
- model tier and product cost are intentionally mapped
- cost behaviour is not hidden or inconsistent

---

## Required QC Output Format

### QC Scope Reviewed
### Previous QC Report Checked: Yes / No
### Previous QC Report Path / Reference
### Files Reviewed
### Secret Handling Safe: Yes / No
### Shared Client Present: Yes / No
### Shared Model Registry Present: Yes / No
### Responses Helper Present: Yes / No
### Realtime Helper Present: Yes / No
### Legal Hub Search Wiring Valid: Yes / No
### Frontend Exposure Safe: Yes / No
### Credit Mapping Valid: Yes / No
### Issues Resolved
### Issues Still Open
### New Issues Found
### QC Verdict: Approved / Rejected / Rework Required / Conditionally Approved
### Integration Status
Approved For Integration / Not Approved For Integration (map **§9** in [`IMPLEMENTATION_EXECUTION_RULES.md`](./IMPLEMENTATION_EXECUTION_RULES.md))

---

## Rejection Rule

Reject if any of the following are true:
- secrets in repo
- frontend secret leakage
- duplicated unmanaged model config
- no central registry
- no central helper layer
- Legal Hub Search defaulting to uncontrolled search
- completion claimed without repository implementation

---

## One-Line Instruction

```text
Validate that OpenAI integration is centralized, secret-safe, model-governed, frontend-safe, and correctly wired for Legal Hub Search and voice/realtime flows, and reject any implementation that leaks secrets or spreads model logic chaotically across the repo.
```
