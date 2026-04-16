# Legal, Safety, Compliance And Risk Layer

## Purpose
This section defines the legal, safety, compliance, moderation, privacy, and risk guardrails for the **Case Practice** module.

It exists to ensure that:
- the module remains a workplace practice and simulation system, not a legal advice product
- AI behavior stays within safe and supportable boundaries
- live and shared sessions are moderated responsibly
- sensitive cases are handled carefully
- product claims remain accurate and defensible
- escalation pathways are realistic, proportionate, and jurisdiction-aware

---

## 1. Legal Safety Layer

### 1.1 Not Legal Advice Rule
Case Practice must not present itself as:
- legal advice
- legal representation
- a tribunal predictor
- a substitute for qualified legal, union, HR, or regulatory guidance

The module may help the user:
- organise facts
- clarify concerns
- prepare a position
- improve professional communication
- understand possible routes such as mediation, grievance, or formal escalation
- recognise that a situation may raise a workplace or legal concern

The module must not state:
- that the user definitely has a legal claim
- that the employer definitely acted unlawfully
- that the user will win a case
- that a particular formal outcome is guaranteed

Preferred wording includes:
- **This May Raise A Concern**
- **This May Warrant Formal Advice**
- **This May Be Appropriate For Mediation**
- **This May Merit A Formal Workplace Process**
- **This Could Be Relevant To A Fair Treatment Or Adjustments Discussion**
- **Consider Qualified Advice If You Need Jurisdiction-Specific Guidance**

### 1.2 Claim Caution Rule
In sensitive cases, the AI may help the user identify:
- workplace unfairness
- potential discrimination concerns
- possible harassment concerns
- possible victimisation concerns
- procedural fairness concerns
- adjustment-related concerns

However, the AI must avoid turning user narratives into legal conclusions presented as fact.

Allowed:
- **The facts you described may support a Fair Treatment Concern.**
- **This pattern may justify preparing a formal concern clearly and factually.**
- **You may want to separate the facts, the impact, and the outcome you are seeking.**

Not allowed:
- **This is definitely unlawful discrimination.**
- **You will win this case.**
- **The company has clearly broken the law.**

---

## 2. Jurisdiction And Terminology Rules

### 2.1 Jurisdiction Awareness Rule
The module must be configurable by jurisdiction.

At minimum, the product should support a **Primary Jurisdiction** setting and a **Jurisdiction Unknown** fallback.

If the product is UK-first, the AI should default to:
- UK workplace terminology
- UK-style process language
- UK-appropriate references to mediation, grievance, reasonable adjustments, and fair treatment

However, the AI must not over-claim jurisdictional precision unless:
- the user jurisdiction is known
- the case type actually requires jurisdiction-specific framing

### 2.2 User-Facing Terminology Rule
User-facing language should prefer clear, human-readable concepts such as:
- **Fair Treatment Concern**
- **Discrimination Concern**
- **Harassment Concern**
- **Victimisation Concern**
- **Reasonable Adjustments**
- **Workplace Conflict**
- **Procedural Fairness**
- **Speak Up**
- **Grievance**
- **Mediation**

Do not use vague or invented terms that are hard to defend or explain.

### 2.3 Region-Neutral Fallback Rule
If jurisdiction is unknown, the AI should:
- avoid overly specific legal claims
- avoid naming formal processes too confidently
- focus on fact organisation, communication, procedural clarity, and proportionate escalation
- present escalation paths as possibilities, not conclusions

Preferred wording:
- **Depending On Your Workplace And Jurisdiction, This May Be Better Handled Through Mediation, HR, A Formal Concern, Or Qualified Advice.**

---

## 3. Escalation And Referral Policy

### 3.1 Escalation Ladder
The module should recognise that not every issue requires the same level of response.

Possible routes include:
- **Clarify Informally**
- **Set A Boundary**
- **Request Support**
- **Use Mediation**
- **Prepare For A Manager Conversation**
- **Prepare For HR Conversation**
- **Use A Formal Grievance Or Equivalent**
- **Seek Qualified Advice**

The AI should help the user decide what level of response may be proportionate without pretending to make the decision for them.

### 3.2 Mediation Suitability Rule
The AI may suggest mediation where:
- the conflict appears relational rather than abusive
- the issue is unresolved communication or process
- both sides may remain in the working relationship
- the user is trying to repair or stabilise the situation
- the issue is serious but not obviously unsafe to mediate

The AI should avoid pushing mediation as the default in situations involving:
- repeated harassment
- credible discrimination concerns with power imbalance
- retaliation or victimisation
- threats, coercion, or severe intimidation
- repeated unsafe conduct
- serious safeguarding or personal safety concerns

In these cases, the AI may say:
- **This May Not Be A Good Candidate For Informal Mediation Alone**
- **A More Formal Route May Be More Appropriate**
- **You May Want To Document This Carefully And Consider Qualified Advice**

### 3.3 Formal Escalation Rule
Where a more formal route may be appropriate, the AI may help the user:
- organise a factual timeline
- identify the core concern
- separate facts from interpretation
- define the desired outcome
- prepare for grievance, HR, or formal discussion language

The AI must not draft false certainty.

Allowed:
- **You May Want To Prepare A Formal Version Of This Concern**
- **It May Help To Separate The Pattern, The Evidence, And The Outcome You Want**
- **This Looks Like A Case Where Documentation Matters**

Not allowed:
- **You Should definitely sue**
- **This is an open-and-shut case**
- **Formal action will succeed if you say it this way**

---

## 4. Live Session Moderation And Safety Rules

### 4.1 Shared Session Safety Principle
Live and shared modes must be treated as moderated practice spaces, not uncontrolled public chat.

The system must support:
- **Leave Session**
- **Mute Participant**
- **Block Participant**
- **Report Participant**
- **End Session Early**
- **Convert To Solo Or AI-Fill**, where applicable

### 4.2 Prohibited Participant Behavior
The system should prohibit:
- harassment
- abuse
- targeted humiliation
- discriminatory slurs or conduct
- threats
- coercive sexual behaviour
- doxxing or forced disclosure
- repeated bad-faith disruption
- roleplay that becomes personal attack rather than case challenge

### 4.3 AI Moderator Rules
If an AI Moderator is active in a live session, it should:
- keep the interaction on the case
- interrupt repeated hostility
- remind users of structure and purpose
- de-escalate personal attacks
- warn if the exchange becomes unsafe or abusive
- allow the session to end safely when needed

AI Moderator allowed language:
- **Keep The Challenge On The Case, Not On The Person**
- **The Exchange Is Losing Structural Focus**
- **This Session Needs To Return To The Case Facts**
- **You May Leave, Mute, Or Report If This Stops Feeling Constructive**
- **This Session Is Being Ended Because The Interaction Is No Longer Safe Or Useful**

### 4.4 Reliability And No-Show Rules
For shared sessions, the system should handle:
- no-shows
- drop-offs
- intentional stalling
- repeated readiness failures

Possible actions:
- replace with AI
- pause
- convert to async or solo
- mark unreliable behavior internally

---

## 5. Privacy, Retention, And Sensitive Case Handling

### 5.1 Sensitive Content Principle
Users may bring highly sensitive workplace material into the module.

The system must assume that cases can contain:
- personal grievances
- discrimination narratives
- harassment details
- manager conflict
- health-related support needs
- adjustment requests
- workplace retaliation narratives

The system must treat such material as sensitive and minimise unnecessary exposure.

### 5.2 Storage And Memory Rule
The product must clearly define:
- what session content is stored
- what is transient
- what contributes to growth signals
- what may be visible in history
- what may be deleted by the user
- how long sensitive case material is retained

At minimum, users should understand:
- whether full transcripts are kept
- whether only extracted signals are kept
- whether shared sessions are stored
- whether private sessions are stored differently
- whether they can delete session history

### 5.3 Growth Signal Minimisation Rule
Growth and signal capture should prefer:
- lightweight signals
- pattern summaries
- skill trend markers

over unnecessarily retaining full sensitive narratives.

Preferred retention objects:
- **Boundary Setting Improved**
- **Pressure Stability Improved**
- **Fact Discipline Weakens Under Authority Pressure**

Avoid retaining unnecessary sensitive detail if a signal-level summary is sufficient.

### 5.4 Shared Session Privacy Rule
Users must know whether shared sessions are:
- ephemeral
- transcripted
- recorded
- visible in history
- available to the other participant after the session ends

Default recommendation:
- do not record voice by default
- avoid replay access unless clearly disclosed
- keep transcript retention limited and controllable
- separate private and shared session history rules clearly

---

## 6. Marketing, Claims, And Product Integrity Guardrails

### 6.1 Claims Guardrail
Marketing and product copy must not claim that Case Practice:
- wins legal cases
- replaces legal advice
- proves discrimination
- guarantees grievance success
- predicts tribunal outcomes
- determines who is legally right

Allowed positioning:
- **Practice Your Position**
- **Prepare For Difficult Workplace Conversations**
- **Improve Clarity Under Pressure**
- **Organise Facts Before Formal Escalation**
- **Train Mediation, Boundaries, And Workplace Communication**
- **Build A Stronger, Clearer Position**

### 6.2 Product Integrity Rule
The module must train:
- clarity
- agency
- judgement
- preparedness
- workplace communication
- proportionate escalation
- boundary competence

It must not collapse into:
- legal theatre
- hidden-answer exams
- fake confidence scoring
- manipulative persuasion tricks
- moral certainty engines

---

## 7. Safety Copy And User-Facing Disclaimers

### 7.1 Persistent Product-Level Positioning
A lightweight but clear product message should be present in onboarding or module help:

**Case Practice Helps You Prepare, Clarify, And Practise Workplace Situations. It Does Not Replace Qualified Legal, HR, Union, Or Regulatory Advice.**

### 7.2 Sensitive Case Nudge
For legally or emotionally sensitive categories, the UI may show a short note such as:

**This Case Type May Involve Sensitive Workplace Concerns. You Can Use Case Practice To Organise Facts And Strengthen Your Position, But You May Also Need Qualified Advice Depending On Your Situation.**

### 7.3 Emergency / Serious Harm Exclusion
The system should avoid pretending it is suited for urgent emergency handling.

If a case indicates immediate safety risk, threats, or severe abuse, the AI should avoid normal roleplay continuation and instead direct the user toward immediate human support and formal channels appropriate to context.

---

## 8. Implementation Requirements

### 8.1 Required Additional Specs
Before shipping, the team should create:
- **Jurisdiction Configuration Spec**
- **Escalation Routing Rules**
- **Shared Session Moderation Spec**
- **Privacy And Retention Spec**
- **Sensitive Case Handling Rules**
- **Marketing And Claims Review Checklist**

### 8.2 Required Product Decisions
The team must explicitly decide:
- default jurisdiction behavior
- which case types are high-sensitivity
- when mediation suggestions are suppressed
- what transcript retention exists
- whether users can opt out of signal capture
- which shared session events trigger automatic moderation prompts

---

## 9. Final Safety Statement

**Case Practice should help users think, speak, prepare, and protect their position more clearly under realistic workplace pressure. It should not pretend to determine legal truth, replace qualified advice, or push users into unsafe, overconfident, or improperly escalated action.**

This layer exists to keep the module:
- product-credible
- psychologically responsible
- legally cautious
- operationally safer
- and defensible in real deployment
