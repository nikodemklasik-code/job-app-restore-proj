# Libraries Overview

## Purpose
The system is split into focused domain libraries rather than one large AI monolith.

## Libraries
### prompt-core
Shared rules for prompts, feedback language, compliance, adaptation, and multimodal interpretation.

### interview-engine
Logic for realistic interview behavior, adaptive questioning, closing summary, and handoff generation.

### coach-engine
Logic for targeted training, answer analysis, stronger rewrites, and practice plans.

### persona-kit
Persona definitions for interviewer styles and their voice, emphasis, and visual profile.

### report-engine
Structured outputs, report payloads, spoken summaries, and PDF payload construction.

### session-engine
Shared session state, transcript models, conversation states, and persistence contracts.

### skills-engine
Skill inference, verification, progression, and skill evidence tracking.

### recommendation-engine
Optional module routing, next-step suggestions, and recommendation policies.

## Architecture Rule
Libraries may share signals and types, but must not create hard product dependencies.
