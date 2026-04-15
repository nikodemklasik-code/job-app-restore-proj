# JobRadar Legal Safety Policy v1.0

**Document owner:** Trust & Safety / Product  
**Last updated:** 2026-04-15  
**Applies to:** JobRadar (private candidate reports)

**Related:** [`job-radar-legal-trust-policy-v1.0.md`](./job-radar-legal-trust-policy-v1.0.md) (editorial tiers, wording examples, baseline notice-and-action). This policy is the **operational safety** source of truth for launch and enforcement.

**Notice:** This document is **not legal advice**. Counsel should review Terms, Privacy, and user-facing copy before broad or public launches.

---

## 1. Purpose

JobRadar provides employer and job-offer insights based on public information and model-assisted analysis.

This policy defines:

- what JobRadar may collect,
- what JobRadar may display,
- how negative findings are handled,
- how complaints and legal escalations are managed,
- launch safety requirements.

**Goals:**

- reduce legal / reputational risk,
- comply with UK / EU platform and privacy expectations,
- protect users and employer subjects.

---

## 2. Product Scope

**JobRadar launch scope:**

- private reports only,
- authenticated users only,
- report visible only to report owner,
- no public employer pages,
- no SEO indexing,
- no public rankings.

**Mandatory:**

- `X-Robots-Tag: noindex, nofollow`
- `robots.txt` block

**Forbidden at launch:**

- public trust rankings,
- “best / worst employers” lists,
- public employer profiles.

---

## 3. Data Sources Policy

### 3.1 Allowed source classes

#### Tier 1 — verified public sources

- official employer website
- careers page
- Companies House / registry
- regulatory filings

**Allowed use:**

- full factual extraction
- scoring input
- red flags (if threshold met)

#### Tier 2 — structured secondary sources

- LinkedIn company page
- job boards
- public salary listings

**Allowed use:**

- supportive evidence
- benchmark enrichment
- fit signals

#### Tier 3 — weak / reputation sources

- Reddit
- Glassdoor
- public forums
- social media posts

**Allowed use:**

- soft trend detection only

**Restrictions:**

- no severe red flags from Tier 3 alone
- low-confidence cap applies
- no direct quote replay

### 3.2 Forbidden sources

**Forbidden:**

- private communities
- private Slack / Discord
- closed Facebook groups
- paywalled restricted content without license
- scraped personal content violating ToS

---

## 4. Output Safety Rules

### 4.1 Hard facts vs model observations

**UI must separate:**

#### Verified public information

- registry status
- company age
- location
- listed salary
- work mode
- benefits

#### Model observations

- fit score
- transparency summary
- benchmark comparison
- risk observations

**Never:** merge inference into factual statements.

### 4.2 Wording rules

**Allowed:**

- limited transparency
- mixed public signals
- incomplete public information
- insufficient verified data

**Forbidden without legal threshold:**

- scam
- fraud
- fake company
- toxic workplace
- abusive management
- exploitative employer
- discriminatory employer

### 4.3 Red flag publication thresholds

#### Severe red flag

**Requires:**

- min 2 independent Tier 1 sources **OR**
- 1 registry / legal source

**Mandatory:** human review

#### Medium warning

**Requires:**

- Tier 1 + corroboration **OR**
- multiple Tier 2 sources

#### Low warning

**Allowed:** soft wording only

---

## 5. Confidence Rules

Each finding must include:

- **confidence level:** low | medium | high
- **source tier**

**Rules:**

- Tier 3 only → **low** max
- inference-only → **low** max
- severe → **high** only (when severe is permitted at all — see §4.3)

**Low-confidence aggregate:** total influence capped per score.

---

## 6. Personal Data / Privacy

JobRadar must follow:

- UK GDPR
- GDPR

**Principles:**

- data minimisation
- purpose limitation
- storage limitation

**Allowed:**

- employer name
- company registry info
- public job offer metadata

**Forbidden:**

- employee names
- personal allegations
- private addresses
- personal contact details

**Mandatory:** PII sanitization before persistence.

**Raw content:** TTL enforced; scheduled deletion required.

---

## 7. Human Review Policy

**Mandatory human review for:**

- inactive / dissolved company
- fraud suspicion
- severe registry mismatch
- legal dispute allegations
- bankruptcy implication
- severe risk downgrade

**Reviewer actions:**

- approve
- downgrade severity
- suppress finding
- request rescan

**Audit required:**

- reviewer id
- timestamp
- action reason

---

## 8. Complaint / Notice & Action

### 8.1 User / employer complaint channels

**Must provide:**

- in-product report issue button
- trust email inbox

**Categories:**

- factual inaccuracy
- outdated information
- harmful content concern
- legal notice

### 8.2 Complaint SLA

**Required:**

- acknowledgement: within 24 business hours
- first review: within 72 hours
- resolution target: within 14 days

**Urgent legal:** triage within 4 hours

### 8.3 Complaint flow

1. complaint created
2. disputed finding marked pending review
3. severe findings temporarily hidden
4. source audit
5. decision: keep | revise | suppress
6. audit log update

---

## 9. Traceability / Audit

**Every finding must store:**

- scan_id
- report_id
- source_ids
- source_tiers
- source hash
- confidence
- scoring_version
- parser_version
- override_applied
- override_reason

**Complaint links:**

- complaint_id
- resolution status

---

## 10. Freshness Policy

**Mandatory:**

- last_scanned_at
- freshness_hours
- freshness_status

**Rules:**

- active job reports: stale after **72h**
- employer profile: stale after **30d**

**UI:** stale warning required

---

## 11. Kill Switch

**Must support feature flags to disable:**

- reputation findings
- severe alerts
- registry severe outputs
- all JobRadar reports

**Must:** work without deploy

**Owner:** Trust & Safety lead; engineering on-call

---

## 12. Launch Safety Checklist

**Launch blocked unless all true:**

### Product

- [ ] private-only access
- [ ] no public pages
- [ ] complaint flow live
- [ ] confidence visible
- [ ] stale warning live

### Backend

- [ ] source traceability complete
- [ ] audit logs live
- [ ] PII sanitization live
- [ ] raw TTL live
- [ ] kill switch live

### Trust

- [ ] human review workflow live
- [ ] escalation owner assigned
- [ ] moderation inbox monitored

### Legal

- [ ] Terms updated
- [ ] Privacy reviewed
- [ ] external legal review completed

---

## 13. Review / Governance

**Policy review:**

- every quarter
- before new geography launch
- before enabling public pages

**Owners:**

- Product lead
- Trust & Safety
- Legal reviewer
