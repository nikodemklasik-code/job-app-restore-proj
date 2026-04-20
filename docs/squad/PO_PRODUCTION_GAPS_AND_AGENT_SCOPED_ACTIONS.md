# Konkretne braki vs produkcja + co agent (Auto) może zrobić

**Data zestawienia:** 2026-04-19  
**Źródła:** `TODAY_EXECUTION_BOARD.md`, `AUTO_TASK_CHAIN.tsv`, `19-SCREENS_FIRST_PRODUCTION_SLICES.tsv`, `8-MODULES_*`, `REMAINING-SCREENS_*`, [`19-screens-canonical-implementation-and-gap-map-v1.md`](../features/19-screens-canonical-implementation-and-gap-map-v1.md), [`19-screens-production-readiness-and-cross-flows-v1.md`](../features/19-screens-production-readiness-and-cross-flows-v1.md)

**Binding PO order (Dashboard first, fazy A1–A4, co Auto może / nie może):** [`PO_PRODUCTION_VERDICT_AND_EXECUTION_ORDER-v1.md`](./PO_PRODUCTION_VERDICT_AND_EXECUTION_ORDER-v1.md)

**Pełny stack w specyfikacji ekranu (bez domyślności — ścieżki plików BE/FE, build, testy):** [`docs/process/screen-spec-canonical-kit/README.md`](../process/screen-spec-canonical-kit/README.md) + checklist [`TOTAL_SCREEN_REQUIREMENTS.md`](../process/screen-spec-canonical-kit/checklist/TOTAL_SCREEN_REQUIREMENTS.md). Używać obok RFQ z `docs/squad/*_RFQ_TEMPLATE.md`.

---

## A. Braki operacyjne (bez tego „produkcja” nie ruszy — człowiek PO/QC)

| # | Brak | Dlaczego blokuje |
|---|------|-------------------|
| A1 | **Brak nowego wiersza w `AUTO_TASK_CHAIN.tsv` + pliku `REPORT_PATH`** po AFI tranche 1 | Agenci są w `PO_PENDING_ASSIGNMENT`; `auto-advance` nie ma legalnego następnego celu. |
| A2 | **Brak fizycznych RFQ w `docs/agent-work/`** dla wybranych wierszy z TSV (19 / 8 / REMAINING) | Plan jest na papierze; nikt nie wie, który slice jest „aktywny”. |
| A3 | **`set-status.sh` + realny `TASK`/`REPORT`** po wyborze slice | Automat i `po-next` nie odzwierciedlają pracy. |
| A4 | **Werdykt QC** na każdym `READY_FOR_QC` | Bez AFI/REWORK nie ma integracji ani advance. |
| A5 | **DDL / dowody na docelowej bazie** (jeśli slice wymaga schematu) | Merge/deploy bez migracji = ryzyko produkcyjne — poza kodem w repo. |
| A6 | **Deploy na VPS / sekrety / runner** | Agent w repo nie zastąpi Twojego pipeline’u operacyjnego. |

---

## B. Braki produktowe (konkretne slice’y z planów — nadal TODO / PLANNED)

### Z `REMAINING-SCREENS_FIRST_PRODUCTION_SLICES.tsv` (ekrany „reszta”)

Wszystkie wiersze **TODO** — brak RFQ na dysku + brak implementacji „production ready” wg opisu slice:

1. **Dashboard** — agregat snapshot + next step (brak jednego kontraktu BE/FE).
2. **Profile** — completeness + brakujące pola krytyczne + propagacja.
3. **Applications** — stage transitions + audit trail.
4. **Applications Review** — kolejka po dniach ciszy + akcje.
5. **Document Lab** — lineage wersji + `parentDocumentId` + attach.
6. **Style Studio** — tryby + widok porównawczy.
7. **AI Assistant** — resolver kontekstu (bundle).
8. **AI Analysis** — selektor wejścia + schema wyniku.
9. **Job Radar** — start skanu z saved job (utwardzenie).
10. **Community Centre** — route + shell + min. jedna akcja BE (P3).
11. **Settings** — read/write oparte o serwer + brak martwych toggle’i.
12. **Billing** — ledger / pending spend widoczność.

### Z `8-MODULES_FIRST_PRODUCTION_SLICES.tsv` (moduły practice / intelligence)

Wszystkie **PLANNED**:

1. Legal Hub — scope UI + podsumowanie zakresu wyszukiwania.  
2. Skill Lab — snapshot sygnałów v1.  
3. Case Practice — setup + shell sesji.  
4. Interview — lifecycle sesji (twardy).  
5. Coach — strukturalny output v1.  
6. Daily Warmup — karty tierów + koszt.  
7. Negotiation — setup + selektor trybu.  
8. Job Search — snapshot wyników + badge źródeł.

### Z `19-SCREENS_FIRST_PRODUCTION_SLICES.tsv` (szerszy backlog 19 ekranów)

Dodatkowe ścieżki RFQ/report (np. radar bridge, interview→reports, …) — **NOT_STARTED** w pliku; te same zasady: najpierw pliki, potem łańcuch.

### Z canonical gap map (YELLOW / RED — skrót)

- **YELLOW:** m.in. Dashboard (agregat), Jobs (dedupe/źródła), Review, Documents (wersje), Style, Analysis (właściciel BE), Interview (szerszy legacy), Warmup (ownership BE), Negotiation (router/domena), Skill Lab (dowody), Settings, Legal (retrieval vs wąski slice).  
- **RED:** **Community Centre** — brak dedykowanej route + modułu.

---

## C. Co agent (Auto / Cursor) **może** zrobić w repo — żeby produkcja ruszyła

Ograniczenia: **nie** wydaję werdyktu QC, **nie** robię deployu na VPS, **nie** mam dostępu do Twojej produkcyjnej bazy ani sekretów. **Mogę** edytować kod, testy, skrypty i dokumentację w tym repozytorium.

| Priorytet | Konkretna praca (przykłady) | Warunek od Ciebie |
|-----------|-----------------------------|-------------------|
| **C0 — Spec ekranu (full stack jawny)** | Dla wybranego ekranu: skopiować [`docs/process/screen-spec-canonical-kit/templates/SCREEN_TEMPLATE.md`](../process/screen-spec-canonical-kit/templates/SCREEN_TEMPLATE.md) → `docs/process/screen-spec-canonical-kit/screens/<SCREEN_ID>.md` i wypełnić § C/D/I (ścieżki `backend/` + `frontend/`, build exit codes). Opcjonalnie jedna macierz w [`matrix/`](../process/screen-spec-canonical-kit/matrix/TRACEABILITY_TEMPLATE.md). | Wskaż **SCREEN_ID** + agent; bez poszerzania poza jeden ekran/slice. |
| **C1 — Szkielety RFQ (przyspiesza PO)** | Utworzyć puste/szkicowe pliki `docs/agent-work/<nazwa>-rfq.md` + puste `docs/qc-reports/<nazwa>-ready-for-qc.md` wg wybranej **jednej** ścieżki z TSV (kopiując szablon `REMAINING-SCREENS_RFQ_TEMPLATE.md` / `8-MODULES_RFQ_TEMPLATE.md`) | Napisz **który jeden wiersz** (np. „Dashboard P1”) — bez tego nie zgaduję priorytetu. |
| **C2 — Jeden slice backend+FE** | Np. `dashboard.*` snapshot tRPC + cienki `DashboardPage` (stany loading/empty/error + jeden CTA) | Zaakceptujesz bounded scope (bez „cały dashboard produktowy”). |
| **C3 — Billing / practice hermetyczność** | Dopiecie approve/commit/reject w jednym module (np. warmup/interview) zgodnie z istniejącym billing engine | Wskaż moduł + aktualny plik routera; bez poszerzania na cały Practice naraz. |
| **C4 — Testy kontraktowe** | Testy renderu + mock kontraktu dla wybranego DTO / procedury | Podaj procedurę lub plik testowy docelowy. |
| **C5 — Community MVP minimalny** | Route `/community` + jedna procedura tRPC persystująca (np. placeholder zapisany w DB lub feature flag) | Wymaga zgody na „MVP brzydki ale prawdziwy” + ewentualny fragment schematu Drizzle. |
| **C6 — Automatyzacja** | Drobne usprawnienia `scripts/automation/*.sh`, walidatory, komunikaty błędów | Jasny symptom (np. „fałszywy STALE”). |
| **C7 — Konsolidacja docs** | Jedna tabela „slice → owner → route” łącząca 3 TSV (bez zmiany logiki chain) | Tylko jeśli chcesz mniej plików do czytania dla zespołu. |

---

## D. Rekomendowana **pierwsza** decyzja PO (najkrótsza ścieżka do ruchu)

1. Wybierz **jeden** slice z **Tier 1** canonical (np. **Billing** lub **Dashboard aggregate**) **albo** pierwszy wiersz **P0** z `8-MODULES` / `REMAINING` który jest zgodny z aktualnym stanem backendu.  
2. Napisz w odpowiedzi / tasku: **nazwa slice + agent (1/2/3)**.  
3. Agent (Auto) zrobi **C1 + C2** w jednym PR-u: szkic RFQ + minimalna implementacja + test podstawowy + wpis do `AUTO_TASK_CHAIN` **tylko** jeśli pliki `REPORT_PATH` już istnieją (zgodnie z [`AUTOMATION_PO_RUNBOOK.md`](./AUTOMATION_PO_RUNBOOK.md)).

---

## E. Czego agent **nie zrobi** (żeby nie było fałszywej nadziei)

- Nie zastąpi **QC** ani **PO** w priorytetyzacji ani werdykcie.  
- Nie połączy automatycznie trzech TSV w jeden łańcuch bez Twojej decyzji (ryzyko kolizji z tranche 1 / widening).  
- Nie uruchomi **produkcyjnego** OpenAI / płatności bez skonfigurowanego środowiska u Ciebie.  
- Nie „domknie Legal retrieval” jeśli spec mówi, że ścieżka wektorowa jest niedomknięta — tylko wąski, uczciwy slice.

---

**Następny krok:** odpowiedz jednym zdaniem, np. *„Zrób C1+C2 dla Dashboard aggregate, Agent 1”* albo *„Tylko szkielety RFQ dla całego REMAINING P1”* — wtedy można od razu wykonać pracę w repo bez domyślania.
