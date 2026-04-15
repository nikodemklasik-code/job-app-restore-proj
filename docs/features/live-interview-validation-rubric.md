# Live Interview Validation Rubric
**Status:** Proposed  
**Priority:** P0  
**Product:** English-first Real Conversational Interviewer  
**Purpose:** Production Readiness Validation

---

## 1. Goal

This rubric defines how to evaluate whether the **Live Interview** experience is good enough for production in its current phase.

The product must be validated based on **transcript quality and interviewer behavior**, not just on UI polish or avatar presentation.

---

## 2. Validation Principle

A polished interface is not proof of a strong product.

Production readiness must be judged by whether the system behaves like a credible interviewer:
- stays in role
- asks relevant questions
- reacts intelligently to candidate answers
- handles clarification and candidate questions correctly
- maintains session continuity
- ends the interview coherently

---

## 3. What is being evaluated

We are evaluating the **core interview experience**, specifically:
- interviewer realism
- transcript coherence
- follow-up quality
- clarification handling
- candidate-question handling
- session memory
- stage progression
- closing quality

The avatar is only a supporting layer and is not the main validation target.

---

## 4. Evaluation Dimensions

Each transcript should be scored from **1 to 5** on the following dimensions.

### 4.1 Interviewer Role Discipline
Does the system behave like an interviewer rather than a generic assistant?

#### Score guidance
- **1** = clearly chatbot-like, breaks role often
- **2** = mostly assistant-like, weak interviewer identity
- **3** = mixed, sometimes feels like interviewer
- **4** = mostly consistent interviewer behavior
- **5** = strongly consistent interviewer behavior throughout

#### Failure signals
- overexplains like a tutor
- gives coaching instead of interviewing
- becomes overly supportive or conversational
- stops driving the interview

---

### 4.2 Question Relevance
Are the questions appropriate to the interview context and candidate response?

#### Score guidance
- **1** = irrelevant or random
- **2** = often weak or disconnected
- **3** = acceptable but uneven
- **4** = mostly relevant
- **5** = highly relevant and well targeted

#### Failure signals
- repeated generic questions
- follow-ups unrelated to previous answer
- poor use of context
- questions that ignore what candidate just said

---

### 4.3 Follow-Up Quality
Do follow-ups probe useful depth rather than repeating formulaic prompts?

#### Score guidance
- **1** = repetitive, shallow, or broken
- **2** = weak probing, little value
- **3** = partially useful
- **4** = good probing in most cases
- **5** = strong, natural, targeted follow-ups

#### Failure signals
- repeated "can you elaborate?" loops
- no pressure on vague answers
- failure to probe obvious depth areas
- excessive interrogation without purpose

---

### 4.4 Clarification Handling
Does the system handle clarification requests cleanly and return to the interview?

#### Score guidance
- **1** = fails or derails
- **2** = confusing or overly long
- **3** = workable but awkward
- **4** = clear and controlled
- **5** = concise, natural, and in-role

#### Failure signals
- gives long explanatory monologues
- loses the interview thread
- answers like a help bot
- fails to restate intent of original question

---

### 4.5 Candidate-Question Handling
Does the system answer candidate questions without abandoning interviewer role?

#### Score guidance
- **1** = mishandles or ignores
- **2** = answers poorly or breaks flow
- **3** = acceptable but weakly controlled
- **4** = handles well
- **5** = handles naturally and redirects cleanly

#### Failure signals
- switches into assistant mode
- gives overlong guidance
- forgets to return to interview flow
- answers in a way that removes interview pressure entirely

---

### 4.6 Session Memory
Does the system remember prior claims, examples, and open loops?

#### Score guidance
- **1** = forgets major context
- **2** = frequent memory inconsistency
- **3** = basic continuity only
- **4** = good continuity
- **5** = strong memory-backed conversation

#### Failure signals
- asks for information already given
- reopens already resolved threads without purpose
- forgets prior examples
- contradicts earlier session state

---

### 4.7 Session Coherence
Does the interview feel like one connected conversation rather than isolated turns?

#### Score guidance
- **1** = fragmented and incoherent
- **2** = weak continuity
- **3** = partially coherent
- **4** = mostly coherent
- **5** = highly coherent throughout

#### Failure signals
- abrupt topic jumps
- no visible progression
- disconnected follow-ups
- sudden unexplained stage changes

---

### 4.8 Stage Progression
Does the interview move through stages in a believable and useful way?

#### Score guidance
- **1** = no meaningful progression
- **2** = progression feels random
- **3** = some structure but weak control
- **4** = clear and sensible progression
- **5** = smooth and well-paced progression

#### Failure signals
- stays too long in warmup
- deep dive never happens
- candidate questions appear at odd moments
- abrupt closing without coverage

---

### 4.9 Closing Quality
Does the interview close in a controlled, professional way?

#### Score guidance
- **1** = broken or abrupt
- **2** = weak ending
- **3** = acceptable but generic
- **4** = clear and appropriate
- **5** = natural, controlled, and complete

#### Failure signals
- no clear end
- sudden stop
- repeats earlier questions near closing
- no sense of completion

---

## 5. Hard Failure Conditions

A transcript should automatically fail validation if any of the following occurs:
- the system behaves primarily like a chatbot rather than an interviewer
- the system repeatedly forgets key information already given
- clarification handling consistently breaks flow
- candidate questions derail the interview
- follow-ups become obviously repetitive
- the session has no coherent progression
- the closing is broken or missing

Even if the avatar looks polished. Because cosmetics are not competence.

---

## 6. Minimum Production Threshold

To be considered production-ready for this phase:

### Required conditions
- no hard failure conditions
- average score of **4.0 or higher** across all dimensions
- no individual score below **3** in:
  - Interviewer Role Discipline
  - Follow-Up Quality
  - Session Memory
  - Session Coherence

### Strong launch-ready target
- average score of **4.3 or higher**
- Interviewer Role Discipline score of **4 or higher**
- Follow-Up Quality score of **4 or higher**
- Candidate-Question Handling score of **4 or higher**

---

## 7. Transcript Test Set Requirements

Validation should include a diverse transcript set covering at least:

- strong concise candidate
- vague candidate
- overly broad candidate
- candidate asking clarification questions
- candidate asking role-side questions
- candidate mixing answer + question
- candidate repeating same example too often
- candidate going partially off-topic
- candidate with strong behavioral depth
- candidate with weak quantification

---

## 8. Review Process

### Step 1
Collect transcript samples from predefined scenario fixtures.

### Step 2
Have each transcript reviewed by at least one product/engineering reviewer.

### Step 3
Score every evaluation dimension from 1 to 5.

### Step 4
Record scores, hard failure flags, notable examples, and transcript excerpts.

### Step 5
Aggregate findings across the validation set.

### Step 6
Decide: pass / pass with fixes / fail.

---

## 9. Review Template

### Transcript Metadata
- Scenario:
- Mode:
- Number of turns:
- Reviewer:
- Date:

### Scores
- Interviewer Role Discipline:
- Question Relevance:
- Follow-Up Quality:
- Clarification Handling:
- Candidate-Question Handling:
- Session Memory:
- Session Coherence:
- Stage Progression:
- Closing Quality:

### Hard Failure Check
- Chatbot drift:
- Memory failure:
- Clarification breakdown:
- Candidate-question derailment:
- Repetition loop:
- Broken progression:
- Broken closing:

### Notes
- Strong moments:
- Weak moments:
- Most serious issue:
- Recommendation:

---

## 10. Example Failure Patterns

### Failure Pattern A: Chatbot Drift
Candidate asks for clarification. System gives a long educational explanation, then offers coaching advice instead of continuing the interview.

### Failure Pattern B: Memory Failure
Candidate mentions a migration example in turn 3. System later asks for a major cross-functional example as if nothing had been discussed.

### Failure Pattern C: Weak Follow-Up
Candidate gives a vague answer. System responds with another generic main question instead of probing the weakness.

### Failure Pattern D: Repetition Loop
System repeatedly asks "Can you elaborate?" / "Can you explain more?" without changing probe direction.

### Failure Pattern E: Broken Closing
Interview stops abruptly without a closing remark or transition.

---

## 11. Example Strong Patterns

### Strong Pattern A: Targeted Follow-Up
Candidate mentions a migration across three teams. System probes tradeoff decisions, stakeholder conflict, and measurable impact.

### Strong Pattern B: Controlled Clarification
Candidate asks what kind of example is expected. System clarifies briefly and returns directly to the interview question.

### Strong Pattern C: Memory-Based Continuity
System references a prior example appropriately and asks the candidate to compare it with another situation.

### Strong Pattern D: Stage-Aware Closing
The system recognizes coverage is sufficient, offers a short closing transition, and ends the session cleanly.

---

## 12. Production Readiness Decision Rule

### Pass
- no hard failures
- threshold met
- transcript set shows stable interviewer behavior

### Pass with fixes
- no catastrophic failures
- threshold nearly met
- limited set of clear fixes identified

### Fail
- hard failures present
- average score too low
- multiple transcripts show chatbot drift or weak continuity

---

## 13. Final Principle

The product should be considered ready only when the conversation itself feels credible.

A better avatar cannot rescue a weak interviewer.

---

## 14. One-Sentence Summary

This rubric defines production readiness for Live Interview based on transcript quality, interviewer realism, and behavioral consistency rather than visual polish alone.
