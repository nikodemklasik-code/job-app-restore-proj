# Job Radar Salary Search Canon

Status: canonical product rule  
Audience: Product, Frontend, Backend, QC

---

## 1. Product Placement

Salary Search belongs inside Job Radar.
It must not replace UK Salary Calculator.

### Route ownership
- `/jobs` = job cards, discovery, filters, saved / hidden / applied state.
- `/job-radar` = opportunity intelligence, employer context, signals, watchlist, salary-condition search.
- `/salary-calculator` = UK Salary Calculator only.

UK Salary Calculator remains a separate utility for take-home and comparison calculations.

---

## 2. Salary Search Purpose

Salary Search helps the user find better job opportunities from a financial condition.

The user should be able to search by:
- role / profession;
- skills;
- location;
- work mode;
- minimum salary threshold, e.g. jobs from £55k.

The output should help the user understand which opportunities deserve attention first.

---

## 3. Jobs Screen Relationship

The Jobs screen should show job offers as cards.

Recommended vertical order:
1. Hero / Search Header
2. Filters / Preferences
3. Recommended Matches
4. Job Cards Grid

Job cards should include:
- role title;
- employer;
- location;
- work mode;
- salary if visible;
- source;
- posted / detected date;
- basic match note;
- saved / hidden / applied state;
- CTA to send to Job Radar.

Jobs is discovery. Job Radar is intelligence.

---

## 4. Job Radar Standard Layer

The standard Job Radar layer may show basic opportunity facts without charging credits.

Standard facts include:
- listed salary;
- holiday allowance if listed;
- listed benefits;
- location;
- work mode;
- source;
- posted date;
- listing URL;
- basic employer / listing metadata.

---

## 5. Paid Layer

Salary Search and deeper employer context are paid Job Radar actions.

### Default cost
Salary Search / Advanced Employer Context = 2 credits.

### Backend feature key
`job_radar_salary_search`

### Product label
`Job Radar · Salary Search`

### CTA wording
Use:
- `Search For 2 Credits`
- `Get More Employer Context · 2 Credits`

Do not use wording that implies a formal investigation or legal finding.

---

## 6. Legal-safe UI Language

Job Radar must describe observable context. It must not label an employer as risky, unsafe, suspicious, or bad.

### Forbidden UI labels
Do not use:
- Risk;
- Risk Signal;
- Red Flag;
- Suspicious;
- Bad Employer;
- Unsafe Employer;
- Employer Risk Review.

### Preferred UI labels
Use:
- Employer Context;
- Listing Clarity;
- Source Consistency;
- Public Information Summary;
- Things To Check;
- More Context Needed;
- Information Available;
- Information Missing;
- Confidence;
- Review Before Applying.

### Operating rule
Describe what is visible. Do not label what it means.

Example:
- Some details are not visible in the listing, including salary range, holiday allowance, or interview process.

Not:
- This employer is risky.

---

## 7. Advanced Employer Context Scope

Advanced Employer Context may summarize publicly visible information such as:
- employer website information;
- public company information where relevant;
- public articles;
- public social presence;
- community discussion summary;
- benefits clarity;
- listing clarity;
- source consistency;
- questions to check before applying.

The output must distinguish:
- visible information;
- missing information;
- uncertainty;
- next checks.

It must not make factual claims that are not supported by visible sources.

---

## 8. Billing Rule

Salary Search is a fixed-cost credit action by default.

The UI must show the cost before the user starts the action.
The backend must be the source of truth for the debit.
The frontend must not deduct credits directly.

Required billing flow:
1. show cost;
2. approve spend;
3. run search;
4. settle through backend billing engine;
5. show updated balance / usage history.

---

## 9. QC Checklist

QC must confirm:
- Salary Search is inside Job Radar;
- UK Salary Calculator remains separate;
- Jobs still shows job offers as cards;
- Salary Search cost is visible before execution;
- backend feature key exists before runtime activation;
- no forbidden employer labels appear in UI;
- output uses neutral context language;
- standard facts remain accessible without paid deep context;
- paid action uses the billing engine.
