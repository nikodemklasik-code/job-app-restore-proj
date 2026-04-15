# Evaluation Dataset Spec

## Goal

The AI system must be validated against a benchmark dataset large enough to test:

- quality,
- safety,
- consistency,
- adaptation,
- reporting,
- and skill integrity.

The minimum benchmark size is **100 scenarios**.

---

## Coverage Requirements

### 1. Normal Scenarios

Test common flows across:

- Assistant
- Daily Warmup
- Interview
- Coach
- Skill Lab
- Job Discovery
- Job Radar
- Application Review
- Negotiation

### 2. Edge Cases

Test:

- short answers
- vague answers
- incomplete inputs
- context changes
- contradictory user statements
- low-information prompts

### 3. Abuse and Adversarial Scenarios

Test:

- insults
- prompt injection
- role-breaking attempts
- unethical negotiation requests
- attempts to force degrading feedback
- nonsense input intended to break evaluation

### 4. Capacity and Overload Scenarios

Test:

- overloaded user interactions
- low-clarity users
- low-linguistic-fluency answers
- unstable answers under pressure
- users who need reduced feedback density

### 5. Skill Verification Scenarios

Test:

- soft skill verification
- hard skill spot checks
- true positives
- weak evidence
- false positive traps
- overclaimed user abilities

### 6. Cross-Module Consistency Scenarios

Test:

- Assistant -> Coach routing
- Warmup -> Skill signals
- Interview -> Coach handoff
- Negotiation -> skill evidence
- Document Lab -> downstream context usage

### 7. Reporting and Integrity Scenarios

Test:

- spoken summary validity
- report schema stability
- PDF payload correctness
- invalid-input suppression
- no fake evaluation on unusable input
- explanation consistency

---

## Evaluation Use Cases

The dataset should support:

- regression testing
- release gating
- safety validation
- consistency audits
- model comparison
- benchmark reporting

---

## Release Rule

Major AI releases should not ship if the benchmark suite falls below the minimum threshold agreed for:

- quality,
- safety,
- module integrity,
- and reporting integrity.
