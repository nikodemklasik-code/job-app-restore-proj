# Skill Lab & Job Radar refactor — podział na 3 deweloperów (v1.0)

> **Uwaga:** Globalna kolejność — [`../squad/README.md`](../squad/README.md). Poniższy podział **A/B/C** to **szczegół pracy nad folderem `skill-lab-job-radar-refactor/`**; Agent 2 na workboardzie łączy Skill Lab + Job Radar + Legal w fazach.

**Źródło:** [`skill-lab-job-radar-refactor/`](./skill-lab-job-radar-refactor/README.md) (import + pliki rozbite).

**Instrukcja dla zespołu:** pracujecie **wyłącznie** w zakresie poniżej; przed merge `cd /Users/nikodem/job-app-restore/proj/frontend && npm run build`.

---

## Wspólne polecenie (wklej każdemu)

```text
Refactor Skill Lab into a value-first capability intelligence module with visible salary impact, CV Value Signals, verification, and course-to-skill mapping; refactor Job Radar into a premium live opportunity intelligence module with a clean route identity, strong opportunity cards, clear fit and risk signals, visible credit logic, and no admin-panel feel.
```

---

## Który deweloper czyta który plik MD

| Deweloper | Lektury (`docs/features/skill-lab-job-radar-refactor/`) | Wspólne |
|-----------|-----------------------------------------------------------|---------|
| **A** | [`skill-lab-v1.0.md`](./skill-lab-job-radar-refactor/skill-lab-v1.0.md) · [`credits-billing-alignment-v1.0.md`](./skill-lab-job-radar-refactor/credits-billing-alignment-v1.0.md) | [`qc-files-instructions-v1.0.md`](./skill-lab-job-radar-refactor/qc-files-instructions-v1.0.md) · [`developer-qc-one-liners-v1.0.md`](./skill-lab-job-radar-refactor/developer-qc-one-liners-v1.0.md) |
| **B** | [`job-radar-v1.0.md`](./skill-lab-job-radar-refactor/job-radar-v1.0.md) · [`credits-billing-alignment-v1.0.md`](./skill-lab-job-radar-refactor/credits-billing-alignment-v1.0.md) | jak wyżej |
| **C** | Wszystkie pliki `.md` w folderze (przegląd integracyjny) + [`../practice-refactor/billing-credits-v1.0.md`](../practice-refactor/billing-credits-v1.0.md) | jak wyżej |

**Pełny monolit:** [`skill-lab-job-radar-refactor/_imported-full-spec-v1.0.md`](./skill-lab-job-radar-refactor/_imported-full-spec-v1.0.md)

---

## Deweloper A — Skill Lab (inteligencja wartości)

### Zakres

- Refaktor **`frontend/src/app/skills/`** (i powiązanych feature’ów) pod [`skill-lab-v1.0.md`](./skill-lab-job-radar-refactor/skill-lab-v1.0.md): sekcje, CV Value Signals na wierzchu, salary impact, powiązania kursów ze skillami, weryfikacja actionable.  
- Nowe lub przeniesione komponenty pod **`frontend/src/features/skill-lab/components/`** (lista w specu).  
- **Widoczna logika kredytów** dla akcji Skill Lab (Free / fixed / estimated zgodnie ze specu).  
- **Nie mieszać:** Job Radar, głównego edytora profilu jako primary, layoutu asystenta.

### Definition of Done (A)

- [ ] Skill Lab czyta się jak „career intelligence”, nie lista tagów.  
- [ ] Kredyty: koszt lub estymata przed spendem.  
- [ ] Build frontendu OK.

---

## Deweloper B — Job Radar (inteligencja ofert)

### Zakres

- Uporządkowanie **tożsamości routingu**: dziś w repo są **`/radar`** i **`/job-radar/*`** — zgodnie z [`job-radar-v1.0.md`](./skill-lab-job-radar-refactor/job-radar-v1.0.md) wybrać **jeden** czytelny wzorzec (docelowo `/job-radar`), bez podwójnego produktu bez wyjaśnienia.  
- Refaktor **`frontend/src/app/radar/`**, **`frontend/src/app/job-radar/`**, `router.tsx`, linków w sidebarze.  
- Karty ofert: fit, risk, freshness, **Why this is on your radar**, akcje (Open, Save lead, Watchlist, …).  
- Komponenty pod **`frontend/src/features/job-radar/components/`** (lista w specu).  
- **Widoczna logika kredytów** dla akcji Job Radar.

### Zależności względem A

- Możliwie równolegle po ustaleniu **wspólnego pliku konfiguracji kredytów** z **C** (żeby nie dublować liczb).

### Definition of Done (B)

- [ ] Job Radar nie wygląda jak panel admina ani surowy scrape feed.  
- [ ] Routing nie wprowadza użytkownika w dwie mylące „prawdziwe” Radary.  
- [ ] Build frontendu OK.

---

## Deweloper C — Integracja kredytów, Billing, QC

### Zakres

- Urealnienie [`credits-billing-alignment-v1.0.md`](./skill-lab-job-radar-refactor/credits-billing-alignment-v1.0.md): wspólny moduł stałych / typów kosztów (np. `lib/creditsConfig.ts`) używany przez **A** i **B** oraz spójny z trackiem **practice-refactor** (Billing credits-first).  
- Koordynacja z osobą robiącą **Billing** w [`practice-modules-refactor-three-developer-split-v1.0.md`](./practice-modules-refactor-three-developer-split-v1.0.md) (Deweloper C tam = negocjacje + billing — **ta sama osoba lub sync PR**, żeby nie rozbić `billingStore`).  
- Przegląd końcowy wg **one-line QC** w [`developer-qc-one-liners-v1.0.md`](./skill-lab-job-radar-refactor/developer-qc-one-liners-v1.0.md) oraz checklista w [`qc-files-instructions-v1.0.md`](./skill-lab-job-radar-refactor/qc-files-instructions-v1.0.md).

### Definition of Done (C)

- [ ] Brak ukrytych kosztów; estimate + approval tam gdzie spec.  
- [ ] Liczby kredytów Skill Lab / Job Radar zgodne z dokumentacją i jednym źródłem w kodzie.  
- [ ] Checklista QC z `qc-files-instructions` + one-liner QC z `developer-qc-one-liners` przechodzą na stagingu.

---

## Kolejność merge (zalecana)

1. **C** wystawia szkielet **`creditsConfig`** (same typy + stałe z obu speców — bez pełnego UI Billing jeśli robi to inny track).  
2. **A** i **B** rebase na branch z (1).  
3. Równolegle A i B do swoich modułów; konflikty rozstrzygać w plikach modułowych, nie w `creditsConfig` bez uzgodnienia.  
4. **C** finalny pass + QC.

---

## Historia

| Data | Zmiana |
|------|--------|
| 2026-04-18 | v1.0 — import speca, podział A/B/C, obowiązek pracy; dopisek: monolit ze `Skill_Lab_And_Job_Radar_Refactor_Spec 2.md`, one-linery w [`developer-qc-one-liners-v1.0.md`](./skill-lab-job-radar-refactor/developer-qc-one-liners-v1.0.md), README — skrót + „dwa poziomy”. |
