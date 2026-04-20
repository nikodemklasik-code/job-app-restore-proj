# Job Radar — refactor spec (v1.0)

Index: [`README.md`](./README.md)

---

## Canonical name

**Job Radar**

## Purpose

Job Radar is the live opportunity intelligence layer.

It must help the user understand:

- what opportunities matter right now  
- what changed in the market  
- which listings are strong  
- which listings are risky  
- which employers deserve attention  
- which leads are worth acting on  
- which signals are promising, unclear, or suspicious  

## Emotional effect

The user should feel:

- informed  
- alert  
- ahead of the market  
- selective rather than overwhelmed  
- guided toward better opportunities  

## What Job Radar is

Job Radar is:

- opportunity intelligence  
- employer signal monitoring  
- listing prioritisation  
- fit + risk interpretation  
- watchlist tracking  
- source monitoring  
- action-focused search support  

## What Job Radar is not

Job Radar is not:

- a dead job board  
- a scrape dump  
- a moderation table  
- a plain admin feed  
- a duplicate of Jobs  
- a static employer directory  

---

## Main views

- **Overview**  
- **Opportunities**  
- **Watchlist**  
- **Employers**  
- **Signals**  
- **Sources**  
- **Alerts**  

---

## Main screen structure

- **Radar Hero Header**  
- **Radar Summary Strip**  
- **Search And Filters**  
- **Opportunity Grid**  
- **Insight Rail**  
- **Employer Watchlist**  
- **Alerts Panel**  

---

## Required opportunity card fields

Each opportunity card must show:

- **Role Title**  
- **Employer**  
- **Location**  
- **Work Mode**  
- **Source**  
- **Posted / Detected Time**  
- **Salary**  
- **Fit Signal**  
- **Risk Signal**  
- **Freshness**  
- **Why This Is On Your Radar**  
- **Watchlist State**  
- **Listing Status**  

---

## Required product logic

### A. Fit and risk must be visible

Each card must clearly show:

- fit  
- risk  
- freshness  
- why it matters  

### B. “Why this match” must exist

Every listing needs a short AI summary: **Why This Is On Your Radar**

Examples:

- **Strong match for your target role and recent experience**  
- **High salary upside but low listing clarity**  
- **New listing from a monitored employer**  
- **Relevant role with possible red flags in wording**  

### C. Employer context must matter

The user must be able to see:

- employer changes  
- risk patterns  
- source trust  
- repeated listing behaviour  
- watchlist events  

### D. Job Radar must lead to action

The module must not be passive.

Each listing should support actions such as:

- **Open Listing**  
- **Save Lead**  
- **Add To Watchlist**  
- **Open In Applications**  
- **Review Employer**  
- **Hide**  

---

## Credit logic

### Free

- **Browse Signals**  
- **Basic Search**  
- **Basic Watchlist View**  

### Fixed credit actions

- **Why This Match** = **1 Credit**  
- **Employer Quick Review** = **2 Credits**  
- **Deep Listing Analysis** = **2 Credits**  
- **Employer Pattern Review** = **3 Credits**  
- **Advanced Radar Scan** = **4 Credits**  

### Estimated cost actions

For heavier employer / market synthesis:

- **Deep Employer Review**  
- **Deep Market Pattern Review**  
- **Advanced Multi-Signal Scan**  

Display:

- **Estimated Cost**  
- **Maximum Cost Without Further Approval**  
- **Continue For X Credits**  

---

## Required front-end direction

Job Radar must feel:

- premium  
- alive  
- strategic  
- high-signal  
- visually richer than a standard dashboard  

Avoid:

- admin-panel ugliness  
- scrape-feed energy  
- flat grey listing tables  
- overcompressed cards  
- random unlabeled badges  

---

## Suggested components

```text
frontend/src/features/job-radar/components/
  RadarHeroHeader.tsx
  MetricCard.tsx
  OpportunityCard.tsx
  EmployerCard.tsx
  SignalBadge.tsx
  RiskBadge.tsx
  FitBadge.tsx
  WatchlistPanel.tsx
  InsightBlock.tsx
  SourceHealthCard.tsx
  AlertCard.tsx
  RadarFilterBar.tsx
  RadarActionBar.tsx
```

---

## Repo changes — route cleanup

The repo currently suggests overlapping Job Radar identities.

Unify and simplify routing so that the user clearly lands in the real Job Radar module.

### Required route direction

Choose one operational route pattern and keep it clean.

**Recommended:** `/job-radar`

Avoid keeping two overlapping product identities unless one is clearly only a landing / intro view.

*(Today in code: both `/radar` and `/job-radar/*` exist — refactor must resolve this per spec.)*

### Frontend outcome

Job Radar must clearly expose:

- overview  
- opportunity grid  
- watchlist  
- employer signals  
- source signals  
- alerts  

---

## What must never be mixed into Job Radar

- Skill Lab value intelligence  
- generic Jobs list without signal logic  
- admin moderation table design  
- vague employer cards with no action logic  
- duplicated route identity with unclear purpose  
