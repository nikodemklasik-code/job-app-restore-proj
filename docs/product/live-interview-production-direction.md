# Live Interview Production Direction
**Status:** Approved Direction  
**Priority:** P0  
**Product:** English-first Real Conversational Interviewer  
**Audience:** Product, Engineering, Design  
**Decision Type:** Production Product Direction

---

## 1. Executive Decision

We will treat **Live Interview** as the core product and move the app toward a production-ready interview experience.

The current 2D SVG avatar will be retained as the visual presentation layer for now. We will improve it incrementally, but we will **not** rebuild the avatar system as the main priority.

The main investment will go into the **interview engine**, because product value comes from the quality of the interview interaction, not from avatar complexity alone.

### Final direction
- keep the current SVG avatar
- improve avatar state quality and interaction feel
- prioritize the live interview engine
- treat richer avatar technology as a later enhancement, not a production blocker

---

## 2. Product Truth

This product is **not** an avatar product.

This product is **not** a generic chatbot with a face.

This product is a **Real Conversational Interviewer** with an avatar-based interface.

That means the real product value must come from:
- coherent interview flow
- interviewer-style behavior
- relevant follow-up questions
- clarification handling
- candidate-question handling
- session memory
- realistic interview continuity

The avatar can improve presence and perceived polish, but it is not the core differentiator.

---

## 3. Current State

The app already includes a lightweight custom-built 2D humanoid avatar:
- inline SVG
- CSS keyframe animation
- visual states such as `idle`, `speaking`, `listening`, `thinking`
- pulse/ring feedback
- simple audio-like visual feedback
- webcam preview for the user

This is sufficient as an MVP presentation layer.

### Current interpretation
The avatar is good enough to support production development **if** the interview engine underneath becomes strong enough.

---

## 4. Production Direction

### 4.1 What we are doing now

We are moving toward a production-ready **Live Interview** product with:
- structured interview sessions
- adaptive interviewer behavior
- staged interview flow
- candidate intent detection
- follow-up logic
- clarification handling
- candidate-question handling
- session memory
- end-of-session summary

### 4.2 What we are not doing now

We are not making the following a priority for current production readiness:
- full avatar replacement
- Lottie-based humanoid pipeline
- 3D avatar system
- Spine / rigged motion system
- advanced facial animation framework
- avatar-first rebuild

Those are optional future upgrades, not current product-critical work.

---

## 5. Why this direction is correct

### 5.1 Better ROI
Improving the interview engine creates direct product value.  
Improving the avatar mostly improves packaging.

### 5.2 Lower implementation risk
Keeping the current avatar avoids unnecessary front-end refactor and integration cost.

### 5.3 Faster path to production
The current UI is already enough to support a convincing MVP if the behavior layer is strong.

### 5.4 Better product identity
This keeps the product centered on interview quality, not visual novelty.

---

## 6. Production Product Principles

1. **Interview quality is the product**  
   The system must feel like a real interviewer.

2. **Avatar supports, not defines**  
   The avatar is a wrapper around the interview experience.

3. **Polish should not replace intelligence**  
   Visual polish is useful, but must not displace core behavior work.

4. **Stateful conversation matters**  
   The interviewer must react to context, not generate isolated replies.

5. **Production means controlled behavior**  
   The system must remain coherent, role-consistent, and testable.

---

## 7. Product Scope for Production Phase 1

### P0: Core production scope
These items are required for a credible production-ready Live Interview experience.

#### Interview engine
- session creation
- session lifecycle
- interview stage model
- next-action decision engine
- question sequencing
- follow-up generation
- clarification handling
- candidate-question handling
- session memory
- controlled interview closing
- end-of-session summary

#### API / backend quality
- stable contracts
- repository abstraction
- transcript logging
- deterministic fallback behavior
- structured error handling

#### Product behavior quality
- interviewer role discipline
- reduced chatbot drift
- transcript coherence
- repetition control
- stage-aware progression

---

## 8. Visual Scope for Production Phase 1

### P1: Avatar polish without stack replacement
We will improve the current avatar only within the existing lightweight stack.

### In scope
- smoother transitions between `idle`, `listening`, `thinking`, and `speaking`
- improved timing and easing
- better ring/audio-reactive feedback
- more coherent state switching
- subtle expressive variance
- stronger visual synchronization with turn-taking

### Out of scope
- replacing SVG avatar architecture
- full Lottie migration
- 3D embodiment
- advanced rigged character pipeline

### Principle
The avatar should feel more polished, but remain cheap, stable, and easy to maintain.

---

## 9. Product Architecture View

```text
Presentation Layer
- SVG Avatar
- Webcam view
- Interview screen UI
- State indicators

Interaction Layer
- user text / microphone input
- turn-taking feedback
- speaking / listening / thinking state control

Core Interview Engine
- session state
- interview stages
- intent detection
- next action decision
- question selection
- follow-up generation
- clarification handling
- candidate-question handling
- session memory
- summary generation
```

This architecture reflects the actual product hierarchy.
The avatar is on top.
The interview engine is the product core.

---

## 10. Production Priorities

### P0

#### Live Interview Engine

Highest priority.

Required:

- strong session control
- good follow-up behavior
- coherent interviewer tone
- memory-backed conversation continuity
- realistic interview flow

### P1

#### Avatar Interaction Polish

Second priority.

Required:

- improve perceived liveliness
- improve state transitions
- improve UX feel

### P2

#### Voice Layer

Future priority.

Potential:

- speech input
- speech output
- better conversational pacing

### P3

#### Richer Avatar System

Optional future layer.

Only worth doing after:

- interview engine quality is proven
- users respond positively to the live interview experience
- stronger visual embodiment is justified by product or commercial goals

---

## 11. Production Risks

### Risk 1. Avatar distraction

The team may overinvest in animation and underinvest in interview quality.

**Mitigation:**
Keep avatar work explicitly limited to polish, not rebuild.

### Risk 2. Chatbot drift

If the engine is weak, the product will feel like a generic assistant behind a face.

**Mitigation:**
Make interviewer behavior rules and transcript validation part of P0.

### Risk 3. False sense of readiness

A polished UI may hide weak interview logic.

**Mitigation:**
Evaluate production readiness through transcript quality, not visual appearance alone.

### Risk 4. Front-end refactor waste

Replacing the avatar stack too early may consume resources without improving core value.

**Mitigation:**
Delay avatar system replacement until product behavior is validated.

---

## 12. Production Acceptance Criteria

The product is production-ready for this phase when:

### Interview behavior

- the system behaves like an interviewer, not a chatbot
- follow-ups are relevant
- clarification handling works
- candidate-question handling works
- session flow remains coherent
- memory works across turns
- the interview closes cleanly

### UX / visual layer

- avatar states visibly support the interaction
- state transitions feel intentional
- UI communicates live-interview presence
- the visual layer does not feel broken or distracting

### Technical quality

- core APIs are stable
- session state is reliable
- transcripts can be reviewed and validated
- failure cases are handled safely

---

## 13. Explicit Decision

We are **not** choosing a richer avatar stack as the main production path.

We are choosing:

**Current SVG avatar + production-grade interview engine + lightweight avatar polish**

This is the most efficient path to a product that is both:

- credible
- visually acceptable
- meaningfully differentiated

---

## 14. Recommended Immediate Next Steps

### Step 1

Lock the product decision:

- Live Interview is the core
- avatar is the presentation layer

### Step 2

Implement the production interview engine roadmap:

- next-action engine
- memory
- follow-ups
- clarification handling
- candidate-question handling
- summary generation

### Step 3

Polish the current avatar within the existing stack:

- state transitions
- timing and motion quality
- expressive polish
- better turn-taking feedback

### Step 4

Validate the product through transcript quality, not only UI polish.

---

## 15. One-Sentence Summary

The production path is to keep the current SVG avatar, improve it only as a lightweight presentation layer, and focus the main product investment on building a strong, production-grade Live Interview engine.
