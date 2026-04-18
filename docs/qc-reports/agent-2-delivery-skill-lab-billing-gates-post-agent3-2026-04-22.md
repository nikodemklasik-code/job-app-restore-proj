# Agent 2 — §6 intake (post Agent 3 review) — bramki billing trzech kluczy — 2026-04-22

## §6 — Intake

### Scope You Are Implementing Now

Jedna rzecz: **symetria testów hermetycznych** dla odmowy `approveSpend` (`INSUFFICIENT_FUNDS` → `FORBIDDEN`, brak `commitSpend`) dla wszystkich trzech kluczy:

- `skill_lab_gap_analysis` — `skillLab.analyzeJobGap`
- `skill_lab_course_suggest` — `style.suggestCoursesForSkill`
- `style_analyze_document` — `style.analyzeDocument` (test już był; pozostaje referencją w tym samym pliku)

Implementacja produktowa tych ścieżek pozostaje w commicie bazowym (`feat(billing): skill_lab_gap_analysis, skill_lab_course_suggest, style_analyze_document`); ten slice **nie** zmienia routerów poza testami.

### Existing Reports Checked

- `docs/qc-reports/agent-2-delivery-skill-lab-ai-billing-engine-2026-04-21.md` — pierwszy §6 dla wdrożenia silnika + routerów.
- Kontekst domknięcia intake Agenta 3 (dokumentacja QC; **bez** nowego zakresu Interview / Negotiation w tym slice).

### Files You Will Change

- `backend/src/trpc/routers/__tests__/style-skillLab-billing.spec.ts`
- `docs/qc-reports/agent-2-delivery-skill-lab-billing-gates-post-agent3-2026-04-22.md` (ten plik)

### Delivery Report Path

`docs/qc-reports/agent-2-delivery-skill-lab-billing-gates-post-agent3-2026-04-22.md`

### Ready For QC Target

**Ready For QC** — etykieta: **Agent 2 — billing gate tests (INSUFFICIENT_FUNDS) dla `skill_lab_gap_analysis` + `skill_lab_course_suggest` (+ parity `style_analyze_document`)**. Brak §8 = nie Approved.

### Czego ten slice nie obejmuje

- Legacy Interview / Negotiation (brak zmian w tych modułach).
- Nowe klucze `FEATURE_KEYS`, zmiany limitów w `creditsConfig`, UI billing poza testami backendu.
- Legal Hub, Job Radar, Coach, Live Interview.
