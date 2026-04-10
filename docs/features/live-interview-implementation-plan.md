# Live Interview Implementation Plan
**Status:** Proposed  
**Priority:** P0  
**Product:** English-first Real Conversational Interviewer  
**Related Spec:** `docs/product/live-interview-production-direction.md`

---

## 1. Goal

Implement the first production-ready version of the **Live Interview** core loop.

This implementation should deliver a structured, adaptive, text-based interview experience where the system behaves like an interviewer, not a general chatbot. The initial goal is to make the live interview session coherent, stateful, extensible, and ready for later upgrades such as CV-aware personalization, JD-aware targeting, voice, and avatar layers.

---

## 2. Implementation Objective

Build a backend interview engine that can:
- create and manage live interview sessions
- maintain structured session state
- process each candidate turn
- detect candidate intent
- decide the next interviewer action
- ask main questions or follow-ups
- handle clarification requests
- handle candidate questions while preserving interviewer behavior
- update session memory after every turn
- end the interview cleanly
- generate a basic summary at the end

---

## 3. Recommended v1 Delivery Scope

### Included in this phase
- text-only interview flow
- session lifecycle
- interview stage model
- turn processing endpoint
- next-action decision engine
- follow-up logic
- clarification handling
- candidate-question handling
- in-session memory
- end-of-session summary
- transcript logging
- basic validation suite

### Explicitly excluded from this phase
- voice input/output
- avatar integration rewrite
- CV parser integration
- JD parser integration
- company intelligence
- advanced scoring
- recruiter-specific simulation modes
- persistent database if this slows v1 too much

If needed, v1 can ship with in-memory storage plus repository abstraction.

---

## 4. Delivery Strategy

### Principle
Build the system in layers, not as one large interview controller blob.

### Recommended order
1. stabilize domain model
2. define API contracts
3. implement session repository abstraction
4. implement turn-processing use case
5. implement intent detection
6. implement next-action decision engine
7. implement response generators
8. implement memory updates
9. implement summary generation
10. validate with transcript scenarios

---

## 5. Proposed Architecture

```text
src/
  modules/
    live-interview/
      domain/
        models/
        value-objects/
        services/
      application/
        use-cases/
        dto/
      infrastructure/
        repositories/
        providers/
      interfaces/
        http/
      tests/
        fixtures/
        integration/
        unit/
```

---

## 6. Core Domain Model

### 6.1 InterviewSession

Represents one live interview session.

#### Suggested fields

- `id`
- `status`
- `mode`
- `roleContext`
- `stage`
- `turnCount`
- `followUpCount`
- `maxTurns`
- `createdAt`
- `updatedAt`
- `startedAt`
- `endedAt`
- `memory`
- `transcript`
- `summary`

### 6.2 InterviewTurn

Represents one turn in the transcript.

#### Suggested fields

- `id`
- `sessionId`
- `speaker` (`assistant` | `candidate`)
- `message`
- `intent` (optional for candidate turns)
- `nextAction` (optional for assistant turns)
- `stage`
- `timestamp`
- `metadata`

### 6.3 InterviewMemory

Stores structured session memory.

#### Suggested fields

- `askedQuestionIds`
- `askedQuestions`
- `usedExamples`
- `claimsCaptured`
- `themesCovered`
- `positiveSignals`
- `negativeSignals`
- `openLoops`
- `clarificationHistory`
- `candidateQuestionsAsked`

### 6.4 InterviewSummary

Stores session-end output.

#### Suggested fields

- `summary`
- `strengths`
- `weaknesses`
- `communicationNotes`
- `nextFocus`

---

## 7. Enums and Value Objects

### InterviewStatus

- `CREATED`
- `ACTIVE`
- `COMPLETED`
- `ABANDONED`

### InterviewStage

- `INTRO`
- `WARMUP`
- `CORE_EXPERIENCE`
- `DEEP_DIVE`
- `CANDIDATE_QUESTIONS`
- `CLOSING`

### CandidateIntent

- `ANSWER`
- `PARTIAL_ANSWER`
- `CLARIFICATION_REQUEST`
- `CANDIDATE_QUESTION`
- `OFF_TOPIC`
- `MIXED`
- `UNKNOWN`

### NextAction

- `ASK_MAIN_QUESTION`
- `ASK_FOLLOW_UP`
- `PROVIDE_CLARIFICATION`
- `ANSWER_CANDIDATE_QUESTION`
- `REDIRECT_TO_QUESTION`
- `CLOSE_INTERVIEW`

### InterviewMode

- `GENERAL`
- `BEHAVIORAL`
- `TECHNICAL_SCREEN`
- `MIXED`

---

## 8. Required Modules

### 8.1 interviewSessionService

Responsible for:

- creating sessions
- starting sessions
- loading sessions
- updating status
- ending sessions

### 8.2 sessionRepository

Responsible for:

- save session
- get session by id
- update session
- append transcript turn

#### v1 recommendation

Implement:

- `SessionRepository` interface
- `InMemorySessionRepository` concrete class

This allows later drop-in replacement with Postgres or Redis.

### 8.3 candidateIntentClassifier

Responsible for classifying incoming candidate messages.

#### v1 recommendation

Start with heuristic classification:

- clarification phrases
- question detection
- answer length / structure cues
- mixed-intent detection

Later this can be replaced or assisted by LLM intent classification.

### 8.4 nextActionDecider

Responsible for deciding what the interviewer should do next.

Inputs:

- current stage
- candidate intent
- recent transcript
- memory
- follow-up limits
- remaining turn budget

Outputs:

- one `NextAction`

### 8.5 questionSelector

Responsible for selecting the next main interview question.

Inputs:

- mode
- stage
- asked questions
- coverage gaps
- role context

### 8.6 followUpGenerator

Responsible for generating follow-up questions based on candidate answer and session memory.

#### v1 recommendation

Use rule-based templates plus contextual extraction.

### 8.7 clarificationHandler

Responsible for concise clarification without leaving interviewer mode.

### 8.8 candidateQuestionHandler

Responsible for answering candidate questions in-role and redirecting to the interview.

### 8.9 memoryManager

Responsible for structured memory updates after every candidate turn.

### 8.10 summaryGenerator

Responsible for generating end-of-session summary.

---

## 9. Application Use Cases

### 9.1 CreateInterviewSessionUseCase

Creates a new session.

#### Input

- interview mode
- role context
- optional max turns
- optional candidate profile placeholder

#### Output

- session id
- initial session state

### 9.2 StartInterviewUseCase

Starts the session and returns the opening interviewer message.

#### Responsibilities

- mark session as active
- select first question
- append assistant turn
- return response

### 9.3 ProcessInterviewTurnUseCase

Core use case for each candidate turn.

#### Responsibilities

1. load session
2. validate active status
3. append candidate turn
4. classify candidate intent
5. decide next action
6. generate assistant response
7. update memory
8. update stage if needed
9. append assistant turn
10. persist session
11. return structured result

### 9.4 CompleteInterviewUseCase

Ends the interview and generates summary.

---

## 10. API Contract

### 10.1 Create session

`POST /api/live-interview/sessions`

#### Request

```json
{
  "mode": "MIXED",
  "roleContext": {
    "targetRole": "Product Manager",
    "seniority": "Mid-Level"
  },
  "config": {
    "maxTurns": 20
  }
}
```

#### Response

```json
{
  "sessionId": "sess_001",
  "status": "CREATED",
  "stage": "INTRO"
}
```

### 10.2 Start session

`POST /api/live-interview/sessions/:sessionId/start`

#### Response

```json
{
  "sessionId": "sess_001",
  "status": "ACTIVE",
  "stage": "WARMUP",
  "assistantMessage": "Let's begin. Can you briefly walk me through your background and how it led you to this role?"
}
```

### 10.3 Respond in session

`POST /api/live-interview/sessions/:sessionId/respond`

#### Request

```json
{
  "userMessage": "I started in operations, then moved into product where I led onboarding improvements."
}
```

#### Response

```json
{
  "sessionId": "sess_001",
  "assistantMessage": "What specifically did you own in those onboarding improvements, and how did you measure success?",
  "nextAction": "ASK_FOLLOW_UP",
  "stage": "CORE_EXPERIENCE",
  "memoryUpdate": {
    "claimsCaptured": [
      "Moved from operations into product",
      "Led onboarding improvements"
    ],
    "themesCovered": [
      "career progression",
      "ownership"
    ],
    "openLoops": [
      "metrics",
      "scope depth"
    ]
  }
}
```

### 10.4 Complete session

`POST /api/live-interview/sessions/:sessionId/complete`

#### Response

```json
{
  "sessionId": "sess_001",
  "status": "COMPLETED",
  "summary": {
    "summary": "The candidate showed credible ownership and product thinking, but several answers lacked measurable impact and detailed tradeoff reasoning.",
    "strengths": [
      "Clear ownership language",
      "Relevant examples",
      "Comfortable communication"
    ],
    "weaknesses": [
      "Limited metrics",
      "Some answers were too general"
    ],
    "nextFocus": [
      "Use stronger impact quantification",
      "Prepare deeper decision-making examples"
    ]
  }
}
```

---

## 11. Decision Logic Design

### 11.1 Processing rules

For each candidate message, the engine should answer:

1. Is the user answering the question?
2. Is the user asking for clarification?
3. Is the user asking a candidate-side question?
4. Is the current answer weak, partial, or strong enough?
5. Is there an open loop worth probing?
6. Is it time to advance stage?
7. Is the interview close to completion?

### 11.2 Action priority

Recommended action priority:

1. `PROVIDE_CLARIFICATION`
2. `ANSWER_CANDIDATE_QUESTION`
3. `ASK_FOLLOW_UP`
4. `ASK_MAIN_QUESTION`
5. `CLOSE_INTERVIEW`

This helps preserve coherence and handle immediate conversational needs first.

---

## 12. Intent Detection Rules

### Clarification indicators

Examples:

- "Can you repeat the question?"
- "What do you mean?"
- "Can you clarify?"
- "Are you asking about my current role or previous role?"

### Candidate-question indicators

Examples:

- message ends with a question mark and refers to interviewer intent
- "What kind of example are you looking for?"
- "Should I focus on a technical example?"
- "Does this role involve stakeholder management?"

### Mixed intent indicators

Examples:

- partial answer followed by question
- answer plus request for clarification

Example:

> "I led the migration, but do you want me to focus more on the technical side or the coordination side?"

This should be classified as `MIXED`.

---

## 13. Follow-Up Strategy

### When to ask a follow-up

Ask a follow-up if:

- the answer is vague
- the answer lacks evidence
- the answer lacks metrics
- the answer suggests real depth not yet explored
- an open loop exists in memory
- the answer avoids the core of the question

### Follow-up categories

- ownership depth
- impact metrics
- tradeoff reasoning
- stakeholder handling
- technical detail
- conflict or challenge
- prioritization logic

### v1 recommendation

Cap consecutive follow-ups to avoid interrogation loops.

Suggested limit:

- `maxFollowUpsPerTopic = 2`

---

## 14. Session Memory Rules

After each candidate turn, update:

- new factual claims
- examples already used
- themes covered
- positive signals
- negative signals
- open loops to revisit

### Example

If candidate says:

> "I led a migration across three teams and reduced onboarding time by 20%."

Memory update should capture:

- claim: led migration across three teams
- signal: cross-functional ownership
- signal: quantified impact
- example used: migration project
- theme covered: process improvement

---

## 15. Stage Transition Rules

### Suggested progression logic

- `INTRO` → `WARMUP` after session start
- `WARMUP` → `CORE_EXPERIENCE` after 1-2 turns
- `CORE_EXPERIENCE` → `DEEP_DIVE` when a strong example appears
- `DEEP_DIVE` → `CANDIDATE_QUESTIONS` near final third of turn budget
- `CANDIDATE_QUESTIONS` → `CLOSING` when candidate has no more questions or time is nearly complete

### Important rule

Stage transitions should be influenced by coverage, not only by turn count.

---

## 16. Summary Generation

### v1 summary structure

Generate:

- overall summary
- strengths
- weaknesses
- next practice focus

### Summary source inputs

- transcript
- memory
- repeated weak signals
- repeated strong signals
- unresolved open loops

### v1 recommendation

Use deterministic summarization templates or lightweight LLM summary with strict schema output.

---

## 17. Error Handling

### Cases to handle

- invalid session id
- session not active
- session already completed
- empty candidate message
- unsupported mode
- repository failure

### Required behavior

Return stable error responses and never silently corrupt session state.

#### Example error shape

```json
{
  "error": {
    "code": "SESSION_NOT_ACTIVE",
    "message": "This interview session is not active."
  }
}
```

---

## 18. Testing Plan

### 18.1 Unit tests

Must cover:

- intent classification
- next-action decision logic
- stage transitions
- follow-up eligibility
- memory updates
- summary generation shape

### 18.2 Integration tests

Must cover:

- session creation + start + respond + complete
- clarification flow
- candidate-question flow
- mixed-intent flow
- repeated follow-up prevention
- clean closing behavior

### 18.3 Transcript scenario tests

Create transcript fixtures representing:

- strong concise candidate
- vague candidate
- candidate who asks many clarifying questions
- candidate with mixed intent
- off-topic candidate
- candidate with strong behavioral examples

This is important because interview products fail in transcripts, not in architecture diagrams.

---

## 19. Validation Plan

### Product validation questions

- Does the conversation feel like a real interview?
- Does the interviewer stay in role?
- Are follow-ups relevant and useful?
- Does the flow remain coherent across turns?
- Does the candidate feel challenged, but not confused?

### Review method

Manually inspect transcripts and score:

- realism
- coherence
- interviewer discipline
- memory consistency
- follow-up quality
- non-chatbot behavior

### Suggested rating scale

1 to 5 for each dimension.

---

## 20. Suggested Task Breakdown

### Phase 1. Domain and contracts

- define enums
- define session model
- define memory model
- define summary model
- define DTOs
- define repository interface

### Phase 2. Session lifecycle

- implement create session
- implement start session
- implement complete session
- implement in-memory repository

### Phase 3. Turn engine

- implement process turn use case
- append transcript turns
- classify intent
- decide next action
- generate assistant message

### Phase 4. Memory and summary

- implement memory updates
- implement summary generator
- wire complete session output

### Phase 5. Validation

- unit tests
- integration tests
- transcript scenario tests
- transcript review pass

---

## 21. Suggested Initial File List

```text
src/modules/live-interview/domain/models/interview-session.ts
src/modules/live-interview/domain/models/interview-turn.ts
src/modules/live-interview/domain/models/interview-summary.ts
src/modules/live-interview/domain/value-objects/interview-stage.ts
src/modules/live-interview/domain/value-objects/candidate-intent.ts
src/modules/live-interview/domain/value-objects/next-action.ts

src/modules/live-interview/application/use-cases/create-interview-session.ts
src/modules/live-interview/application/use-cases/start-interview.ts
src/modules/live-interview/application/use-cases/process-interview-turn.ts
src/modules/live-interview/application/use-cases/complete-interview.ts

src/modules/live-interview/domain/services/candidate-intent-classifier.ts
src/modules/live-interview/domain/services/next-action-decider.ts
src/modules/live-interview/domain/services/question-selector.ts
src/modules/live-interview/domain/services/follow-up-generator.ts
src/modules/live-interview/domain/services/clarification-handler.ts
src/modules/live-interview/domain/services/candidate-question-handler.ts
src/modules/live-interview/domain/services/memory-manager.ts
src/modules/live-interview/domain/services/summary-generator.ts

src/modules/live-interview/infrastructure/repositories/in-memory-session-repository.ts
src/modules/live-interview/interfaces/http/live-interview-controller.ts
src/modules/live-interview/tests/integration/live-interview.spec.ts
```

---

## 22. Acceptance Criteria

The implementation is acceptable for v1 if:

- a developer can create and start a session
- the system can process candidate turns reliably
- clarification requests are handled correctly
- candidate questions are handled in-role
- follow-ups react to answer quality
- session memory updates across turns
- the interview closes in a controlled way
- the summary output is generated
- transcript scenario tests pass
- the system does not drift into generic chatbot behavior

---

## 23. Recommended Next Step After This Plan

After this implementation plan, the most sensible next repo artifact is:

`docs/features/live-interview-validation-rubric.md`

That document should define:

- transcript review criteria
- realism scoring
- interviewer-role consistency rules
- failure examples
- acceptance thresholds for launch readiness

---

## 24. One-Sentence Summary

This implementation plan turns Live Interview from a product idea into a modular backend system that can run structured, adaptive, interviewer-style conversations in a repo-ready way.
