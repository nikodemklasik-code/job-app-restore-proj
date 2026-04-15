# JobRadar — Product Interaction Spec v1.0

**Document type:** Product / UX / content architecture (frontend-facing)  
**Last updated:** 2026-04-15  
**Related policies:** [`job-radar-legal-trust-policy-v1.0.md`](./job-radar-legal-trust-policy-v1.0.md), [`job-radar-legal-safety-policy-v1.0.md`](./job-radar-legal-safety-policy-v1.0.md)

**Purpose:** Align information architecture, copy, and UI behaviour with a **decision-support** model (evidence-first, explainable, legally defensive) — **not** a public reputation or “employer rating” product.

---

## Strategic one-liner

JobRadar should be a **modern candidate decision-support system** built on **evidence**, **confidence**, and **explainability** — **not** a public engine for grading employers.

---

## 1. Product axis (non-negotiable framing)

### Avoid (reputation-publishing tone)

- “We rate the employer.”
- Headlines that read like a **verdict** on the company as a moral actor.

### Use (decision-support tone)

- “We help you assess **this offer** and the **completeness / quality** of **public** information.”

### Terminology shift

| Avoid | Prefer |
| --- | --- |
| Employer score | Offer transparency score; public data completeness |
| Risky employer (headline) | Hiring process signals; risk **signals** (with context) |
| Red flags about the company | Transparency gaps; process signals; items needing caution |
| Verdict-style recommendation only | **Next best action** + guidance |

This is **not cosmetic**: it shifts how users and third parties interpret the product.

---

## 2. Evidence-first screen order

Modern, safer UI **does not** open with a single score or dramatic badges.

**Recommended vertical order**

1. **What we know** — verified public facts and listing facts (sources attached).  
2. **How reliable it is** — confidence, source tier, freshness.  
3. **What the model suggests** — clearly labelled **model observations** (never merged with facts in copy).  
4. **What is missing** — gaps, missing fields, stale data.  
5. **What you should do next** — **next best action** (primary CTA).

Avoid leading with: a big “64/100”, three red badges, or tabloid HR drama.

---

## 3. Layer A — Information architecture (IA)

### 3.1 Primary surfaces (private launch)

- **Report home** for a scan: single primary narrative flow (sections below).  
- **Trust actions** globally available: report issue, outdated data, harmful finding (per finding where applicable).  
- **No** public employer profile, **no** SEO landing, **no** rankings (see Legal Safety Policy).

### 3.2 Section taxonomy (suggested blocks)

Each block is a **first-class** UI unit with its own metadata (see Layer C).

| Block | Role |
| --- | --- |
| Public facts | Registry / official / listing-derived facts |
| Data completeness | What was found vs missing |
| Offer transparency | Salary clarity, benefits stated, process clarity |
| Compensation context | Benchmark / range context (model + sources) |
| Fit signals | Model — clearly separated |
| Process / hiring signals | Neutral wording; evidence-backed |
| Next best action | Primary guidance — not a “verdict” |

### 3.3 Progressive disclosure (three levels)

**Level 1 — Summary (default)**

- Short recommendation label (policy-constrained wording).  
- Overall confidence + missing data summary.  
- **Next best action** (primary).  
- Trust entry points (report / review).

**Level 2 — Reasoning (expandable)**

- Score drivers (grouped).  
- Findings list (with confidence + source class).  
- Source tier legend.

**Level 3 — Deep evidence**

- Source list with URLs / identifiers where allowed.  
- Provenance: collection time, parser/scoring version (as product allows).  
- Timestamps and freshness.

This reduces harsh headlines while preserving traceability for trust/legal.

---

## 4. Layer B — Legal-safe content rules

### 4.1 Fact vs model (hard separation in copy)

- **Verified public information** and **listing facts** live in dedicated UI regions.  
- **Model observations** live in a separate region with explicit labelling.  
- **Never** concatenate into one sentence that sounds like a factual accusation, e.g.  
  “Company X is risky because Y and Z” mixing registry + forum noise.

### 4.2 Language policy engine (product layer)

Concept: every user-facing insight passes through a **language policy transform**.

**Inputs (conceptual)**

- Raw finding / signal  
- Severity (internal)  
- Confidence  
- Source tier  
- Legal sensitivity flag (if any)

**Output**

- **Safe UI copy** consistent with [`job-radar-legal-safety-policy-v1.0.md`](./job-radar-legal-safety-policy-v1.0.md) (forbidden terms, substitutes).

**Example**

| Raw (internal) | Safe UI |
| --- | --- |
| “Company may be fake” | “Registry data shows a material inconsistency; treat with caution and verify independently.” |

The **model** may emit a signal; the **product** publishes **policy-compliant** text.

### 4.3 Dynamic confidence UX (must be explanatory)

“Low confidence” is not enough.

For material sections, show **why** confidence is low/medium and **what would improve it** (e.g. salary not disclosed; no structured benchmark match; single weak source).

Example pattern:

> Confidence is **low** because the listing does not disclose salary and no strong benchmark match was found. **You can:** ask the recruiter, compare similar roles, or rescan when the posting updates.

### 4.4 Verdict → guidance

Replace categorical employer judgements with **actionable next steps**:

- Compare with another similar role.  
- Ask the recruiter about salary transparency.  
- Rescan after 72h (if stale policy applies).  
- Add preferences to improve fit quality (when product supports it).

### 4.5 Visual and tonal language

Aim for **due diligence / decision intelligence** — not exposé, blacklist, or “HR TripAdvisor”.

- Neutral palette; restrained emphasis.  
- Avoid sharp reputation labels as hero elements.  
- Prefer **provenance and context** over alarm.

---

## 5. Layer C — Dynamic states & transitions (UI)

### 5.1 Report block state model

Each major block should support:

| Dimension | Values / notes |
| --- | --- |
| **Availability** | `available` / `partial` / `unavailable` |
| **Confidence** | `low` / `medium` / `high` (with explanation string) |
| **Freshness** | age or `freshness_hours`; **last checked** timestamp |
| **Source tier** | Tier 1 / 2 / 3 (or product labels aligned with policy) |
| **Basis** | short “based on: …” line (e.g. official listing + benchmark) |

**Example — Compensation block**

- Status: `partial`  
- Confidence: `medium`  
- Freshness: `8h`  
- Based on: official listing + market benchmark (model)

Nothing in this pattern asserts absolute truth; it asserts **what the product knows and how**.

### 5.2 Living report (not static PDF)

Treat the report as **stateful knowledge**:

- Updates when rescan runs.  
- Shows stale warnings when policy says so.  
- Surfaces trust actions without hiding uncertainty.

### 5.3 Trust layer (built-in, not an afterthought)

Per **report**

- Report issue  
- Request review  
- Data outdated?  

Per **finding** (where applicable)

- This finding seems harmful / inaccurate  
- Visibility state: visible / pending review / suppressed (internal + user-visible cues as policy allows)

Modern products assume fallibility and provide **correction paths** early.

### 5.4 Scoring architecture (UX-facing)

Present scoring as **modular streams**, not one monolithic “employer score”:

- Data completeness  
- Offer quality / transparency  
- Compensation competitiveness (model + sources)  
- Employer verification (facts, registry — careful wording)  
- Candidate fit (model)  
- Risk **signals** (capped and explained — not a moral label)

**Composition model (conceptual)**

1. Engines compute sub-scores / signals.  
2. **Policy** constrains what can surface and at what severity.  
3. **Language engine** publishes compliant copy.

---

## 6. Phased launch (product view)

| Phase | Focus |
| --- | --- |
| **1** | Private, candidate-only, noindex. Emphasis: offer quality, transparency, benchmark, fit. |
| **2** | Employer verification + registry + trust workflow; legal consistency; rescans. |
| **3** | Deeper insights — still **no** public rankings or aggressive reputational publishing. |

---

## 7. Implementation note (engineering)

This spec is **UX and content architecture**. Backend contracts should expose enough structure (per-block metadata, confidence reasons, freshness, source tier, trust IDs) so the UI does not fake provenance. Align API fields with [`job-radar-openapi-v1.1.yaml`](./job-radar-openapi-v1.1.yaml) over time.

---

## 8. Ownership

- **Product / Design:** IA, progressive disclosure, visual tone.  
- **Content / Trust:** language policy rules and forbidden terms alignment.  
- **Engineering:** structured report model and metadata needed for honest UI.

Review this spec when adding new surfaces (public pages, sharing, rankings) — **default is defensive**.
