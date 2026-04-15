# JobRadar — Product Interaction Spec v1.0

**Decision-support UX + legal-safe interaction model**

**Document type:** Product / UX / trust / legal alignment (single source of truth for IA, copy, and behaviour)  
**Last updated:** 2026-04-15  
**Audience:** Product, design, frontend, backend, trust / legal  
**Related:** [`job-radar-legal-trust-policy-v1.0.md`](./job-radar-legal-trust-policy-v1.0.md), [`job-radar-legal-safety-policy-v1.0.md`](./job-radar-legal-safety-policy-v1.0.md), [`job-radar-frontend-trust-ui-spec-v1.0.md`](./job-radar-frontend-trust-ui-spec-v1.0.md)

**Purpose:** Stop guesswork across teams. One framing: **private candidate decision support** — evidence-first, confidence-visible, legally defensive. **Not** a public reputation engine, blacklist, or accusation product.

---

## 0. Core principle (overrides everything else)

JobRadar is a **private candidate decision-support assistant**. It helps users understand:

- How **transparent** a job offer is  
- How **complete** public employer information is  
- How the role **compares to the market** (signals, not verdicts)  
- **What to ask** before accepting an offer  

**Explicitly not:**

- Public employer ranking platform  
- Reputation publishing tool  
- Blacklist or “name and shame” surface  
- Accusation engine  

**Consequence for frontend, copy, scoring, and interactions**

- Avoid **definitive claims** unless **source tier is high** and **confidence is high**  
- Always **separate facts from inferences**  
- Make **uncertainty** visible (confidence + freshness + missing data)  

---

## 1. UX philosophy

**Main model:** Evidence → Confidence → Interpretation → Action  

**Not:** Verdict → emotion → fear  

**Mental flow for the user**

1. What do we know?  
2. How trustworthy is it?  
3. What does this mean for me?  
4. What should I do next?  

Trust is built through **clarity**, not through panic before signing a contract.

---

## 2. Global interaction rules

### Rule 1 — Facts always separated from model suggestions

**A. Verified public information**  
Structured facts: registry, official job page, offer metadata, salary **if disclosed**.

**B. Model observations**  
Derived: likely transparency issues, fit signals, benchmark mismatch, process hints.

**Never mix in copy**

| Bad | Good |
| --- | --- |
| “Company underpays staff.” | “Public compensation signals are **below** the benchmark range for similar roles in the selected market window.” |

UI **sections** must reflect this split (dedicated regions; never one blended paragraph).

### Rule 2 — Confidence and freshness always visible

Every **insight**, **score**, and **recommendation** must surface:

- Confidence (e.g. low / medium / high, with **why** when material)  
- Freshness (e.g. “Updated 8h ago”, stale badge when policy applies)  

Optional: “How confidence works” (tooltip or help).

### Rule 3 — Missing data is product output

Missing data ≠ silence.

Surface explicitly, for example:

- Salary not disclosed  
- Unclear work mode  
- Benefits missing  

This improves user trust and legal defensibility.

### Rule 4 — Product must suggest a next action

Every report answers: **“What should the user do now?”**

Examples:

- Ask the recruiter about salary range  
- Request a team interview  
- Compare with another offer  
- Wait for a refreshed scan / rescan when eligible  

---

## 3. Primary user flows

### Flow A — Start scan

**Entry points:** saved job, search results, manual employer lookup, pasted URL.

**Screen: Start scan**

- **Header:** “Research this employer and offer”  
- **Subtext:** “JobRadar scans **public** information to help you evaluate transparency, pay signals, and fit.”  
- **Inputs:** employer name, job title, location, source URL (optional)  
- **CTA:** Start scan  
- **Legal helper (small):** “Reports are based on public data and may be incomplete.”  

### Flow B — Scan in progress

**Screen:** Scan progress  

- **Headline:** e.g. “Scanning public sources”  
- **Body:** “We’re collecting public employer and offer data.”  
- **Stages (real transitions, no fake theatre):** employer info → offer details → compensation benchmark → hiring signals → report build  

### Flow C — Report ready

**1. Report header**  
Employer, job title, location, freshness, confidence. CTAs: **Report issue**, **Rescan**.  
Tone: **no dramatic language.**

| Bad | Good |
| --- | --- |
| “Dangerous employer.” | “Some public signals may require additional review.” |

**2. What we know (top section)**  
Structured blocks only:

- **Offer facts** — salary disclosed?, work mode?, benefits?  
- **Employer facts** — registry, size band, official site where applicable  
- **Hiring facts** — posting frequency / consistency **only** when sourced and policy allows  

Rules: structured facts only; source links optional but traceability must exist in the product backend.

**3. Data quality / confidence panel (prominent)**  
Overall confidence; salary / transparency / fit as needed; freshness; **short “why”** (e.g. “Salary confidence is medium because only one public listing disclosed compensation.”).

**4. What JobRadar suggests (interpretation)**  
Cards such as: offer transparency; compensation competitiveness; fit alignment; caution signals.  
Each: summary + confidence + “why”.  
**Language:** no absolute moral claims (see §7).

**5. Missing information (mandatory)**  
List gaps + **“Questions worth asking the recruiter”** (curated examples).

**6. Recommendation / next action**  
Labels may map to product enums (e.g. strong fit / worth clarifying / compare / proceed with caution) but **copy** must qualify:

> “Based on **currently available** public signals …”

CTAs: compare another role, save report, rescan in 72h (when product policy allows).

---

## 4. Information architecture (IA) and progressive disclosure

**Recommended vertical order (aligns with §3)**

1. What we know (verified + listing facts, sources attached where shown)  
2. How reliable it is (confidence, tier, freshness)  
3. What the model suggests (explicitly labelled **model observations**)  
4. What is missing (gaps, stale data)  
5. What you should do next (**next best action** — primary CTA)

Avoid leading with a giant score, three red badges, or tabloid HR drama.

**Three disclosure levels**

1. **Summary** — recommendation label (policy-constrained), overall confidence, missing-data summary, next best action, trust entry points  
2. **Reasoning** — score drivers, findings with confidence + source class, tier legend  
3. **Deep evidence** — source list (URLs where allowed), provenance, parser/scoring versions as product allows  

---

## 5. Complaint and correction flow (trust product)

**Entry**

- Global **Report issue**  
- Optional **per finding** (where a stable finding id exists)

**Types**

- Incorrect fact  
- Outdated data  
- Harmful phrasing  
- Legal concern  

**UX**

- Simple modal: category + message  
- Confirmation: “We’ve received your report and will review it.”  

**System behaviour (align with backend policy)**

For **harmful content** and **legal concern** on a **specific finding**: auto **pending review** where implemented.

---

## 6. Trust and review model (visibility)

**Finding states**

| State | Meaning |
| --- | --- |
| `visible` | User sees content |
| `pending_review` | User sees placeholder or soft copy: “Some information is under review.” |
| `suppressed` | User does not see the finding |

**Admin / trust**

- Full audit trail, complaint source, reviewer note (internal tools; see Frontend + Trust UI spec).

---

## 7. Legal-safe content engine (product layer)

### A. Never claim intent

| Bad | Good |
| --- | --- |
| “Employer exploits workers.” | “Publicly available compensation signals appear **below** market benchmarks for comparable roles.” |

### B. Never diagnose culture as fact

| Bad | Good |
| --- | --- |
| “Toxic workplace.” | “Public employee sentiment signals are **mixed** and confidence is **low**.” |

### C. Never imply undisclosed certainty

Prefer: **may**, **suggest**, **indicate**, **limited public signals**.

### D. Sensitive red flags — downgrade logic

If a signal is **forum-only**, **Reddit-only**, or **anonymous review-only**:

- No headline “alert” treatment  
- **Low** confidence only unless corroborated by stronger tiers  
- Do not drive recommendation alone  

Raw internal labels are transformed through the **language policy** into safe UI copy (align with Legal Safety Policy).

---

## 8. Dynamic report states (UX)

| Pipeline / report state | UX |
| --- | --- |
| `processing` | Scan progress; live stages |
| `partial_report` | Report + banner: “Some sources could not be reached.” |
| Stale (freshness policy) | Report + stale treatment + rescan CTA when eligible |
| `sources_blocked` | Partial report + “Some employer sources restrict automated access.” |
| `scan_failed` | Safe retry UI; no blame copy |

---

## 9. Design system rules

- **Calm, analytical, neutral**  
- Avoid: red panic UI, sensational alerts, gamified employer shaming  
- Prefer: muted emphasis, evidence tables, subtle caution markers  

---

## 10. Private beta safeguards

Must show (banner or footer on report):

> “This report is **experimental** and based on **public** information.”

**Beta limitations (product policy)**

- No share links  
- No indexing / public SEO pages for reports  
- Do not encourage screenshots in UI copy  

**Monitoring**

- Complaint rate  
- False-positive signals (qualitative + trust review)  
- Rescan frequency  
- Scan failures  

---

## 11. KPIs that matter (not vanity)

Measure:

- % reports viewed to the **end** (scroll depth or section completion)  
- % users taking a **documented next action** (compare, save, rescan, export if allowed)  
- % users **rescanning** after stale / partial  
- Qualitative: “helped my decision” (in-app survey when product adds it)  
- **Complaint rate** (and time-to-triage for trust)  

---

## 12. Final product truth

JobRadar wins if the user says:

> “This helped me make a **smarter** decision.”

Not:

> “This app **roasted** my future employer.”

The second gets attention for three weeks and lawyers for two years.

---

## 13. Scoring architecture (UX-facing)

Present scoring as **modular streams**, not one monolithic “employer verdict”:

- Data completeness  
- Offer transparency  
- Compensation context (model + sources)  
- Employer verification (facts — careful wording)  
- Candidate fit (model)  
- Risk **signals** (capped, explained — not a moral label)

**Composition model**

1. Engines compute sub-scores / signals  
2. **Policy** constrains what can surface and at what severity  
3. **Language / product layer** publishes compliant copy  

---

## 14. Implementation note (engineering)

This spec is **UX, IA, and content architecture**. Backend contracts should expose enough structure (per-block metadata, confidence reasons, freshness, source tier, finding ids for trust) so the UI does not fake provenance. Align fields with [`job-radar-openapi-v1.1.yaml`](./job-radar-openapi-v1.1.yaml) and tRPC procedures over time.

---

## 15. Ownership

| Area | Owns |
| --- | --- |
| Product / design | IA, flows, progressive disclosure, visual tone |
| Content / trust | Language rules, forbidden terms, complaint copy |
| Engineering | Structured report model, scan states, trust APIs |
| Legal (external) | Review before public launch or materially new surfaces |

**Default:** defensive. Revisit this document when adding sharing, public pages, rankings, or employer-facing surfaces.
