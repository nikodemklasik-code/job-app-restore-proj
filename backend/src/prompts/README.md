# Prompts

This directory contains active prompt logic used by the AI system.

## Structure
- `shared/` = reusable rules (including `ABUSE_RESISTANCE_RULES`, `PERSONA_STABILITY_RULES`, `CAPACITY_ADAPTATION_RULES`, `SKILL_GROWTH_RULES`, `POSITIVE_MOTIVATION_RULES`, `NEURODIVERSITY_AWARE_COACHING_RULES`, plus core/tone/compliance modules). **`universal-behavior-layer.ts`** concatenates those six into `UNIVERSAL_BEHAVIOR_LAYER` and is appended to module system prompts and tRPC style flows.
- `assistant/` = Assistant prompts
- `warmup/` = Daily Warmup prompts
- `interview/` = Interview prompts
- `coach/` = Coach prompts
- `negotiation/` = Negotiation prompts
- `personas/` = persona prompt overlays
- `schemas/` = structured output contracts

## Rule
Docs describe the rules.
Prompts implement the rules.
