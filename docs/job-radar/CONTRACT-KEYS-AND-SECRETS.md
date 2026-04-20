# Contract vs Keys — Do Not Conflate (Normative)

This note exists so **QC, deploy scripts, and developers** never mix **three unrelated things**. W dokumentacji przy słowie **„key”** zawsze doprecyzuj: **API key** vs **integrity marker** vs **contract file**.

---

## 1. `OPENAI_API_KEY` — real OpenAI credential

| Item | Rule |
|------|------|
| **What it is** | The **actual** OpenAI API secret used for **live** model calls (assistant, interview, negotiation, parsers where applicable). |
| **Used for** | **Only** AI live smoke / real OpenAI calls (and production backend processes that call OpenAI). |
| **Where it lives** | **Environment** or secret manager for the **backend** — never in git. |
| **Repo** | **Must not** be committed. |
| **QC** | `docs/qc-reports/qc-ai-live-smoke-2026-04-16.md` — bramka *live* wymaga tego klucza w środowisku smoke. |

---

## 2. Internal canonical repo / deploy key — **not** a secret

| Item | Rule |
|------|------|
| **What it is** | An **internal integrity marker** (non-secret strings or paths) used to verify: correct **local repo folder**, correct **remote server path**, correct **deploy target**, correct **domain / host**. |
| **Where it may exist** | Local repo, GitHub, deploy scripts, QC validation logic. |
| **Must not contain** | Real passwords, API keys (including `OPENAI_API_KEY`), or SSH private material. |
| **Where defined** | [`docs/policies/canonical-repo-deploy-lock-policy-v1.0.md`](../policies/canonical-repo-deploy-lock-policy-v1.0.md), repo root `.canonical-repo-key`, `scripts/deploy.sh`, `scripts/lib/canonical-deploy-guards.sh`. |

---

## 3. Job Radar OpenAPI contract — source of truth in git (+ uploaded copy id)

| Item | Rule |
|------|------|
| **Canonical contract (SoT)** | `docs/job-radar/job-radar-openapi-v1.1.yaml` in this repository — **Job Radar REST contract only** (paths, schemas, behaviour under test). Backend contract tests read **only** this path (e.g. `job-radar-openapi-v1.1.contract.spec.ts`). |
| **Secrets** | The YAML must **not** embed API keys, passwords, or SSH material. |
| **Uploaded copy (OpenAI Files API)** | A platform **duplicate** of the same spec may exist for tooling. **Recorded `file_id`:** `file-PRcqRdUMTqfnaP8LKsh99k` — this is a **Files API file handle** for traceability / assistants; it is **not** `OPENAI_API_KEY`, **not** the deploy marker from §2, and **not** a substitute for the git file as SoT. Also stored on the spec as `info.x-openaiUploadedContractFileId`. |
| **Handoff / QC thread** | `docs/qc-reports/qc-job-radar-openapi-contract-dev-handoff-2026-04-16.md` |

---

## Quick reference (same three concepts)

| # | Concept | Secret? | Canonical location / meaning |
|---|---------|---------|--------------------------------|
| 1 | `OPENAI_API_KEY` | **Yes** | Env / CI secrets only — live OpenAI only |
| 2 | Internal repo / deploy integrity marker | No | Policy + `.canonical-repo-key` + deploy scripts — no credentials |
| 3 | Job Radar OpenAPI v1.1 (+ optional `file_id` for upload) | No (file is public spec; `file_id` is non-secret handle) | `docs/job-radar/job-radar-openapi-v1.1.yaml` — SoT; `file-PRcqRdUMTqfnaP8LKsh99k` = uploaded copy id only |

Do **not** treat `file-…` ids, deploy path markers, or contract filenames as substitutes for `OPENAI_API_KEY`.
