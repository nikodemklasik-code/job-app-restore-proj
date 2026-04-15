# JobRadar — Frontend + Trust UI Spec v1.0

**Last updated:** 2026-04-15  
**Aligns with:** [`job-radar-product-interaction-spec-v1.0.md`](./job-radar-product-interaction-spec-v1.0.md), [`job-radar-legal-safety-policy-v1.0.md`](./job-radar-legal-safety-policy-v1.0.md)

**Goal:** One contract for **candidate report UI**, **trust actions**, and **admin/trust review** — decision-support tone, evidence-first, no “employer blacklist” framing.

---

## 1. Purpose

- Readable, **defensive** report layout.  
- **Facts vs model** clearly separated.  
- End users never see `pending_review` / `suppressed` findings (unless a deliberate soft placeholder is added later).  
- **Report issue** / harmful-content flows from the report.  
- **Trust/admin** has a minimal panel for complaints, finding review, and kill-switch.

---

## 2. Main screens

### A. Scan entry

- CTA **Start JobRadar scan**; fields: employer name, job title, location, source URL (as product defines).  
- Actions: start, back, clear.

### B. Scan processing

- Title: scanning in progress; short explainer.  
- **Progress card** per pipeline stage (`pending` | `processing` | `done` | `partial` | `failed` | `blocked`).  
- CTA: refresh, close.  
- If scan becomes **partial_report**, show partial report instead of endless spinner.

### C. Report (primary)

Vertical order (evidence-first):

1. Header (employer, role, location, status, **freshness**, **confidence**).  
2. Top summary (recommendation + key metrics — **neutral** styling).  
3. **Verified public information** (company / offer / registry / benchmark provenance).  
4. **Model observations** (explicitly labelled; short copy + confidence + “what influenced this” expandable).  
5. Findings (key findings, red flags, **missing data**).  
6. Score drivers (accordion).  
7. Sources list (type, tier, collected_at, URL — **no raw body dump**).  
8. Footer actions: rescan, **report issue**, save (compare later optional).

---

## 3. Visibility rules

| Audience | Findings shown |
| --- | --- |
| Candidate | `visibility === visible` only |
| Trust/admin | `visible`, `pending_review`, `suppressed` + review metadata |

Optional later: soft message when some content is under review.

---

## 4. Complaint flow (candidate)

- Entry: **Report issue** in report header and optionally per finding.  
- Modal: complaint type (factual inaccuracy, outdated, harmful content, legal concern), optional finding selector, message, submit/cancel.  
- Success: confirmation copy.  
- For **harmful_content** / **legal_notice** on a finding, backend may set finding to `pending_review`; next **getReport** hides it.

---

## 5. Trust / admin panel

### 5.1 Complaints list

- Table: id, created_at, type, status, report_id, scan_id, finding_id, message preview.  
- Filters: status, type, date, scan_id.  
- Row actions: open complaint, open report, open finding.

### 5.2 Complaint detail

- Metadata + related report/finding snapshot + **review actions**: keep visible, keep pending, suppress; optional reject path; reviewer note required; mark resolved.

### 5.3 Kill switch

- Three toggles: disable all reports; disable reputation findings; disable severe registry alerts; confirm modal; show last changed (when backed by audit).

---

## 6. Backend mapping (tRPC)

Procedures (names in router):

| Procedure | Who | Purpose |
| --- | --- | --- |
| `jobRadar.getReport` | Owner | Report + **live** filtering for visibility + kill-switch |
| `jobRadar.createComplaint` | Owner | Create complaint; may set finding `pending_review` |
| `jobRadar.adminListComplaints` | Trust | List complaints (`status`, `scanId` filters) |
| `jobRadar.adminGetComplaint` | Trust | Complaint by id |
| `jobRadar.adminReviewFinding` | Trust | Visibility + resolve linked complaint |
| `jobRadar.adminUpdateKillSwitch` | Trust | Update kill-switch flags |

**Trust guard:** set `JOB_RADAR_TRUST_REVIEWER_USER_IDS` to a comma-separated list of **internal app user ids** allowed to call admin procedures. If unset, admin procedures return **403** for everyone.

---

## 7. Component tree (proposal)

```
JobRadarReportPage
  ReportHeader
  RecommendationBanner
  ScoreCardsGrid
  VerifiedInfoSection
  ModelObservationsSection
  FindingsSection
  ScoreDriversAccordion
  SourcesSection
  ReportActionsBar
  ComplaintModal

JobRadarAdminComplaintsPage
  ComplaintsFilterBar
  ComplaintsTable
  ComplaintDetailDrawer
  ReviewActionPanel
  KillSwitchPanel
```

---

## 8. Design & copy rules

- Tone: **neutral**, informative, non-accusatory.  
- Colour: **caution**, not scandal; avoid hero “bad employer” reds.  
- Prefer policy-safe phrases (see Legal Safety Policy).

---

## 9. Acceptance criteria (MVP)

**Report**

- Scores + freshness + confidence visible.  
- Verified vs model sections **separate**.  
- Pending/suppressed findings **not** shown to candidate.  
- Missing data + sources visible.  
- Report issue visible.

**Complaint**

- Submit from report; optional finding; success state.

**Admin**

- List complaints; review finding (visibility + resolve); toggle kill-switch.

---

## 10. Ops

- Apply MySQL DDL: [`job-radar-mysql-006-complaints.sql`](./job-radar-mysql-006-complaints.sql) before using complaint APIs in production.
