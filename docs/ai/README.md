# AI Documentation

This directory is the source of truth for AI behavior, product structure, and quality framework for the AI career system.

**Rollout order (repo-wide, operational):** [Final rollout execution plan v1.0](../executive-plan/final-rollout-execution-plan-v1.0.md) — deploy → Job Radar → Skill Lab / SkillUp → Assistant → cleanup.

## Master bundle & product layer

- **[AI Career AI Master Bundle (entry)](./AI_CAREER_AI_MASTER_BUNDLE.md)** — what the documentation + prompt-rule package contains.
- **[Product spec](./product/ai-career-system-product-spec.md)** — modular system, AI Core, principles, evidence rule, success definition.
- **[Module definitions and goals](./product/module-definitions-and-goals.md)** — Assistant through Negotiation: definitions, success, anti-patterns.
- **[KPIs and success metrics](./product/kpis-and-success-metrics.md)** — system, module, and AI quality KPIs.
- **[KPI operating model](./product/kpi-operating-model.md)** — formulas, owners, cadence, event taxonomy, rollout plan.

## Module behavior specs

- **[Coach behavior spec](./modules/coach-behavior-spec.md)** — ten coach modules and success definition.
- **[Negotiation behavior spec](./modules/negotiation-behavior-spec.md)** — strategy, message builder, practice mode.

## Principles (shared)

- **[Adversarial and abuse resistance](./principles/adversarial-and-abuse-resistance.md)**
- **[Capacity adaptation](./principles/capacity-adaptation.md)**
- **[Skill growth and agency](./principles/skill-growth-and-agency.md)**
- **[Neurodiversity-aware coaching](./principles/neurodiversity-aware-coaching.md)**  
  (Earlier v1.0 variant: [neurodiversity-aware-coaching-v1.0.md](./principles/neurodiversity-aware-coaching-v1.0.md))

## Roadmap & evaluation

- **[AI mastery backlog v2](./roadmap/ai-mastery-backlog-v2.md)**
- **[Evaluation dataset spec](./evaluation/evaluation-dataset-spec.md)** — minimum 100 scenarios, coverage areas, release rule.

## Scope (existing deep docs)

This tree also covers:

- system architecture,
- mode boundaries and personas,
- feedback language and compliance,
- skills model and outputs,
- implementation conventions.

## Product modules (implementation links)

- Assistant — **[Final spec v1.0](../assistant/ai-assistant-final-spec-v1.0.md)** · [Configuration sheet](./assistant/ai-assistant-configuration-sheet-v1.0.md)
- Daily Warmup, Interview, Coach, Negotiation — see `docs/ai/modes/` and architecture docs.
- Skill Lab / SkillUp — [SkillUp data model](./skillup/skillup-data-model-verification-v1.0.md); Drizzle: `backend/src/db/schemas/skillup.ts`.
- JobRadar — [JobRadar interaction spec](../job-radar/job-radar-product-interaction-spec-v1.0.md)

## Career growth & evidence (v1.0)

- **[Career growth, agency, and evidence](./principles/career-growth-agency-and-evidence-v1.0.md)**

## Core rule

All modules are complementary, but each must remain independently usable.

## Implementation mapping

- `backend/src/ai/` — domain libraries and orchestration.
- `backend/src/prompts/` — prompt strings and policies; shared rule constants in `backend/src/prompts/shared/` (also re-exported from `backend/src/prompts/index.ts`).
