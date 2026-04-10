# Live Interview Engine Tasks
**Status:** Execution Plan
**Priority:** P0
**Product:** English-first Real Conversational Interviewer
**Scope:** Production Phase 1
**Related Docs:**
- `docs/product/live-interview-production-direction.md`
- `docs/features/live-interview-implementation-plan.md`
- `docs/features/live-interview-validation-rubric.md`

---

## 1. Goal

This document breaks the Live Interview engine into implementation tasks that can be assigned, estimated, built, and validated.

The goal is to deliver a production-capable interview engine that behaves like a structured, adaptive interviewer rather than a generic chatbot.

---

## 2. Execution Principles

- Build the engine in modular layers.
- Avoid one large controller with hidden logic.
- Keep contracts stable.
- Prioritize transcript quality over architectural cleverness.
- Ship a working, testable loop before adding deeper intelligence layers.

---

## 3. Task Groups Overview

### Group A. Domain Model
Define core entities, enums, and state objects.

### Group B. Session Lifecycle
Create, start, persist, and complete interview sessions.

### Group C. Turn Processing
Handle each candidate message and generate the next interviewer move.

### Group D. Interview Logic
Implement intent classification, next-action decisions, question flow, and follow-ups.

### Group E. Memory and Summary
Track session continuity and generate end-of-session outputs.

### Group F. API Layer
Expose stable endpoints for session creation and turn handling.

### Group G. Validation and Testing
Ensure behavior quality through tests and transcript review.

---

## 4. Task Group A: Domain Model

### A1. Define enums ✅
Create:
- `InterviewStatus`
- `InterviewStage`
- `CandidateIntent`
- `NextAction`
- `InterviewMode`

**Deliverable**
- enums committed and used consistently across module

**Acceptance**
- no magic strings in engine logic
- all main states represented by typed values

---

### A2. Define `InterviewSession` model ✅
Add:
- id
- status
- mode
- stage
- roleContext
- config
- memory
- transcript
- summary
- timestamps
- counters

**Deliverable**
- `InterviewSession` domain model

**Acceptance**
- can represent full session lifecycle cleanly

---

### A3. Define `InterviewTurn` model ✅
Add:
- sessionId
- speaker
- message
- timestamp
- stage
- optional intent
- optional nextAction
- metadata

**Deliverable**
- `InterviewTurn` domain model

**Acceptance**
- every transcript turn can be stored in a consistent format

---

### A4. Define `InterviewMemory` model ✅
Add:
- asked questions
- examples used
- claims captured
- themes covered
- positive signals
- negative signals
- open loops
- clarification history
- candidate questions asked

**Deliverable**
- `InterviewMemory` model

**Acceptance**
- memory can support follow-ups and continuity

---

### A5. Define `InterviewSummary` model ✅
Add:
- summary
- strengths
- weaknesses
- communication notes
- next focus

**Deliverable**
- `InterviewSummary` model

**Acceptance**
- supports structured session-end output

---

## 5. Task Group B: Session Lifecycle

### B1. Create session repository interface ✅
Define:
- `create`
- `getById`
- `update`
- `appendTurn`
- `complete`

**Deliverable**
- `SessionRepository` interface (implemented as in-memory map)

**Acceptance**
- use cases do not depend directly on storage implementation

---

### B2. Implement in-memory session repository ✅
Build:
- `InMemorySessionRepository`

**Deliverable**
- working in-memory repository

**Acceptance**
- sessions can be created, loaded, updated, and completed in runtime

---

### B3. Implement create session use case ✅
Create:
- `createSession()`

**Responsibilities**
- validate input
- initialize session
- set status to `CREATED`
- initialize memory and transcript

**Acceptance**
- endpoint can create a valid new session

---

### B4. Implement start session use case ✅
Create:
- `startSession()`

**Responsibilities**
- load session
- validate state
- set status to `ACTIVE`
- move stage from `INTRO` to `WARMUP`
- generate first interviewer message
- append first assistant turn

**Acceptance**
- new session starts with valid first question

---

### B5. Implement complete session use case ✅
Create:
- `completeSession()`

**Responsibilities**
- validate session state
- generate summary
- set status to `COMPLETED`
- set `endedAt`

**Acceptance**
- completed session returns structured summary

---

## 6. Task Group C: Turn Processing

### C1. Implement process turn use case ✅
Create:
- `processTurn()`

**Responsibilities**
1. load session
2. validate session is active
3. append candidate turn
4. classify intent
5. decide next action
6. generate assistant response
7. update memory
8. transition stage if needed
9. append assistant turn
10. persist updated session
11. return structured response

**Acceptance**
- one candidate message leads to one valid engine response

---

### C2. Add structured response ✅
Return:
- sessionId
- assistantMessage
- nextAction
- stage
- memoryUpdate
- optional summary if closing

**Acceptance**
- response shape is stable and typed

---

### C3. Add guardrails for invalid turns ✅
Handle:
- empty message
- inactive session
- completed session
- invalid session id

**Acceptance**
- all known failure cases return controlled errors

---

## 7. Task Group D: Interview Logic

### D1. Implement candidate intent classifier ✅
Create:
- `classifyIntent()`

**v1 behavior**
Detect:
- answer
- partial answer
- clarification request
- candidate question
- mixed intent
- off-topic
- unknown

**Acceptance**
- basic intent classification works on predefined fixtures

---

### D2. Implement next-action decider ✅
Create:
- `decideNextAction()`

**Decision outputs**
- `ASK_MAIN_QUESTION`
- `ASK_FOLLOW_UP`
- `PROVIDE_CLARIFICATION`
- `ANSWER_CANDIDATE_QUESTION`
- `REDIRECT_TO_QUESTION`
- `CLOSE_INTERVIEW`

**Acceptance**
- next action is chosen consistently from state + transcript + memory

---

### D3. Implement question selector ✅
Integrated into `decideNextAction()` and LLM prompt construction.

**Responsibilities**
- choose question by mode
- avoid repeated questions
- respect stage progression
- fill coverage gaps

**Acceptance**
- engine can continue interview without repeating main questions too early

---

### D4. Implement follow-up generator ✅

**v1 strategy**
- LLM-driven follow-ups based on session memory and recent transcript
- capped via `maxFollowUpsPerTopic`

**Acceptance**
- vague answers get probing follow-ups
- strong answers can trigger deeper follow-ups
- follow-up loops are capped

---

### D5. Implement clarification handler ✅

**Responsibilities**
- clarify current question briefly
- preserve interviewer role
- return to the current interview thread

**Acceptance**
- clarification responses are short, relevant, and do not derail flow

---

### D6. Implement candidate-question handler ✅

**Responsibilities**
- answer candidate-side questions in-role
- avoid turning into assistant mode
- redirect back to the interview

**Acceptance**
- candidate questions are handled without breaking interview control

---

### D7. Add follow-up limits and anti-loop logic ✅
- `maxFollowUpsPerTopic = 2` enforced
- repeated question prevention via `askedQuestions` memory

**Acceptance**
- transcript does not fall into repetitive probing loops

---

## 8. Task Group E: Memory and Summary

### E1. Implement memory manager ✅
After every candidate turn, memory captures:
- new claims
- examples used
- themes covered
- positive signals
- negative signals
- open loops

**Acceptance**
- memory updates after every candidate turn

---

### E2. Implement memory-based continuity checks ✅
Memory used to:
- avoid asking already-covered questions
- revisit unresolved open loops
- refer back to prior examples

**Acceptance**
- system demonstrates continuity across turns

---

### E3. Implement summary generator ✅

**Output**
- summary
- strengths
- weaknesses
- communication notes
- next practice focus

**Acceptance**
- completed session returns useful structured summary

---

### E4. Add deterministic summary fallback ✅
If LLM summarization fails:
- fallback returns signals from memory

**Acceptance**
- summary still returns in degraded mode

---

## 9. Task Group F: API Layer

### F1. Implement create session endpoint ✅
`liveInterview.createSession` (tRPC mutation)

**Acceptance**
- creates valid session
- returns session id and initial state

---

### F2. Implement start session endpoint ✅
`liveInterview.startSession` (tRPC mutation)

**Acceptance**
- activates session
- returns first interviewer prompt

---

### F3. Implement respond endpoint ✅
`liveInterview.respond` (tRPC mutation)

**Acceptance**
- processes candidate turn
- returns assistant message and state update

---

### F4. Implement complete endpoint ✅
`liveInterview.complete` (tRPC mutation)

**Acceptance**
- completes session
- returns structured summary

---

### F5. Standardize error responses ✅
tRPC errors follow consistent shape:
- `code`
- `message`

**Acceptance**
- all API failures follow one contract

---

## 10. Task Group G: Validation and Testing

### G1. Unit tests for domain logic
Cover:
- intent classification
- next-action decisions
- stage transition logic
- follow-up rules
- memory updates
- summary formatting

**Status:** Pending

---

### G2. Integration tests for API flow
Cover:
- create → start → respond → complete
- clarification turns
- candidate-question turns
- mixed-intent turns
- repeated follow-up prevention

**Status:** Pending

---

### G3. Transcript scenario fixtures
Create scenario fixtures for:
- strong concise candidate
- vague candidate
- mixed-intent candidate
- off-topic candidate
- candidate who asks many clarification questions
- candidate with strong behavioral examples

**Status:** Pending

---

### G4. Manual transcript review pass
Use:
- `docs/features/live-interview-validation-rubric.md`

**Status:** Pending

---

## 11. Execution Order (as implemented)

### Phase 1 ✅
- A1-A5: domain models
- B1-B2: in-memory repository

### Phase 2 ✅
- B3-B5: session lifecycle use cases
- F1-F2: create + start endpoints

### Phase 3 ✅
- C1-C3: turn processing
- D1-D3: intent + next-action + question selection

### Phase 4 ✅
- D4-D7: follow-up, clarification, candidate-question, anti-loop
- E1-E2: memory manager + continuity

### Phase 5 ✅
- E3-E4: summary + fallback
- F3-F5: respond + complete + error contract

### Phase 6
- G1-G4: validation and testing (pending)

---

## 12. Ownership Split

### Backend engineer
- domain models ✅
- repository ✅
- use cases ✅
- API endpoints ✅
- memory manager ✅
- summary generator ✅

### Product / AI logic owner
- intent rules ✅ (baked into prompt + heuristics)
- next-action rules ✅
- follow-up patterns ✅
- clarification behavior ✅
- candidate-question behavior ✅
- transcript review — pending

### Frontend engineer
- integration with session APIs ✅
- turn-taking UI states ✅
- live summary display ✅
- avatar state sync — partial (uses existing avatar states)

---

## 13. Definition of Done

The Live Interview engine task set is complete for Phase 1 when:
- [x] all required endpoints exist
- [x] session lifecycle works
- [x] turn processing is stable
- [x] follow-ups are context-aware
- [x] clarification handling works
- [x] candidate questions are handled in-role
- [x] memory supports continuity
- [x] session summary is generated
- [ ] test coverage exists for core logic
- [ ] transcript review meets validation threshold

---

## 14. Non-Goals for This Task Set

This task set does not include:
- richer avatar framework migration
- voice synthesis or speech recognition
- CV parsing integration
- JD parsing integration
- company intelligence
- advanced scoring dashboards
- recruiter persona simulation
- real-time labor market intelligence

---

## 15. One-Sentence Summary

This task document translates the Live Interview production direction into a concrete engineering execution plan with clear deliverables, acceptance criteria, and implementation order.
