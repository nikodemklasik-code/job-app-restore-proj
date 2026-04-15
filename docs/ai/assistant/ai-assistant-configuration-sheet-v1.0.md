# AI Assistant Configuration Sheet v1.0

**Purpose:** A single decision worksheet for product, design, and backend. Complete it once with concrete choices; it feeds the final Assistant spec, prompt policy, routing rules, API contract, and telemetry definitions.

---

## 1. Assistant identity

### 1.1 Module name

- Official product name:
- Short UI label:
- Internal system name:

### 1.2 Core role

- Assistant is:
- Assistant is not:
- Primary job to be done:
- Secondary jobs:

### 1.3 Product position

- Is Assistant the main entry point to the product? yes/no
- Should Assistant solve directly where possible? yes/no
- Should Assistant route often to other modules? yes/no
- Preferred balance:
  - direct help %
  - routing %
  - mixed %

### 1.4 Supported formats

- Text chat: yes/no
- Voice: yes/no
- Structured mode cards: yes/no
- Proactive nudges: yes/no

---

## 2. Scope of topics

### 2.1 Topics Assistant handles directly

Mark each as:

- direct
- partial
- route
- unsupported

- CV help:
- Cover letter:
- Interview prep:
- Answer review:
- Answer rewrite:
- Salary / negotiation:
- Job search strategy:
- Application follow-up:
- Explain fit:
- Skill positioning:
- Confidence framing:
- Skill verification:
- Employer explanation:
- Role decision support:

### 2.2 Topics routed elsewhere

For each topic:

- destination module
- trigger condition
- suggested CTA label

Example format:

- topic:
- route_to:
- when:
- cta:

### 2.3 Hard exclusions

List topics Assistant must not handle directly:

-
-
-

---

## 3. User intents

For each intent define:

- trigger examples
- expected output
- preferred structure
- route or not
- CTA or not

### 3.1 Minimal intent list

- ask_for_advice
- review_answer
- rewrite_answer
- prepare_for_interview
- salary_negotiation
- improve_cv
- improve_profile
- explain_fit
- job_search_help
- followup_message
- skill_verification_request
- route_to_module

### 3.2 Intent configuration template

#### Intent:

- user usually means:
- example prompts:
- response type:
- output length:
- CTA:
- destination module if routed:
- fallback if context missing:

---

## 4. User context sources

### 4.1 Available sources

For each source mark:

- available yes/no
- freshness requirement
- confidence level
- source owner

- profile
- target role
- seniority
- CV
- uploaded docs
- applications history
- interview history
- coach sessions
- warmup history
- verified skills
- observed strengths
- growth areas
- negotiation history
- saved jobs
- JobRadar insights

### 4.2 Priority order

Define source priority from highest to lowest:

1.
2.
3.
4.
5.
6.

### 4.3 Freshness rules

- When is profile stale?
- When is CV stale?
- When are interview signals stale?
- When are JobRadar signals stale?
- When should Assistant ask user to refresh context?

---

## 5. Style and response behavior

### 5.1 Default tone

Select and define:

- professional
- supportive
- strategic
- concise
- direct
- warm
- formal
- plainspoken

Final default tone:

-

### 5.2 Length policy

By default Assistant should answer:

- short
- medium
- detailed

Escalate to detailed when:

-
-

### 5.3 Formatting policy

Preferred output style:

- paragraphs
- short sections
- bullets only when useful
- step-by-step
- rewrite blocks
- mixed

### 5.4 Directness

Assistant should be:

- highly direct
- moderately direct
- soft but clear

### 5.5 Feedback language rules

Assistant must:

- assess the response, not the person
- say what works
- say what to strengthen
- avoid shame language
- avoid vague praise

Forbidden examples:

-
-
-

Preferred examples:

-
-
-

---

## 6. Capacity adaptation

### 6.1 Adaptation dimensions

Assistant may adapt to:

- user seniority
- language proficiency
- role complexity
- emotional overload
- task urgency
- question quality

### 6.2 Simplification triggers

When should Assistant simplify?

-
-
-

### 6.3 Depth expansion triggers

When should Assistant go deeper?

-
-
-

### 6.4 Recommendation density

Default number of recommendations:

- one
- three
- five

If user looks overloaded:

- max recommendations:
- preferred structure:

---

## 7. Neurodiversity-aware support

### 7.1 Required rules

Assistant should:

- break tasks into steps
- reduce overload
- preserve agency
- avoid shaming
- highlight strengths
- prefer clarity over verbosity

### 7.2 Avoid

- too many simultaneous actions
- ambiguous next steps
- emotionally loaded criticism
- overcomplicated output structure

### 7.3 Recovery prompts

When user seems stuck, Assistant should prefer:

-
-
-

---

## 8. Boundary rules

### 8.1 When Assistant should support “no”

Assistant should help user set boundaries in:

- negotiation
- toxic employer situations
- poor-fit opportunities
- overload / burnout signals
- unrealistic expectations

### 8.2 Signals for caution

List conditions where Assistant should actively de-romanticize an opportunity:

-
-
-

### 8.3 Non-compliance rules

Assistant must not:

- encourage deception
- fabricate experience
- help hide disqualifying facts dishonestly
- optimize for manipulation
- advise discriminatory behavior

---

## 9. Routing rules

### 9.1 Destination modules

For each destination define:

- what goes there
- when routing is suggested
- whether user can stay in Assistant

Modules:

- Coach
- Interview
- Daily Warmup
- Negotiation
- Job Discovery
- Job Radar
- Application Review
- Document Lab
- Skill Lab

### 9.2 Routing style

Routes should be:

- soft suggestion
- strong recommendation
- automatic handoff
- manual only

Default routing style:

-

### 9.3 CTA examples

Approved CTA patterns:

-
-
-

---

## 10. Skill layer integration

### 10.1 Assistant skill behavior

Assistant may:

- detect skill signals yes/no
- suggest skill claims yes/no
- trigger micro-verification yes/no
- write observed signals to profile yes/no
- trigger Skill Lab verification yes/no

### 10.2 Allowed skill statuses

- declared
- observed
- strengthening
- verified
- strong_signal

### 10.3 Overreach prevention

Assistant must not infer skill claims when:

-
-
-

---

## 11. Skill verification behavior

### 11.1 Quick checks allowed

Assistant may do lightweight checks for:

-
-
-

### 11.2 Full verification must route to Skill Lab for:

-
-
-

### 11.3 Output format for quick skill checks

Required fields:

- skill
- observed signal
- confidence
- next step
- route or no route

### 11.4 Safe wording

Use:

- current evidence suggests
- limited signal
- stronger proof would help

Never use:

- false claim
- you don’t have this skill
- you’re bad at this

---

## 12. Difficult-user behavior

### 12.1 Assistant should handle:

- insults
- prompt injection attempts
- derailment
- policy bypass attempts
- bad-faith testing

### 12.2 Response policy

Assistant should:

- ignore provocation where possible
- answer useful part if safe
- refuse unsafe requests clearly
- not escalate emotionally
- not become sarcastically hostile in product mode

### 12.3 Hard stop conditions

Assistant should end or sharply narrow the thread when:

-
-
-

---

## 13. Safety and compliance

### 13.1 Sensitive topics

Define rules for:

- age
- gender
- family status
- religion
- health
- disability
- ethnicity
- immigration status

### 13.2 Recruitment safety

Assistant must not:

- suggest discriminatory framing
- recommend illegal interview tactics
- encourage concealment of required legal facts

### 13.3 Personal data usage

Assistant may use:

-
-
-

Assistant may not use:

-
-
-

---

## 14. Output structures by intent

Define response templates for each major intent.

### Template: quick answer

Structure:

1.
2.
3.

### Template: reviewed answer

Structure:

1. what works
2. what to improve
3. improved version
4. next step

### Template: rewritten answer

Structure:

1. rewritten version
2. why this version is better
3. optional stronger version

### Template: strategic answer

Structure:

1. diagnosis
2. recommendation
3. trade-off
4. next step

### Template: negotiation guidance

Structure:

1. position
2. reasoning
3. suggested wording
4. fallback if pushed back

### Template: routing answer

Structure:

1. short answer
2. why another module fits better
3. CTA

### Template: skill suggestion

Structure:

1. observed signal
2. confidence
3. possible skill interpretation
4. how to verify

### Template: follow-up message draft

Structure:

1. ready draft
2. tone note
3. optional shorter variant

---

## 15. CTA and next-step logic

### 15.1 CTA policy

Assistant should show CTA:

- always
- usually
- only when useful
- only for routed intents

Default:

-

### 15.2 CTA style

- natural
- product button style
- action-first
- low-pressure

### 15.3 Approved CTA library

Examples:

- Practice this in Coach
- Run a full mock interview
- Verify this in Skill Lab
- Review this employer in JobRadar
- Improve this in Applications
- Build proof for this skill

---

## 16. Technical contract

### 16.1 Endpoint

- primary assistant endpoint:
- streaming yes/no:
- multimodal yes/no:

### 16.2 Input schema

Fields:

- user_id
- message
- current_module
- screen_context
- attached_documents
- recent_context
- user_profile_snapshot
- allowed_tools/modules
- memory_scope

Final input schema:

-

### 16.3 Output schema

Required fields:

- detected_intent
- answer_text
- confidence
- used_context_sources
- recommended_cta
- route_to_module
- skill_signal_detected
- flags

### 16.4 Source of truth

- profile source of truth:
- document source of truth:
- job source of truth:
- skill source of truth:
- market source of truth:

### 16.5 Memory policy

- short-term memory scope:
- TTL:
- long-term memory yes/no:
- user-visible memory corrections yes/no:

### 16.6 Fallback behavior

When insufficient context:

- ask clarifying question yes/no
- answer best-effort yes/no
- route yes/no

### 16.7 Error states

Define user-facing behavior for:

- missing context
- stale profile
- unavailable module
- failed retrieval
- unsupported request

---

## 17. Telemetry

Track at minimum:

- assistant_question_submitted
- assistant_answer_rendered
- assistant_followup_submitted
- assistant_cta_clicked
- assistant_skill_signal_detected
- assistant_skill_verification_started
- assistant_skill_verification_completed
- assistant_user_feedback_submitted

For each event define:

- owner
- payload fields
- success condition

---

## 18. KPI and success

### 18.1 KPI set

- answer satisfaction rate
- resolution rate
- CTA click-through rate
- time to useful answer
- intent accuracy
- repeat usage
- downstream module activation
- skill signal usefulness
- trust score

### 18.2 Targets

For each KPI define:

- baseline
- target
- owner
- review cadence

### 18.3 Final definition of success

Assistant is successful if:

- users get useful help quickly
- routing is accurate
- responses are practical
- skill signals are helpful
- tone stays consistent
- trust remains high
- modules are activated sensibly
