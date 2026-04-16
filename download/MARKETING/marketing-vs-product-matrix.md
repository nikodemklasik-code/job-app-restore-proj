# Marketing ZIP vs MultivoHub — full feature matrix

**Source:** every bullet from `job-app-marketing.zip` → `client/src/pages/Home.tsx` (hero, all “Complete Feature Set” arrays, pricing bullets, competitor table, security measures table, industry security table, roadmap cards), plus explicit ZIP/product gaps.

**One consolidated table (212 rows, 4 columns):** import into Excel / Google Sheets → layout for PDF:

- **[marketing-vs-product-matrix-full.csv](./marketing-vs-product-matrix-full.csv)**  
  Columns: `Marketing (ZIP)` · `MultivoHub (product)` · `%` · `Notes (PDF-short)`

**% scale:** `100%` = matches product; `70–90%` = core OK, naming/depth differs; `40–60%` = partial or needs audit; `0%` = missing or false claim; `N/A` = not a % fit (branding / gap row).

**Why CSV, not one giant Markdown table:** the full matrix is ~210 rows; Markdown tables become hard to edit and PDF layout is easier from a spreadsheet.

**Row groups inside the CSV (in order):**

1. Hero (5) — includes unverified KPI stats.  
2. Interview Practice (12).  
3. Daily Warmup (10).  
4. Auto Apply (8).  
5. Job Discovery & tracking (14).  
6. Dashboard & analytics (8).  
7. Skills Lab & learning (8).  
8. Profile & CV (13).  
9. Email & follow-up (8).  
10. Negotiation Coach (8).  
11. AI Assistant (8).  
12. Notifications (6).  
13. Tools & utilities (18).  
14. Free / Pro / Autopilot pricing bullets (27 + Autopilot price mismatch row).  
15. Competitor comparison table (14).  
16. Security mechanisms from ZIP table (18).  
17. Industry standards comparison (10).  
18. Roadmap “Coming Soon” cards (6).  
19. **Annex:** MultivoHub surfaces **not** listed on the ZIP landing (9 rows — `(ZIP omits) …`).

**Known ZIP contradictions (see CSV rows):** Autopilot **£39** vs product **£24.99**; “Outreach Assist” in pricing but **not** in codebase; “Job Radar” in Skills vs **role-scan Job Radar** at `/job-radar`; roadmap vs pricing for Follow-up / Autopilot queue; activity **heatmap** absent; **Ghosted** status absent; **DOCX/TXT** upload absent.

---

*Regenerate CSV after marketing ZIP changes by re-deriving bullets from `Home.tsx`.*
