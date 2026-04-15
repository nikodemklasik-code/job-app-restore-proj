# AI Documentation

This directory is the human-readable source of truth for the AI Career System.

**Rollout order (repo-wide, operational):** [Final rollout execution plan v1.0](../executive-plan/final-rollout-execution-plan-v1.0.md) — deploy → Job Radar → Skill Lab / SkillUp → Assistant → cleanup.

## Scope
This documentation covers:
- system architecture,
- module responsibilities,
- product rules,
- feedback language,
- compliance and safety boundaries,
- skills model,
- PDF and report rules,
- implementation conventions.

## Product Modules
- Assistant — **[Final spec v1.0](../assistant/ai-assistant-final-spec-v1.0.md)** (canonical) · [Configuration sheet](./assistant/ai-assistant-configuration-sheet-v1.0.md) (optional team worksheet)
- Daily Warmup
- Interview
- Coach
- Negotiation
- Skill Lab / SkillUp (see [SkillUp data model](./skillup/skillup-data-model-verification-v1.0.md))
- JobRadar (see [JobRadar interaction spec](../job-radar/job-radar-product-interaction-spec-v1.0.md))

## Career growth, agency, and SkillUp (v1.0)
- **[Career growth, agency, and evidence](./principles/career-growth-agency-and-evidence-v1.0.md)** — supreme AI behaviour: detect development, dynamic skills, boundaries, positive motivation, module examples, metrics.  
- **[Neurodiversity-aware coaching](./principles/neurodiversity-aware-coaching-v1.0.md)** — adaptive support without diagnosis; goal standard preserved.  
- **[SkillUp — data model and verification engine](./skillup/skillup-data-model-verification-v1.0.md)** — claims, evidence, assessments, gaps, value snapshots, milestones, sessions. **Drizzle (MySQL):** `backend/src/db/schemas/skillup.ts`.

## Core Rule
All modules are complementary, but each must remain independently usable.

## Implementation Mapping
- `backend/src/ai/` contains domain libraries and orchestration
- `backend/src/prompts/` contains active prompt logic
- `docs/ai/` describes principles, structure, and boundaries
