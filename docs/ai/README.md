# AI Documentation

This directory is the human-readable source of truth for the AI Career System.

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
- Assistant
- Daily Warmup
- Interview
- Coach
- Negotiation

## Core Rule
All modules are complementary, but each must remain independently usable.

## Implementation Mapping
- `backend/src/ai/` contains domain libraries and orchestration
- `backend/src/prompts/` contains active prompt logic
- `docs/ai/` describes principles, structure, and boundaries
