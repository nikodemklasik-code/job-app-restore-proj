# JobRadar — Legal & Trust Policy Pack (v1.0)

**Status:** internal product + engineering policy  
**Jurisdiction focus:** England & Wales + EU (including DSA procedural expectations)  
**Last updated:** 2026-04-15

**See also:** [`job-radar-legal-safety-policy-v1.0.md`](./job-radar-legal-safety-policy-v1.0.md) — operational hardening (private-by-default, severity gates, kill switch, escalation matrix, final launch gate).

---

## Important notice

This document is **not legal advice**. It describes product, editorial, and operational safeguards intended to **reduce** (not eliminate) reputational and legal risk. Before a public launch of employer-facing or indexed outputs, obtain a **short review** from counsel experienced in **defamation / media law** and **platform / intermediary liability** in the UK and EU.

Collecting public data does **not** automatically shield the product. Risk remains if the system presents negative content about employers as **established facts**, blends **opinion with fact**, or draws **overly categorical** conclusions from weak sources.

---

## 1. Legal positioning (why this matters)

- **Hosting third-party speech** may attract specific protections *only* when conditions are met; it is **not** a shield for **your own** editorial statements or for **system-composed** conclusions presented as fact.
- **DSA**-style obligations (e.g. notice-and-action, diligent response) help **procedurally**; they do not grant full immunity for **your own** assertions.
- The most predictable dispute logic concerns **reputation**: how claims are worded, how sources are weighted, and how users understand **model output vs fact**.

---

## 2. Editorial policy — what we may show users

### A. Hard facts (lower risk when sourced correctly)

**Typical sources**

- Official employer website  
- Companies House / commercial registry (structured)  
- Job boards (as **text of the listing**)  
- LinkedIn company page (where used as factual surface)

**Examples of acceptable statements**

- Company is **active** in the registry.  
- The listing **states** salary range £70k–£85k.  
- The employer **states** a hybrid work model in the posting.

**Form:** short, verifiable, tied to the source.

### B. Reputational signals (allowed — carefully)

**Typical sources:** Glassdoor, Reddit, forums, social media.

**Allowed**

- Aggregated **patterns** or **repeated themes** in public discussion.  
- Clear uncertainty language and **confidence** levels.

**Not allowed**

- Treating a **single** accusation as truth.  
- **Intent** attribution (“they meant to…”).  
- **Culture diagnosis** from a handful of angry comments.

**Good:** “Public reviews show **mixed** signals about recruitment transparency. **Confidence: low.**”  
**Bad:** “The employer **manipulates** candidates.”

### C. AI / model outputs (highest framing risk)

Applies to: **risk score**, **culture fit**, **recommendation**, and similar.

**Must always be framed as**

- **Model-based assessment**, not ground truth.  
- **Explainable** (drivers, source class, confidence).

**Good:** “JobRadar assesses **elevated caution** based on limited transparency and few high-quality public sources.”  
**Bad:** “This company **is** risky.” (“The model said so” is not a legal defence.)

---

## 3. Forbidden claims policy (hard block list)

Unless a **legal override** exists after documented review, the system **must not** generate (or surface as firm fact) phrases such as:

| Blocked without strong process |
| --- |
| scam, fraud, fraudulent |
| fake company |
| toxic workplace, exploitative |
| abusive management |
| illegal hiring |
| discriminatory employer |
| unsafe workplace |

**Preferred neutral substitutes**

- “Limited transparency”  
- “Insufficient public data”  
- “Mixed candidate signals”  
- “Public information is inconsistent”  
- “Some signals may warrant caution”

### Severe negative claims — minimum bar

If output would be **severely** negative about an employer:

- Require **at least two Tier-1 sources**, **or** **one Tier-1 + structured legal/regulatory** source, **and**  
- **Manual review** before publication / high-visibility surfacing.

---

## 4. Source weighting — legal product policy

### Tier 1 — high-trust factual layer

- Official site, registry, regulatory filings.

**Use:** full scoring contribution; may support stronger warnings **when** appropriately framed.

### Tier 2 — medium

- Job boards (listing content), LinkedIn (factual surfaces).

**Use:** medium weight; **no severe** defamation-style claims from Tier 2 alone.

### Tier 3 — weak / reputational

- Forums, anonymous reviews, Reddit.

**Use:** capped influence on reputation and risk; **never** sole basis for **severe** red flags; **must not** drag **recommendation** below “Mixed Signals” **by itself**.

---

## 5. Confidence publication rules

| Level | Minimum evidence (conceptual) |
| --- | --- |
| **High** | ≥2 independent sources **or** 1 Tier-1 structured anchor |
| **Medium** | 1 Tier-1 + weak corroboration **or** 2 Tier-2 |
| **Low** | Single weak source **or** inference-only |

### UI obligation

For every **red flag**, **warning**, and **recommendation driver**, show:

- **Confidence**  
- **Source class / tier** (or equivalent)  
- Whether the statement is **source-backed fact** vs **model synthesis**

---

## 6. Defamation-safe wording framework

| Instead of | Prefer |
| --- | --- |
| “The company hides salaries.” | “The listing does not state a clear salary range.” |
| “Terrible culture.” | “Public signals about culture are limited or mixed.” |
| “They cheat candidates.” | “Some public information appears inconsistent with other public sources.” |

---

## 7. Notice & action (must-have)

### Public channels

- Email: `trust@<your-domain>` (replace with production address)  
- Web form: “Report an issue” (employer, candidate, or third party)

### Categories

- Factual inaccuracy  
- Outdated information  
- Reputational harm concern  
- Formal legal notice

### SLA (initial targets)

| Stage | Target |
| --- | --- |
| Acknowledgement | 24 business hours |
| Initial triage | 72 hours |
| Full resolution | 7–14 days (case-dependent) |

### Internal flow

1. Intake and ticket ID  
2. If **severe** / high visibility: **freeze or downgrade visibility** of disputed insight pending review  
3. Audit review: source quality, duplicates, staleness  
4. Decision: **keep** | **revise** | **suppress**  
5. **Audit log** entry (immutable enough for disputes)

### Audit log — minimum fields

- `complaint_id`  
- `employer_id` (if applicable)  
- `report_id` / `scan_id`  
- `issue_type`  
- `content_removed` / `visibility_changed`  
- `reviewed_by`  
- `timestamp`

---

## 8. Freshness & correction

JobRadar should expose:

- `last_scanned_at` (or equivalent)  
- **Freshness** status  
- Source timestamps where available  

**Stale report** triggers (tunable):

- e.g. **72h** for an actively monitored listing context  
- e.g. **30d** for a slower-moving employer profile summary  

**UI:** “This report may contain **outdated** information.”

---

## 9. Human review triggers (non-exhaustive)

Require **manual review** before strong surfacing when:

- Registry **inactive** / **mismatch** / suspected **entity** issues  
- Repeated public complaints pattern (if ever aggregated)  
- **Conflict**: official vs listing vs registry  
- **Critical fields** largely missing (>50% — threshold to be defined in product)

---

## 10. Product disclaimer (UI — short)

> JobRadar provides informational analysis based on publicly available sources and model-based assessment. Results may be incomplete or outdated.

**Terms should also state:** not legal or financial advice; best-effort synthesis; errors may occur; **correction process** available.

Disclaimers **assist**; they do **not** cure unlawful or reckless assertions.

---

## 11. Internal launch checklist (must pass before broad public release)

**Legal**

- [ ] Terms updated for JobRadar-specific outputs  
- [ ] Privacy / data handling reviewed for scanning + retention  
- [ ] Complaint / notice channel **live**  
- [ ] Escalation owner named  

**Product**

- [ ] Confidence visible on sensitive outputs  
- [ ] Source tier / class visible where relevant  
- [ ] Severe wording rules enforced (block list + review path)  
- [ ] Stale / freshness visible  

**Backend / data**

- [ ] Audit logs for disputes  
- [ ] Source traceability to drivers  
- [ ] Override / suppression logs (when implemented)  
- [ ] Raw content TTL aligned with policy  

**Ops**

- [ ] Moderation / trust inbox monitored  
- [ ] Legal escalation playbook  
- [ ] Ability to reduce visibility or roll back high-risk employer insights  

---

## 12. Phased launch (recommended)

| Phase | Exposure |
| --- | --- |
| **1** | Private reports to the **user only**; no public employer pages |
| **2** | Limited employer summaries (still no “attack SEO”) |
| **3** | Broader “trust layer” **after** legal review |

**High-risk patterns to avoid early:** public “rankings” or SEO pages such as “most toxic employers in \<city\>”.

---

## 13. Ownership

- This pack is **living**. Update when product surfaces, sources, or jurisdictions change.  
- **Counsel review** before treating any section as “done” for external reliance.
