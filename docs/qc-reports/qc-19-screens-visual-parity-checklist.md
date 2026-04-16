# QC — 19 ekranów, spójność produktowa i „życie” UI (www)

**Cel:** strona **tip-top** zgodna z digestem **19 ekranów** + rozszerzonym specem; kolorystyka w obrębie **motywów** z `frontend/src/index.css` / `themeStore`; delikatny **glow / dynamika** tam, gdzie wspiera hierarchię — **bez** chaosu i **z** szacunkiem dla `prefers-reduced-motion`.

## Źródła prawdy (QC czyta przed oceną)

| Dokument | Rola |
|----------|------|
| [`docs/features/19-screens-for-users-and-agents.md`](../features/19-screens-for-users-and-agents.md) | Lista 19 ekranów, Title Case, sekcje, CTA — agent-ready |
| [`docs/features/product-screens-spec-v1.0.md`](../features/product-screens-spec-v1.0.md) | Bogatszy opis produktowy |
| [`docs/policies/unified-app-layout-and-theme-standard-v1.0.md`](../policies/unified-app-layout-and-theme-standard-v1.0.md) | Layout, lewa nawigacja, motywy |

## Globalna warstwa „dynamiki” (dev)

- Klasa utility **`.mvh-card-glow`** w `frontend/src/index.css`: lekki cień / obramowanie indigo przy **hover**; przy **`prefers-reduced-motion: reduce`** — tylko subtelna obwódka, **bez** przesunięcia.
- Dla motywów **`.theme-visually-impaired`**, **`.theme-overstimulated`**, **`.theme-gray-safe`**, **`.theme-noir`**, **`.theme-elegant`** — w `index.css` są **osobne** reguły hover (stonowany lift / obrys), żeby glow nie gryzł się z paletą (light / dark domyślne zostają przy standardowym indigo glow).
- QC: sprawdź, że na **dark default** karty nie „krzyczą”, a na **high contrast / overstimulated** nie psują czytelności (jeśli trzeba — **Not approved** z konkretnym ekranem).

### Agent A (UX / www) — rollout `.mvh-card-glow` (dev, do weryfikacji QC)

| # | Ekran | Zmiana (kod) |
|---|--------|----------------|
| 4 | Applications (`/applications`) | `Card` (loading / error / empty / lista), link Kanban, panel email + pusty wybór aplikacji — `mvh-card-glow`; empty state z CTA (Jobs, Document Lab). |
| 11 | Coach (`/coach`) | Kafelki kategorii, karta pytania, banner sesji, notice kredytów, chip avg score, karta wyniku — `mvh-card-glow`. |
| 15 | Skill Lab (`/skills`) | Panele (value signals, CV score, skills/courses, kolumny My Skills / Target), snapshot profilu, siatka sygnałów, artykuły skill→course, puste stany (brak linków / brak analizy / brak skills), linki szkoleń w Gap Analysis — `mvh-card-glow`. |

**QC:** potwierdź ręcznie **wszystkie motywy z `THEME_IDS` w `themeStore.ts`** (light, dark, high contrast, calm, gray safe, noir, elegant) oraz **`prefers-reduced-motion`** na tych trasach; po akceptacji można uznać punkty checklisty „brak glow / płaski layout” za **zamknięte** dla wierszy 4, 11, 15.

## Checklista — 19 ekranów (minimum na „Approved” wizualne)

Dla każdego wiersza: **zgodność treści/sekcji z digestem**, **Title Case** etykiet, **spójność z motywem**, **czy hover/glow** (jeśli dotyczy) jest akceptowalny.

| # | Ekran (digest) | Trasa / moduł (orientacyjnie) | Uwagi QC |
|---|----------------|--------------------------------|----------|
| 1 | Dashboard | `/dashboard` | Overview, next actions, snapshoty |
| 2 | Profile | `/profile` | Growth / roadmap copy, sekcje |
| 3 | Jobs | `/jobs` | Lista, źródła, sesje |
| 4 | Applications | `/applications` | Lista, stany, empty state — **glow rollout (Agent A)** |
| 5 | Applications Review | `/review` | Kolejka / filtry |
| 6 | Documents Upload | `/documents` | Upload / build |
| 7 | Style Studio | Style / Document Lab zakładki | Spójność z Documents |
| 8 | AI Assistant | `/assistant` | Disclaimer, layout czatu |
| 9 | AI Analysis | `/ai-analysis` | Shell vs spec koncepcji |
| 10 | Interview | `/interview` | Scroll, pro gate copy |
| 11 | Coach / Trainer | `/coach` | Kategorie, kafelki |
| 12 | Daily Warmup | `/warmup` | Spójność z resztą AI tiles |
| 13 | Negotiation | `/negotiation` | Pro gate, brak złego billing CTA |
| 14 | Job Radar | `/job-radar` | Start scan, raporty |
| 15 | Skill Lab | `/skills` | Profil, kursy, disclaimer — **glow rollout (Agent A)** |
| 16 | Community Centre | (hub / FAQ / legal — wg routera) | Linki i copy |
| 17 | Settings | `/settings` | |
| 18 | Billing | `/billing` | |
| 19 | Auth | `/auth` | Demo / marketing — bez uderzającego chaosu |

## Kolorystyka

- [ ] Główne tło i karty: **zgodne z aktywnym motywem** (nie „twardy” hex obok tokenów bez uzasadnienia).
- [ ] **Primary / indigo** używane konsekwentnie do CTA i akcentów (nie losowe fioletowe odstępstwa na jednej stronie).
- [ ] **Stan błędu / sukces / ostrzeżenie** — te same wzorce co na innych ekranach.

## Glow i dynamika (www nie jest „martwa”)

- [ ] Karty / przyciski pierwszego planu (dashboard, CTA) mają **delikatny** hover (`.mvh-card-glow` lub równoważny wzorzec).
- [ ] **Brak** migotania i agresywnej animacji na całej stronie.
- [ ] Dla użytkownika z **reduced motion**: brak wymuszonych transformacji na hover (tylko kolor/obrys).

## Werdykt (QC uzupełnia)

- **Wizualna zgodność z 19 ekranami + motywami:** Approved / Not approved  
- **Glow / dynamika:** Approved / Not approved  
- Uwagi (konkretne ścieżki ekranu + zrzut lub opis):

---

*Powiązane: [`qc-developer-to-qc-sync-2026-04-17.md`](./qc-developer-to-qc-sync-2026-04-17.md).*
