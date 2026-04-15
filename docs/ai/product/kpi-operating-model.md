# KPI Operating Model

## Purpose

This document defines how KPIs become operational rather than decorative.

A KPI is only real when it has:

- one formal definition,
- one owner,
- one event source,
- one review cadence,
- one baseline,
- one target,
- and one review process.

---

## 1. One Metric = One Formula

Each KPI must include:

- metric name
- purpose
- formula
- numerator
- denominator
- inclusion logic
- exclusion logic
- time window
- source of truth

### Example

**D7 Retention of AI-Active Users**  
Formula:  
`users active in any AI module on day 0 and again on day 7 / users active in any AI module on day 0`

No metric should exist as a vague phrase only.

---

## 2. KPI Owner Model

Each KPI must have one primary owner.

### Owner types

- Product
- AI Engineering
- Growth
- Data

### Ownership means accountability for

- definition quality
- event integrity
- dashboard visibility
- target follow-through
- escalation when the KPI degrades

---

## 3. KPI Review Cadence

Each KPI must be reviewed on one fixed cadence.

### Daily

Use for:

- fail rate
- latency
- unsafe output rate
- STT/TTS success
- SSE errors
- extraction success
- safety pass rates

### Weekly

Use for:

- D7 retention
- module completion
- usefulness
- CTA usage
- report open rate
- retry improvement
- verified skill rate

### Monthly

Use for:

- D30 retention
- measurable improvement over 30 days
- progression rates
- monetization conversion
- paid retention
- long-term trust score

---

## 4. Event-Backed KPI Rule

Every KPI must map to telemetry events.

If a KPI has no event source, it is not yet a real KPI.

---

## 5. Baseline and Target Rule

The top KPIs must have:

- current baseline
- 30-day target
- 90-day target
- measurement status

### Allowed measurement status

- measured
- partially measured
- instrumentation incomplete
- blocked

---

## 6. North Star KPIs

1. D7 Retention of AI-Active Users  
2. Meaningful AI Session Completion Rate  
3. 30-Day Measurable Improvement Rate  
4. Verified or Upgraded Skill Rate  
5. AI Satisfaction and Trust Score  

---

## 7. Event Taxonomy v1

Minimum required telemetry events:

### Shared

- ai_session_started
- ai_session_completed
- ai_module_entered
- ai_module_exited
- ai_feedback_viewed
- ai_report_opened
- ai_report_downloaded
- ai_cta_clicked

### Assistant

- assistant_question_submitted
- assistant_answer_rendered
- assistant_followup_submitted

### Daily Warmup

- warmup_started
- warmup_answer_submitted
- warmup_retry_started
- warmup_retry_completed

### Interview

- interview_started
- interview_completed
- interview_spoken_summary_played
- interview_report_generated

### Coach

- coach_module_started
- coach_module_completed
- coach_retry_submitted
- coach_golden_answer_viewed

### Skill Lab

- skill_declared
- skill_observed
- skill_verified
- skill_state_upgraded

### Jobs / Radar / Review

- job_discovery_search_executed
- job_fit_explained
- job_radar_viewed
- application_review_opened
- followup_recommendation_clicked

### Negotiation

- negotiation_strategy_generated
- negotiation_message_generated
- negotiation_practice_started
- negotiation_practice_completed

---

## 8. Minimal Rollout Plan

1. Freeze the v1 module map  
2. Define the telemetry taxonomy  
3. Launch KPI dashboard v1  
4. Run weekly North Star review  
5. Tie roadmap items to KPI hypotheses  

No major feature should ship without a declared KPI hypothesis.
