# Agent OpenAI Models And Secrets Spec

**Execution flow:** [`./IMPLEMENTATION_EXECUTION_RULES.md`](./IMPLEMENTATION_EXECUTION_RULES.md) · **QC (this scope):** [`./QC_OpenAI_Models_And_Secrets_Spec.md`](./QC_OpenAI_Models_And_Secrets_Spec.md) · **PO:** [`./Product_Owner_OpenAI_Models_And_Secrets_Spec.md`](./Product_Owner_OpenAI_Models_And_Secrets_Spec.md)

## Owner
**Assigned Agent**

## Scope
Implement the OpenAI model and secrets integration layer in the repository.

This scope covers:
- OpenAI client setup
- central model registry
- env / secret handling
- Responses API helper
- Realtime helper
- Legal Hub Search file_search wiring support
- frontend-safe exposure of mode and credit information only

This is an implementation task, not a planning task.

---

## Critical Secret Rule

### Real Secrets
The following must **never** be committed to the repo:
- `OPENAI_API_KEY`
- SSH private keys
- third-party API secrets
- passwords
- production tokens

They must live only in:
- environment variables
- server secret storage
- deployment secrets
- CI/CD secrets
- local `.env` files that are ignored by git

### Internal Non-Secrets
The following may exist in repo:
- `.canonical-repo-key`
- deploy integrity markers
- internal non-secret source-of-truth markers

Do not confuse internal markers with real secrets.

---

## Required Repo Direction

### Backend Files To Add Or Normalize

```text
backend/src/config/ai.models.ts
backend/src/config/ai.env.ts
backend/src/lib/openai/openai.client.ts
backend/src/lib/openai/model-registry.ts
backend/src/lib/openai/cost-registry.ts
backend/src/lib/openai/openai.responses.ts
backend/src/lib/openai/openai.realtime.ts
```

### Optional Feature-Level Usage
These modules should consume the shared registry rather than hardcoding model names:
- Assistant
- AI Analysis
- Coach
- Interview
- Negotiation
- Skill Lab
- Job Radar
- Legal Hub Search
- Practice modules using voice / realtime

---

## Required Model Set

### Default Text Model
- `gpt-5.4-mini`

### Premium / Deep Text Model
- `gpt-5.4`

### Cheap Routing / Tagging / Estimation Model
- `gpt-5.4-nano`

### Realtime Voice Model
- `gpt-realtime-mini`

---

## Required ENV Keys

The implementation must support env-based model selection:

```bash
OPENAI_API_KEY=sk-...
OPENAI_DEFAULT_MODEL=gpt-5.4-mini
OPENAI_PREMIUM_MODEL=gpt-5.4
OPENAI_ROUTING_MODEL=gpt-5.4-nano
OPENAI_REALTIME_MODEL=gpt-realtime-mini
OPENAI_LEGAL_SEARCH_MODEL=gpt-5.4-mini
OPENAI_LEGAL_DEEP_MODEL=gpt-5.4
```

### Required Rule
No feature file should hardcode model names if it can instead consume the shared model registry.

---

## Required Model Registry

Create a shared model registry that exposes at least:
- `defaultText`
- `premiumText`
- `routing`
- `realtime`
- `legalSearch`
- `legalDeep`

Example target shape:

```ts
export const AI_MODELS = {
  defaultText: process.env.OPENAI_DEFAULT_MODEL ?? "gpt-5.4-mini",
  premiumText: process.env.OPENAI_PREMIUM_MODEL ?? "gpt-5.4",
  routing: process.env.OPENAI_ROUTING_MODEL ?? "gpt-5.4-nano",
  realtime: process.env.OPENAI_REALTIME_MODEL ?? "gpt-realtime-mini",
  legalSearch: process.env.OPENAI_LEGAL_SEARCH_MODEL ?? "gpt-5.4-mini",
  legalDeep: process.env.OPENAI_LEGAL_DEEP_MODEL ?? "gpt-5.4",
} as const;
```

---

## Required OpenAI Client

Create one shared OpenAI client using `OPENAI_API_KEY`.

### Rule
- do not instantiate OpenAI independently across many feature files
- do not expose `OPENAI_API_KEY` to the frontend
- keep client creation centralized

---

## Required Responses API Helper

Create a shared helper for text generation using Responses API.

It must support:
- `model`
- `input`
- optional `instructions`
- optional `tools`

### Required Use Cases
- Assistant
- Coach
- Analysis
- Skill Lab
- Job Radar
- Legal Hub Search
- practice summary flows

---

## Required Realtime Helper

Create a shared helper or adapter for realtime voice flows.

It must support:
- Interview voice mode
- Daily Warmup voice mode if used
- future expansion without hardcoding voice model logic inside feature screens

---

## Legal Hub Search Requirement

Legal Hub Search must use:
- shared OpenAI client
- shared model registry
- `legalSearch` model by default
- `legalDeep` only for explicit deeper mode
- `file_search` for approved legal sources
- no open web as default

---

## Frontend Exposure Rule

Frontend must not receive raw secret information or arbitrary model names everywhere.

Frontend may receive:
- selected mode label
- estimated credits
- maximum approved credits
- premium / deep flag
- realtime flag
- approved-sources flag

Frontend must not need:
- `OPENAI_API_KEY`
- vector store IDs
- internal model-selection secrets

---

## Credit Mapping Requirement

Create a shared cost registry or equivalent mapping between:
- product action
- model tier
- credit cost

At minimum support:
- assistant quick
- assistant deep
- warmup 15 / 30 / 45 / 60
- interview lite / standard / deep / voice
- legal core / legal deep
- coach quick / structured / deep

---

## Git Rules

### Must Be In `.gitignore`
- `.env`
- `.env.local`
- backend environment secrets
- frontend environment secrets containing real secrets

### Must Not Be Committed
- real OpenAI keys
- copied secret files
- temporary debug files containing tokens

---

## Delivery Format

Your delivery must include:

### Scope Implemented
### Files Changed
### ENV Keys Added Or Expected
### Model Registry Added
### Responses API Helper Added
### Realtime Helper Added
### Feature Modules Wired
### Tests Added Or Updated
### Ready For QC: Yes / No
### Blockers

---

## Definition Of Done

This scope is done only when:
- secrets are environment-based, not repo-based
- OpenAI client is centralized
- models are centrally configured
- feature modules use shared registry / helpers
- Legal Hub Search is wired for `file_search`
- frontend only sees safe product-facing mode/cost info
- QC can verify code, env strategy, and safety

---

## One-Line Instruction

```text
Implement a centralized OpenAI integration layer in the repository using env-based secrets, a shared model registry, shared Responses and Realtime helpers, safe frontend exposure, and no hardcoded model sprawl across feature files.
```
