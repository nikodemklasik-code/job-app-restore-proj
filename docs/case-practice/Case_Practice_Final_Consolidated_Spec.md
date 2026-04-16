# Case Practice Final Consolidated Spec

## Module Name
**Case Practice**

## Working Definition
**Case Practice** is a dynamic AI-powered workplace simulation system where realistic professional cases arrive in real time and the user decides whether to respond solo, join a joint call, open a private session, or prepare a position for tomorrow.

## Product Definition
Case Practice is not a static exercise library. It is a living practice space where workplace situations appear with pressure, ambiguity, and consequence, and where the user learns how to explain, defend, negotiate, mediate, organise facts, set boundaries, and protect their position clearly and credibly.

## Final Product Statement
**A dynamic AI practice space where realistic workplace cases arrive with pressure, ambiguity, and consequences, and where outcomes depend not on a hidden correct answer, but on how clearly, credibly, and persuasively the user builds and protects their position.**

---

## 1. Core User Value
Case Practice should help users improve:
- **Position Clarity**
- **Fact Discipline**
- **Boundary Competence**
- **Conflict Handling**
- **Mediation Readiness**
- **Pressure Stability**
- **Professional Self-Advocacy**
- **Decision Defence**
- **Fairness Framing**
- **Outcome Orientation**

## 2. What This Module Is Not
Case Practice is not:
- a legal advice product
- a pure interview simulator
- a score-based school exercise
- a fixed-answer training system
- a personality judgement tool
- a toy roleplay feature with no real transfer value

---

## 3. Product Experience Principle
### Cases Arrive, They Are Not Chosen Like Toys
The module should feel like realistic professional reality entering the user’s day.

It should not behave like:
- “Choose Scenario”
- “Press Start”
- “Get Score”

It should behave like:
- event
- situation
- pressure
- decision
- consequence
- reflection

Cases should enter through:
- **Case Inbox**
- **Push Notification**
- **Internal Notification Feed**
- **Private Session Invite**
- **Similar Practice Prompt**

For each case, the user may choose:
- **Play Solo**
- **Join Joint Call**
- **Open Private Session**
- **Prepare For Tomorrow**
- **Save For Later**
- **Dismiss**

---

## 4. Outcome Logic And Evaluation Principles

### No Predetermined Outcome Principle
Case outcomes must not be predetermined.

The system must not assume:
- a fixed winner
- a fixed moral conclusion
- a fixed “correct side”
- a hidden answer key

Outcomes should depend on:
- **Factual Coherence**
- **Clarity Of Position**
- **Reasoning Quality**
- **Persuasiveness**
- **Rhetorical Control**
- **Response To Pushback**
- **Pressure Stability**
- **Boundary Clarity**
- **Timing And Escalation Judgement**
- **Legal Or Procedural Reasoning**, where relevant

A strong case may still fail if presented weakly.
A weak case may sound strong if presented persuasively.

The AI must distinguish between:
- **Strength Of The Case**
- **Strength Of The Argument**
- **Strength Of The Delivery**

The system must reward real case-building, not prompt-guessing.

### Outcome Determination Principle
Case outcomes should be determined dynamically.

The system should evaluate:
- how the user organises facts
- how the user names the core issue
- how the user defines and protects their position
- how the user responds to challenge
- how the user handles pressure, ambiguity, and contradiction
- how the user adjusts when the conversation shifts
- whether the user moves the conversation toward a stronger, clearer, more credible position

A case may result in:
- **You Convinced Me**
- **You Almost Convinced Me**
- **You Did Not Convince Me**
- **You Protected Your Position**
- **You Reached A Constructive Outcome**
- **You Escalated Too Early**
- **You Left The Core Issue Unnamed**
- **Your Position Is Ready**
- **Your Position Is Not Clear Yet**

### Legal And Common-Sense Reasoning Rule
In legally or procedurally sensitive cases, the system may recognise stronger legal or procedural reasoning where relevant, but it must not require formal legal language in order to recognise a strong case.

A case may be argued well through:
- legal reasoning
- procedural reasoning
- fairness reasoning
- consistency reasoning
- practical workplace logic
- clear common-sense argumentation

The system should reward arguments that are:
- coherent
- specific
- fair
- well-structured
- contextually persuasive

Formal legal precision may strengthen a case, but it is not the only valid route to a strong case outcome.

### Evaluation Distinction Rule
The AI must distinguish between:
- **Strength Of The Case**
- **Strength Of The Argument**
- **Strength Of The Delivery**

Possible evaluation patterns:
- **Strong Case, Weak Delivery**
- **Weak Case, Strong Delivery**
- **Strong Case, Strong Delivery**
- **Weak Case, Weak Delivery**

### Success State Taxonomy
Case Practice should recognise multiple forms of success.

A session may be successful because the user:
- convinced the other side
- protected their position
- named the issue clearly
- reached a constructive outcome
- stayed coherent under pressure
- avoided unnecessary escalation
- set a boundary clearly
- made a sound decision
- prepared a usable position for tomorrow

Success is not limited to:
- winning
- getting agreement
- dominating the exchange

A strong session may also be one in which the user:
- did not get the exact desired outcome
- but stayed clear, credible, and professionally grounded

---

## 5. Psychological Reality Layer
The system should evaluate not only what the user says, but how the user behaves under pressure.

This includes detecting patterns such as:
- avoidance of the core issue
- over-defensiveness
- collapse of structure under challenge
- fawning or over-accommodation
- aggressive overcorrection
- grounded authority
- emotional drift
- premature escalation
- delayed boundary-setting

These patterns must never be framed as personality judgements.

They should be framed as:
- behavioural response patterns in the current interaction
- communication tendencies under pressure
- trainable interaction habits

The AI must never say:
- “you are weak”
- “you are anxious”
- “you are not assertive enough”

It may say:
- “your position became harder to hear under pressure”
- “the main issue remained implied rather than stated”
- “your boundary became softer as the interaction intensified”
- “your structure held well even after pushback”

---

## 6. Case Entry And Session Modes
### Main Entry Sources
- **Case Inbox**
- **Push Notification**
- **Internal Notification Feed**
- **Private Session Invite**
- **Similar Practice Prompt**

### Session Modes
- **Play Solo**
- **Join Joint Call**
- **Open Private Session**
- **Prepare For Tomorrow**

### Similar Practice Trigger
If multiple users are active at the same time with compatible case types and pressure conditions, show:
**A Similar Player Is Available Right Now**

Options:
- **Join Joint Call**
- **Stay In Solo Mode**
- **Open Private Session**

This is an invitation, not a requirement.

### Shared Session Sizes
- 2 players
- 3 players
- 4 players

---

## 7. Main Screens

### 7.1 Case Inbox
**Purpose:** Primary entry screen for incoming, active, and saved workplace cases.

**Sections:**
- **New Cases**
- **Live Opportunities**
- **Private Invitations**
- **Tomorrow Cases**
- **Saved Cases**
- **Completed Cases**

**Case Card Fields:**
- **Case Title**
- **Case Type**
- **Pressure Intensity**
- **Pressure Type**
- **Estimated Time**
- **Live Availability**
- **Skills Practised**
- **Signals This Case Can Strengthen**
- **Urgency Tag**
- **Case Status**

**Pressure Model:**
- **Pressure Intensity:** Low / Medium / High
- **Pressure Type:**
  - **Time Pressure**
  - **Emotional Pressure**
  - **Credibility Pressure**
  - **Contradiction Pressure**
  - **Authority Pressure**

**Primary CTA:**
- **Play Solo**
- **Join Joint Call**
- **Open Private Session**
- **Prepare For Tomorrow**
- **Save For Later**
- **Dismiss**

### 7.2 Case Detail
**Purpose:** Show case context and stakes before the user begins.

**Sections:**
- **Quick Case Note**
- **Your Objective**
- **Who You Are Speaking To**
- **What Is At Stake**
- **Pressure Conditions**
- **Suggested Focus**

**Suggested Focus Rule:** 1 to 2 priorities maximum.

Examples:
- **State The Concern Earlier**
- **Keep The Facts Separate From The Interpretation**
- **Name Your Boundary Sooner**
- **Lead With The Outcome**

**CTA:**
- **Start Case**
- **Prepare First**
- **Join Live**
- **Invite Someone**
- **Save For Later**

### 7.3 Role Brief
**Purpose:** Explain the user’s role in the interaction.

**Supported Roles:**
- **Speaker**
- **Challenger**
- **Observer**
- **Moderator**
- **Mediator**

**Structure:**
- **Your Role**
- **Your Objective**
- **What You Should Focus On**
- **What You Should Avoid**

### 7.4 Preparation
**Purpose:** Allow the user to structure thoughts before responding.

**Modes:**
- **Quick Preparation**
- **Structured Preparation**
- **Tomorrow Preparation**

**Sections:**
- **Fact Timeline**
- **Core Issue**
- **My Position**
- **My Desired Outcome**
- **My First Sentence**
- **What I Must Not Forget**
- **Possible Pushback**
- **My Best Evidence**

**CTA:**
- **Continue To Response**
- **Ask AI For Structure**
- **Refine First Sentence**
- **Save Draft**
- **Continue Tomorrow**

### 7.5 Live Response
**Purpose:** Main interaction screen where the user responds.

**Modes:**
- text
- voice
- live joint call
- private session

**Sections:**
- **Case Context**
- **Active Prompt**
- **Your Response**
- **Time Remaining**
- **Round Status**

**CTA:**
- **Submit Response**
- **Pause**
- **Ask For Clarification**
- **Continue**

### 7.6 Pushback Round
**Purpose:** Increase pressure and test stability.

**Pushback Types:**
- doubt
- contradiction
- scepticism
- request for evidence
- challenge to boundary
- emotional pressure
- time pressure
- fairness question

**Example Pushback:**
- “That still does not explain the key issue.”
- “You described the background, but not the actual concern.”
- “Why was that the right decision?”
- “What exactly do you want to happen now?”
- “I still do not know where your boundary is.”

**CTA:**
- **Respond**
- **Reframe**
- **Answer Directly**
- **Move To Final Response**

### 7.7 Joint Call Prompt
**Purpose:** Offer optional live shared practice.

**Prompt Copy:**
**A Similar Player Is Available Right Now**
**Would You Like To Join A Joint Call For A Related Case?**

**Options:**
- **Join Joint Call**
- **Stay In Solo Mode**
- **Open Private Session**

### 7.8 Verdict
**Purpose:** Deliver a human-style outcome, not a numeric score.

**Valid Outcomes:**
- **You Convinced Me**
- **You Almost Convinced Me**
- **You Did Not Convince Me**
- **You Protected Your Position**
- **You Reached A Constructive Outcome**
- **You Escalated Too Early**
- **You Left The Core Issue Unnamed**
- **You Had A Strong Case But Presented It Weakly**
- **Your Reasoning Was Sound, But Your Delivery Reduced Its Force**
- **Your Position Is Ready**
- **Your Position Is Not Clear Yet**

**Sections:**
- **Verdict**
- **Because**
- **What Helped**
- **What Weakened Your Position**
- **What To Try Next Time**

### 7.9 Reflection
**Purpose:** Turn the session into learning and growth.

**Sections:**
- **What Worked**
- **What Weakened Your Position**
- **What To Try Next Time**
- **Suggested Related Practice**
- **Detected Growth Signals**

**CTA:**
- **Try A Similar Case**
- **Open Coach**
- **Open Negotiation**
- **Open Interview**
- **Save Insight**

---

## 8. Case Categories

### Explain What Happened
**Purpose:** Train chronology, credibility, and fact order.

### Defend Your Decision
**Purpose:** Train decision defence under pressure.

### Mediation
**Purpose:** Train resolution without self-erasure.

### Difficult Conversation
**Purpose:** Train direct, contained delivery of a hard truth.

### Boundary Setting
**Purpose:** Train refusal, limit-setting, and non-collapse.

### Prepare For Tomorrow
**Purpose:** Train structured preparation for a future meeting, hearing, or difficult conversation.

### Fair Treatment Concern
**Purpose:** Train naming and framing of unequal or unfair treatment.

### Reasonable Adjustments
**Purpose:** Train professional self-advocacy around workplace support and adjustments.

### Discrimination Concern
**Purpose:** Train careful, fact-based framing of potentially discriminatory treatment.

### Harassment Concern
**Purpose:** Train naming repeated harmful behaviour and preparing a structured response.

### Victimisation Concern
**Purpose:** Train speaking up about negative treatment after raising a concern.

### Sell Your Value
**Purpose:** Train persuasive self-positioning without collapse or arrogance.

---

## 9. AI Behaviour Model
### AI Functions
The AI may act as:
- **Challenger**
- **Observer**
- **Moderator**
- **Mediator**
- **Counterpart Listener**

### AI As Challenger
The AI should:
- pressure clarity
- expose vagueness
- test structure
- introduce pushback
- check resilience

### AI As Observer
The AI should:
- decide whether the position became convincing
- explain why
- distinguish case strength from delivery strength

### AI As Moderator
The AI should:
- pace rounds
- control timing
- maintain focus
- keep the exchange usable

### AI As Mediator
The AI should:
- reduce useless escalation
- clarify the real issue
- support constructive movement

### AI As Counterpart Listener
Possible roles:
- manager
- colleague
- recruiter
- stakeholder
- HR representative
- unhappy client
- neutral listener

### AI Role Separation Rule
The AI must not mix functions inside one round unless explicitly designed to do so.

---

## 10. AI Behavioural Pattern Detection
The AI should detect and describe patterns such as:

### Avoidance Pattern
- “You Avoided The Core Issue.”
- “You Described The Situation, But Did Not Name The Actual Concern.”
- “The Boundary Remained Implied Rather Than Stated.”

### Over-Defensiveness
- “You Protected Yourself, But Too Defensively.”
- “You Explained Too Much Before Stating Your Position.”
- “Your Message Weakened Before Your Main Point Arrived.”

### Collapse Under Pressure
- “Your Structure Broke Under Time Pressure.”
- “The Facts Became Harder To Follow Once Pressure Increased.”
- “You Stayed Engaged, But Your Position Became Less Clear.”

### Fawning / Over-Accommodation
- “You Stayed Polite, But Your Boundary Became Too Soft.”
- “You Protected The Relationship More Than Your Position.”
- “A Clearer No Would Have Been Stronger Here.”

### Aggressive Overcorrection
- “You Escalated Too Early.”
- “Your Frustration Overtook Your Structure.”
- “The Point Was Valid, But The Framing Became Harder To Receive.”

### Grounded Authority
- “You Sounded Credible.”
- “You Protected Your Position Without Escalating.”
- “Your Boundary Was Clear And Professionally Framed.”
- “You Stayed Specific Under Pressure.”

---

## 11. Feedback Model
Every session must end with:
- **Verdict**
- **Because**
- **What Helped**
- **What Weakened Your Position**
- **What To Try Next Time**
- **Suggested Related Practice**

### Example
**You Protected Your Position**

**Because**
- your boundary was clear
- your facts stayed coherent
- you did not over-explain

**What Helped**
- calm tone
- strong first sentence
- clear sequence

**What Weakened Your Position**
- you delayed the core concern
- your request arrived too late

**What To Try Next Time**
- lead with the issue
- shorten the setup
- state the outcome earlier

---

## 12. Growth And Shared Skill Signals
Case Practice must feed the shared skills and growth system.

### Signals This Module Can Strengthen
- **Boundary Setting**
- **Conflict Handling**
- **Pressure Stability**
- **Position Clarity**
- **Mediation Framing**
- **Fact Discipline**
- **Professional Self-Advocacy**
- **Decision Defence**
- **Fairness Framing**
- **Calm Pushback Handling**

### User-Facing Growth Insights
- “Your boundaries are clearer than in recent cases.”
- “You now reach the core issue faster.”
- “Your pressure responses are becoming more stable.”
- “You are stronger in mediation than in direct defence.”
- “You still tend to delay your first clear position.”

---

## 13. Game Mechanics Layer
Gamification must reinforce real learning rather than simulate progress.

### Streak
Definition: consecutive days in which the user completes at least one full case session.

Rules:
- grows only after a completed session
- does not grow after opening a case without meaningful completion
- should be displayed subtly
- growth messaging should be linked to observed behavioural change

### Pressure Rank
Definition: the level of pressure at which the user consistently performs well.

Suggested ranks:
- **Grounded**
- **Steady**
- **Resilient**
- **Pressure-Proof**

### Unlock Philosophy
Unlocks should reflect actual capability or repeated consistency, not empty repetition.

### Progress Communication
Avoid generic praise.
Use growth-linked messages such as:
- “Your structure is becoming faster under pressure.”
- “Your boundaries are clearer than before.”
- “You now recover more quickly after pushback.”

---

## 14. Shared Component Inventory
Minimum reusable frontend components:
- **PageHeader**
- **SectionHeader**
- **CaseCard**
- **PressureBadge**
- **SignalBadge**
- **RoleBriefCard**
- **PreparationPanel**
- **VerdictPanel**
- **ReflectionPanel**
- **EmptyState**
- **ErrorState**
- **LoadingState**
- **CTAGroup**
- **JointCallPrompt**
- **GrowthInsightBlock**
- **TimelineBlock**
- **ArgumentFocusBlock**

---

## 15. Neurodiversity-Aware Rules
The module should especially support users who:
- struggle with overload
- lose structure under pressure
- default to fawning
- need help building a first sentence
- need help organising facts clearly
- need coaching toward visible agency

The AI should:
- reduce overload
- reward first progress
- avoid shame
- help structure before escalation
- treat clarity as trainable, not innate

Good examples:
- “You already know what matters here. We need to make it easier to hear.”
- “The issue is real. The next step is to state it earlier and more clearly.”
- “You do not need a stronger emotion here. You need a clearer first sentence.”
- “Your position is valid. Let’s make it more visible.”

---

## 16. MVP Scope
### Required Screens
- **Case Inbox**
- **Case Detail**
- **Role Brief**
- **Preparation**
- **Live Response**
- **Pushback Round**
- **Joint Call Prompt**
- **Verdict**
- **Reflection**

### Required Modes
- **Play Solo**
- **Join Joint Call**
- **Open Private Session**
- **Prepare For Tomorrow**

### Required Case Types
- **Explain What Happened**
- **Defend Your Decision**
- **Mediation**
- **Boundary Setting**
- **Fair Treatment Concern**
- **Reasonable Adjustments**
- **Prepare For Tomorrow**
- **Speak Under Time Pressure**

### Required Outcomes
- **You Convinced Me**
- **You Almost Convinced Me**
- **You Did Not Convince Me**
- **You Protected Your Position**
- **You Reached A Constructive Outcome**
- **You Escalated Too Early**
- **You Had A Strong Case But Presented It Weakly**
- **Your Reasoning Was Sound, But Your Delivery Reduced Its Force**
- **Your Position Is Ready**
- **Your Position Is Not Clear Yet**

---

## 17. What Is Ready
- consolidated product definition
- outcome logic
- legal/common-sense reasoning rule
- psychological reality layer
- success taxonomy
- growth and signal capture
- screen inventory
- case category structure
- AI role model
- feedback model
- multiplayer invitation logic
- neurodiversity-aware rules
- MVP scope

## 18. What Is Still Missing
- screen-by-screen UI copy
- exact wireframe/layout decisions
- data model and backend entities
- API contracts
- AI prompt layer per role and case type
- moderation and safety rules for live/shared sessions
- notification timing rules
- state machine for case lifecycle

## 19. What Should Be Built First
1. **Case Inbox**
2. **Case Detail**
3. **Preparation**
4. **Live Response**
5. **Pushback Round**
6. **Verdict**
7. **Reflection**
8. shared components
9. AI role prompts
10. growth signal hooks
