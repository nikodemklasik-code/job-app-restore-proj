# QC Live Status

## Ściana — jedna tabela (streszczenie)

| Krok | Aktor | Miejsce w repo | Referencja |
|------|--------|----------------|-------------|
| **1. Zgłoszenie dostawy** | Agent | Nowy plik w `docs/qc-reports/` + commit na `claude/improvements` | [`IMPLEMENTATION_EXECUTION_RULES.md`](../squad/IMPLEMENTATION_EXECUTION_RULES.md) **§6**; [`execution-reporting-standard.md`](../policies/execution-reporting-standard.md) §3–§7 |
| **2. Aktywne przeszukanie** | QC | `docs/qc-reports/`, `docs/qc/`, `docs/squad/` | Ten sam plik: **§4** + **§7** + **Hard Rule 2** |
| **3. Werdykt + certyfikat / cofnięcie** | QC | Nowy plik `docs/qc-reports/qc-*.md` w formacie **§8** + mapowanie **§9** + obowiązkowa **pierwsza linia** (§5a / Hard Rule 8) | **§8**, **§9** |
| **4. Reakcja na werdykt = kod** | Agent | Diff w repo + nowy raport **§6** albo **jeden** *Blocker* | **§5a** + **Hard Rule 8** |
| **5. Integracja** | Agent (guardy + PO gdy wymagane) | Deploy pipeline (`scripts/deploy.sh` + canonical guards); ew. product sign-off **§11** | Mapowanie **§9**; **§10**; **§11** |

Pełny kontekst i kotwica kanoniczna: [`../squad/IMPLEMENTATION_EXECUTION_RULES.md`](../squad/IMPLEMENTATION_EXECUTION_RULES.md) — sekcja **Wall: one table (flow summary)**.

## Binding — current QC line (canonical)

**Current valid statuses:**

- Coach test file: Approved For Integration  
- Live Interview billing slice: Approved For Integration  
- Interview / Negotiation intake document: Not Approved For Integration  
- Wider C-F1 / C-F2: Not Approved For Integration  

**Next QC expectation:**

- Agent 3 resubmitted §6 intake (2026-04-22): [`agent-3-c-f1-interview-negotiation-server-billing-2026-04-21.md`](./agent-3-c-f1-interview-negotiation-server-billing-2026-04-21.md) — explicit **Scope** / **Routes** table vs repo; cross-link to 2026-04-22 re-eval *Required Next Action*. **Fresh §8** still required to change integration status.  
- review only whether the intake is factually accurate and properly bounded  
- do not reopen the approved Coach slice  
- do not merge Live Interview AFI into wider Practice AFI  
- do not broaden approval beyond the exact existing verdicts  

**Post-condition (2026-04-22 — QC active sweep, does not rewrite bullets above):** Agent 3 **did** post a **corrected** [`agent-3-c-f1-interview-negotiation-server-billing-2026-04-21.md`](./agent-3-c-f1-interview-negotiation-server-billing-2026-04-21.md) (errata + factual scope table; **documentation only**, `Ready For QC: Yes` for **document** review). The four **Current valid statuses** lines remain until a **new §8** updates the Interview/Negotiation line; **QC debt:** issue narrow §8 on corrected doc vs repo grep.

**Verdict anchors (do not paraphrase AFI upward):** Coach engine + hermetic test — [`qc-verdict-c-f1-practice-hidden-spend-coach-slice-2026-04-20.md`](./qc-verdict-c-f1-practice-hidden-spend-coach-slice-2026-04-20.md) (amendment) + [`qc-verdict-c-f1-coach-follow-up-2026-04-21.md`](./qc-verdict-c-f1-coach-follow-up-2026-04-21.md); Live Interview billing — [`qc-verdict-live-interview-billing-slice-2026-04-21.md`](./qc-verdict-live-interview-billing-slice-2026-04-21.md); Interview/Negotiation intake doc — [`agent-3-c-f1-interview-negotiation-server-billing-2026-04-21.md`](./agent-3-c-f1-interview-negotiation-server-billing-2026-04-21.md) (**corrected on disk 2026-04-21 errata**; last §8 on **obsolete false draft** = NAFI in [`qc-verdict-c-f1-coach-follow-up-2026-04-21.md`](./qc-verdict-c-f1-coach-follow-up-2026-04-21.md) / [`qc-verdict-c-f1-reeval-coach-intake-practice-boundaries-2026-04-22.md`](./qc-verdict-c-f1-reeval-coach-intake-practice-boundaries-2026-04-22.md)); wider Practice — [`qc-decision-practice-modules-settings-community-2026-04-18.md`](./qc-decision-practice-modules-settings-community-2026-04-18.md).

### Enforcement — Agent 2 / Agent 3 stalled (PO · same-day declaration)

**Wiążące:** [`../squad/IMPLEMENTATION_EXECUTION_RULES.md`](../squad/IMPLEMENTATION_EXECUTION_RULES.md) **§5** *Execution enforcement — same-day scope declaration (anti-stall)* oraz **Hard Rule 9**.

**Wymagane tego samego dnia kalendarzowego** (commit w `docs/qc-reports/` na gałęzi zgodnej z polityką repo):

1. **Deklaracja zakresu implementacji** — jedno zdanie: wąski slice na **tę** rundę.  
2. **Dokładne ścieżki plików w repo** — lista pod `frontend/` / `backend/` / `shared/` / `infra/` (konkretne pliki).  
3. **Ścieżka raportu dostawy §6** — pełna ścieżka pliku markdown z *Files Changed* / testami / `READY FOR QC`.  
4. **Cel Ready For QC** — linia `READY FOR QC` (szczerze) albo **jeden** *Blocker* (właściciel, data, zależność).

**Zakaz:** pętle dyskusji bez tego commita — tylko edycja pliku deklaracji lub diff kodu.

**Jeśli** brak deklaracji **i** brak sensownego diffu do końca dnia (chyba że PO wpisze inny termin w tym pliku): PO może utrwalić **STALLED** i **zwęzić**, **przydzielić ponownie** lub **zawiesić** zakres.

| Agent | Zakres (etykieta — uzupełnia PO po deklaracji agenta) | STALLED | Notatka PO (data, działanie) |
|-------|--------------------------------------------------------|---------|-------------------------------|
| **B** | Następne tranche poza bounded §6 z 2026-04-19 | **Tak** (implementacja) — do skreślenia po §6 + diff |  |
| **C** | Legacy Interview/Negotiation billing + szerszy C-F1/C-F2 | **Tak** (implementacja kodu) — osobno od korekty dokumentu §6 |  |

## QC sweep — Agent 2 / Agent 3 (implementation movement, 2026-04-22)

**Agent 2 (B) — last bounded delivery**

| Check | Evidence |
|-------|----------|
| **Real implementation scope in §6?** | **Yes** for [`agent-2-delivery-intelligence-legal-skill-jobradar-2026-04-19.md`](./agent-2-delivery-intelligence-legal-skill-jobradar-2026-04-19.md) — lists backend/frontend paths + tests (Legal narrow, Skill Lab core signals, Job Radar wider). |
| **Prior reports searched?** | **Yes** — `Existing Reports Checked` + `Existing QC Reports Checked` populated in that file. |
| **Repo vs summary-only?** | **Implementation was in repo** for that tranche (QC §8 bounded AFI). **After §8:** only **markdown resync** in the same §6 file (verdict link, Vitest gate note) — **no new implementation §6** and **no new B-scoped code intake** filed since **2026-04-19** for open items (REST literal parity, Legal `file_search` execution, Skill Lab AI debit keys, etc.). |
| **QC stall flag** | **STALLED — next B implementation tranches** (expect **new §6 + diff**, not chat). |

**Agent 3 (C) — Practice / Interview docs**

| Check | Evidence |
|-------|----------|
| **Real implementation scope in latest §6?** | **Coach + Live Interview billing** were **code** deliveries (earlier §6 / execution docs). **Latest** [`agent-3-c-f1-interview-negotiation-server-billing-2026-04-21.md`](./agent-3-c-f1-interview-negotiation-server-billing-2026-04-21.md) = **documentation correction only** — explicit **Scope** / **Routes** table (legacy vs `liveInterviewRouter` vs Negotiation); **no** application code changes; **no** new legacy `interview.router` / negotiation billing wiring. |
| **Prior reports searched?** | **Yes** — `Existing Reports Checked` / `Existing QC Reports Checked` tables link Coach follow-up, Live Interview §8, Coach slice, repo sweep, **qc-decision-practice-2026-04-18**. |
| **Repo vs summary-only?** | **Markdown-only** movement on Interview/Negotiation intake correction — **not** implementation movement for legacy Interview/Negotiation server debits or **wider C-F1/C-F2**. |
| **QC stall flag** | **STALLED on implementation** for wider Practice / Settings / Community (**NAFI** unchanged) and for **any** future server billing on legacy Interview / Negotiation until a **new** §6 + code lands. **Not stalled on doc correction** — corrected file exists; **QC owes** narrow **§8** on whether the corrected intake is accepted as a **factual, bounded** document (still **no AFI** for billing there). |

**Last update (broadcast — najpierw najnowsze):**

- **2026-04-22 —** **PO execution enforcement — Agent 2 / Agent 3 stalled:** [`../squad/IMPLEMENTATION_EXECUTION_RULES.md`](../squad/IMPLEMENTATION_EXECUTION_RULES.md) **§5** *same-day scope declaration* + **Hard Rule 9**; w tym pliku sekcja **„Enforcement — Agent 2 / Agent 3 stalled”** + tabela **STALLED** — deklaracja (slice, ścieżki plików, ścieżka §6, cel `READY FOR QC`), **zakaz pętli dyskusji**; przy braku ruchu: **zwężenie / reassignment / suspend**.

- **2026-04-22 —** **QC active sweep — Agent 2 / Agent 3 (no passive wait):** sekcja **„QC sweep — Agent 2 / Agent 3”** powyżej — **Agent 2:** ostatnia **implementacja** w §6 z **2026-04-19**, potem brak nowego §6 z diffem na kolejne tranche B → **STALLED**. **Agent 3:** poprawiony intake Interview/Negotiation (**tylko docs**, przeszukanie raportów **tak**), brak ruchu **kodu** na legacy Interview/Negotiation billing i szerszy C-F1/C-F2 → **STALLED on implementation**; **QC debt:** §8 na poprawiony dokument. Kanoniczne cztery linie **Binding** — bez zmiany brzmienia; patrz **Post-condition** pod **Next QC expectation**.


- **2026-04-22 —** **Agent 3 — Interview/Negotiation §6 intake resubmit (repo):** [`agent-3-c-f1-interview-negotiation-server-billing-2026-04-21.md`](./agent-3-c-f1-interview-negotiation-server-billing-2026-04-21.md) updated with explicit **Scope** / **Routes** subsections + **Integration Notes**; Coach intake cross-link corrected in [`agent-3-c-f1-practice-billing-hidden-spend-2026-04-20.md`](./agent-3-c-f1-practice-billing-hidden-spend-2026-04-20.md). **Binding integration statuses** unchanged until new §8. **Next QC expectation** row adjusted to reflect resubmission (still requires QC §8 to move status).

- **2026-04-22 —** **Binding — current QC line (canonical):** sekcja **„Binding — current QC line (canonical)”** powyżej — statusy i **Next QC expectation** wpisane **słowo w słowo** po angielsku; bez zmiany znaczenia AFI. Re-eval granic: [`qc-verdict-c-f1-reeval-coach-intake-practice-boundaries-2026-04-22.md`](./qc-verdict-c-f1-reeval-coach-intake-practice-boundaries-2026-04-22.md).

- **2026-04-22 —** **QC re-evaluation — Coach hermetic test + Interview/Negotiation §6 + granice Practice:** [`qc-verdict-c-f1-reeval-coach-intake-practice-boundaries-2026-04-22.md`](./qc-verdict-c-f1-reeval-coach-intake-practice-boundaries-2026-04-22.md). **Coach test `coach.router.spec.ts`:** **Approved For Integration** (hermetyczny, `npx vitest run …` 2/2 OK). **Migracja silnika Coach (wąski slice):** **bez zmian AFI** z wcześniejszego werdyktu — **brak poszerzenia** poza ten slice. **§6 intake (stan w momencie werdyktu §8):** werdykt w pliku nadal **Not Approved** dla dokumentu jako **QC-trustworthy** — findingi (m.in. brak jawnego Scope/Routes vs Live Interview) były **względem wersji pliku przed resubmitem agenta**; po resubmitcie 2026-04-22 **nowy §8** decyduje o dalszym statusie. **Szerszy C-F1 / C-F2 / Practice–Settings–Community:** **Not Approved For Integration — bez zmian** ([`qc-decision-practice-modules-settings-community-2026-04-18.md`](./qc-decision-practice-modules-settings-community-2026-04-18.md)). **Anti-widen:** bez zmian.

- **2026-04-21 —** **PO / nadzór — postawa procesowa (anti-widen, bez dosyłania pracy na Coach):** Stan procesu **czysty** (obieg §6 → QC → §8). **Coach (wąski slice, AFI):** implementacja po stronie agenta **zamknięta** — **oczekuje wyłącznie** na ewentualną **ponowną ocenę / nowe ustalenie QC** w §8; **nie** żądać od agenta kolejnych zmian w tym slice’u **chyba że** QC zapisze **nowe** findingi. Werdykty: [`qc-verdict-c-f1-practice-hidden-spend-coach-slice-2026-04-20.md`](./qc-verdict-c-f1-practice-hidden-spend-coach-slice-2026-04-20.md) + [`qc-verdict-c-f1-coach-follow-up-2026-04-21.md`](./qc-verdict-c-f1-coach-follow-up-2026-04-21.md). **Interview / Negotiation:** intake **w kolejce recenzji QC** — m.in. [`agent-3-c-f1-interview-negotiation-server-billing-2026-04-21.md`](./agent-3-c-f1-interview-negotiation-server-billing-2026-04-21.md) + werdykt [`qc-verdict-c-f1-coach-follow-up-2026-04-21.md`](./qc-verdict-c-f1-coach-follow-up-2026-04-21.md); osobno wąski **Live Interview** billing: [`qc-verdict-live-interview-billing-slice-2026-04-21.md`](./qc-verdict-live-interview-billing-slice-2026-04-21.md). **Szerszy** Practice / Settings / Community — **oddzielnie**, **nadal nie** jako całość ([`qc-decision-practice-modules-settings-community-2026-04-18.md`](./qc-decision-practice-modules-settings-community-2026-04-18.md)). **Focus nadzoru (PO / delegat):** tylko **disciplina wykonania**, **kontrola granic**, zapobieganie **fałszywemu poszerzaniu** AFI — bez domyślnego „jeszcze jedna poprawka” na Coach.

- **2026-04-21 —** **QC verdict — Live Interview billing slice only (§6 intake):** [`qc-verdict-live-interview-billing-slice-2026-04-21.md`](./qc-verdict-live-interview-billing-slice-2026-04-21.md) — intake [`execution-live-interview-billing-slice-2026-04-20.md`](./execution-live-interview-billing-slice-2026-04-20.md). **Approved For Integration (wąski zakres):** `createSession` → wiersz sesji → `approveSpend` z mapowaniem trybu na `interview_lite` / `interview_standard` / `interview_deep` → zapis `pending_credit_spend_event_id`; rollback sesji przy wyjątku z `approveSpend`; `complete` → po **sukcesie** `completeSession` dopiero `commitSpend` (actualCost = **minCost** dla estimated); przy błędzie `completeSession` lub błędzie commit — `rejectSpend` + clear pending; `abandon` → `rejectSpend` potem `abandonSession` (ACTIVE) lub UPDATE **CREATED → ABANDONED**. **Wymagane przed prod:** `ALTER` z `backend/sql/2026-04-20-live-interview-pending-spend.sql`. **NAFI w tym §6:** dedykowany Vitest pod billing live interview. **Anti-widen:** brak AFI dla legacy `interview.router`, Negotiation, szerszego Interview / Practice / C-F2. **Ryzyko:** teoretyczny brak atomowości między sukcesem `approveSpend` a `UPDATE` pending — opisane w werdykcie.

- **2026-04-21 —** **QC verdict — C-F1 Coach follow-up (test hermetyczny + §6 Interview/Negotiation):** [`qc-verdict-c-f1-coach-follow-up-2026-04-21.md`](./qc-verdict-c-f1-coach-follow-up-2026-04-21.md). **Coach test `coach.router.spec.ts`:** **Approved For Integration** — brak `appRouter`, mock `db`/`creditsBilling`/`openai`, `router({ coach: coachRouter })`; `npx vitest run …/coach.router.spec.ts` OK bez MySQL. **`coach_session`:** spójne z `coach.router.ts` i expectami w teście. **§6 [`agent-3-c-f1-interview-negotiation-server-billing-2026-04-21.md`](./agent-3-c-f1-interview-negotiation-server-billing-2026-04-21.md):** **Not Approved** jako wiarygodny opis stanu serwera — tabela błędnie twierdzi, że `liveInterview.router.ts` nie ma billingu; w kodzie jest `approveSpend` przy `createSession` oraz `commitSpend`/`rejectSpend` na ścieżkach sesji (patrz plik routera). Prawdziwe jest, że intake **nie** rości AFI dla billingu Interview/Negotiation; **nieprawdziwe** jest stwierdzenie „brak debetu” dla **Live Interview**. **Wider C-F1 / C-F2:** bez zmian **NAFI**. **Anti-widen:** brak rozszerzenia AFI poza wąski slice Coach z wcześniejszego werdyktu — tylko aktualizacja statusu testu + ocena §6. Poprawka tabeli w §6 przez Agenta 3 wymagana przed „accepted justification”. Zob. też amendment w [`qc-verdict-c-f1-practice-hidden-spend-coach-slice-2026-04-20.md`](./qc-verdict-c-f1-practice-hidden-spend-coach-slice-2026-04-20.md).

- **2026-04-20 —** **Wykonanie po werdykcie C-F1 / bramka testów:** W repo: **Live Interview** (`liveInterviewRouter`) — `approveSpend` przy `createSession` (feature wg trybu: `interview_lite` / `interview_standard` / `interview_deep`), `commitSpend` przy udanym `complete`, `rejectSpend` przy `abandon` lub błędzie `complete` przed domknięciem sesji; kolumna `live_interview_sessions.pending_credit_spend_event_id` + skrypt `backend/sql/2026-04-20-live-interview-pending-spend.sql` (ALTER na VPS przed deployem). **Coach** — test hermetyczny bez `appRouter` / bez MySQL przy collect (`coach.router.spec.ts`). **`npm test` w backendzie:** 29 plików / 125 testów zielone. **QC:** wymagana **świeża** recenzja §8 dla tej delty (nie rozszerzać AFI C-F1 poza wąski zakres Coach + ten plik Live Interview).

- **2026-04-20 —** **Agent 2 — bounded AFI + resync §6 (broadcast kanoniczny):** Werdykt §8 (bez edycji pliku werdyktu): [`qc-verdict-agent-2-delivery-intelligence-legal-skill-jobradar-2026-04-19.md`](./qc-verdict-agent-2-delivery-intelligence-legal-skill-jobradar-2026-04-19.md). Intake §6 po resyncu (status integracji + blockers/testy): [`agent-2-delivery-intelligence-legal-skill-jobradar-2026-04-19.md`](./agent-2-delivery-intelligence-legal-skill-jobradar-2026-04-19.md). **Approved For Integration (bounded)** wyłącznie dla trzech nazwanych tranche’y w werdykcie — **nie** dla całego Agenta 2, **nie** dla pełnego Legal **`file_search` / vector store execution**, **nie** dla całego modułu Skill Lab względem pełnej specyfikacji / warstwy kosztów AI poza tym intakiem. **Weryfikacja testów (aktualne drzewo):** `cd /Users/nikodem/job-app-restore/proj/backend && npm test -- --run` → **29/29** plików testowych, **125/125** testów zielone. **Nadal jawne poza ten bounded §6:** (1) **NAFI** dla **literalnych** ścieżek REST `/job-radar/*` z OpenAPI vs ekspozycja **tRPC** — jedna uczciwa pozycja w `OPENAPI_V1_1_GAPS_VS_REPO` w kodzie; (2) brak pełnego **file_search** / magazynu wektorów w Legal Hub (tylko `vectorRetrievalMode` + etykiety + synthesis **z hitów katalogu**); (3) pełna spec Skill Lab + debety **`skill_lab_gap_analysis` / `skill_lab_course_suggest`** przez engine itd. — **poza** tym bounded intake (osobne §6 + §8). Anti-widening: bez domyślnego AFI reszty backlogu Agenta 2.

- **2026-04-20 —** **QC verdict — C-F1 Coach slice (plik §8 bez zmian w treści werdyktu):** [`qc-verdict-c-f1-practice-hidden-spend-coach-slice-2026-04-20.md`](./qc-verdict-c-f1-practice-hidden-spend-coach-slice-2026-04-20.md) — **Approved For Integration** dla migracji spend-engine w `coach.router.ts` (+ `_shared` / kontekst) zgodnie z tabelą werdyktu. **Broadcast — stan repo zgodny z weryfikacją (nie zastępuje zdania w pliku werdyktu):** `coach.router.spec.ts` jest **hermetyczny** (bez `appRouter` / bez MySQL przy collect); `skillLabCore.service.spec.ts` przechodzi; pełny backend **`npm test -- --run` → 125/125** — wcześniejsze linie tego broadcastu o „non-hermetic Coach” i „Skill Lab regression deploy blocker” były **nieaktualne** względem obecnego drzewa. **Nadal NAFI** bez osobnego §8: szerszy C-F1/C-F2, Practice FE boundary, legacy `interview.router`, Negotiation jako osobny moduł. **Binding (English, do not widen the Coach slice):** narrow Coach spend migration Approved; wider Practice / C-F2 still not approved.

- **2026-04-18 —** **QC verdict — current gate state (snapshot bramki; format §8):** [`qc-verdict-current-gate-state-2026-04-18.md`](./qc-verdict-current-gate-state-2026-04-18.md) — dokument historyczny dla całego diffu z 2026-04-18. **Approved:** A-F1, A-F2, A-F4, OpenAI narrow slice + Assistant product meta, Settings `?tab=` five-file allow-list, Job Radar OpenAPI v1.1 (handoff kontraktu). **Rejected / Not Approved:** Practice/Settings/Community wider, AI live smoke (env). **Uwaga 2026-04-20 (nadpisanie broadcastu, nie edycja pliku bramki):** zdanie „No verdict possible … Legal Hub Search module, Skill Lab core, Job Radar wider” jest **zdezaktualizowane** — te trzy linie produktowe mają teraz **bounded Approved** w werdykcie Agent 2 (link w *Last update* powyżej). **Assistant UX** w tym snapshocie bramki — bez zmian do ręcznego przeglądu vs aktualny backlog. **Carry w tekście bramki z 2026-04-18** (np. `coach.router` / SQL) może być niezsynchronizowany z nowszym kodem — źródło prawdy dla Coach = werdykt C-F1 + repo; dla Legal/Skill Lab/Job Radar wider = werdykt Agent 2.

- **2026-04-18 —** **QC repo sweep (referencja historyczna):** [`qc-repo-sweep-current-diff-2026-04-18.md`](./qc-repo-sweep-current-diff-2026-04-18.md) — mapowanie bloków z 2026-04-18. **Uwaga 2026-04-20:** część „Awaiting §6 … Legal Hub (§2.6), Skill Lab core (§2.7), Job Radar product UI+services (§2.11)” jest **zrealizowana bounded** werdyktem Agent 2 + intakem §6 (linki wyżej); nadal aktualne m.in. **Assistant UX (§2.12)** oraz osobne ścieżki poza bounded tranche’ami. **Agent 3:** dalsze §6 dla szerszego C-F1/C-F2 zgodnie z PO, nie jako domniemanie z tego sweepu.

- **2026-04-19 —** **OpenAI narrow slice (binding) + Job Radar stan repo:** sekcja **Current QC status (binding — OpenAI / Assistant / Legal spot)** — bez zmian co do AFI: tylko `lib/openai` + meta Assistanta + **opcjonalne** Legal **catalogue-grounded** summary + testy backend; **NAFI** pełny Legal **`file_search`**. **Settings `?tab=`:** [`qc-verdict-settings-url-resubmission-2026-04-19.md`](./qc-verdict-settings-url-resubmission-2026-04-19.md) = **Approved For Integration** (wąski zakres). **Handoff OpenAPI v1.1:** [`qc-job-radar-openapi-contract-dev-handoff-2026-04-16.md`](./qc-job-radar-openapi-contract-dev-handoff-2026-04-16.md) — **QC Verdict** nadal **Approved For Integration** dla **artefaktu kontraktu** (YAML + testy w repo zgodne z plikiem). **Stan kodu po Agent 2 (bounded):** `OPENAPI_V1_1_GAPS_VS_REPO` w `job-radar-openapi-v1.1.contract.spec.ts` = **1** jawna pozycja — **literalny REST** vs **tRPC**; intencje `from-saved-job` i employer history są w **tRPC** (`startScanFromSavedJob`, `getEmployerHistory`) — **nie** równają się bajt-identycznym Express z YAML. **Kanoniczny obieg:** [`../squad/IMPLEMENTATION_EXECUTION_RULES.md`](../squad/IMPLEMENTATION_EXECUTION_RULES.md). Pełny slice Practice/Settings 2026-04-18: [`qc-decision-practice-modules-settings-community-2026-04-18.md`](./qc-decision-practice-modules-settings-community-2026-04-18.md) — **Not Approved For Integration** dla całości tematu do osobnego domknięcia.  

- **2026-04-18 —** **Agent 1 Foundations (A-F1 / A-F2 / A-F4) werdykt wystawiony:** [`qc-verdict-agent-1-foundations-a-f1-a-f2-a-f4-2026-04-18.md`](./qc-verdict-agent-1-foundations-a-f1-a-f2-a-f4-2026-04-18.md) — wszystkie trzy zakresy **Approved → Approved For Integration**. Łańcuch certyfikatów odblokowany: **B-F2 Skill Lab core**, **C-F1 Practice billing wiring**, **C-F2 Settings consent** mogą konsumować A-F2; **C-F1** i **B-F2/B-F3 AI cost surfaces** muszą zmigrować wszystkie debety na `approveSpend`/`commitSpend` (carry: `backend/src/trpc/routers/coach.router.ts` linie 62–63 + brak wywołań engine w interview / negotiation / warmup / skill_lab / job_radar cost routes). Szczegóły w werdykcie. **PO confirmation (nie blokuje A-F1):** plan allowances (`free=50 / pro=500 / autopilot=2000`), credit-pack pricing, zasada "salary above target = eligible".  
Poprzedni broadcast (2026-04-16): QC — **intake FU-1..3 zamknięty**: `qc-fu-followup-pack-intake-2026-04-16.md` = **Approved For Integration**; live AI smoke = **Not Approved** do czasu `OPENAI_API_KEY` — `qc-ai-live-smoke-2026-04-16.md` Session 2; **Visual Consistency Owner: Agent C (Vo)**.

## Broadcast do zespołu (czytajcie to pierwsze)

### Postawa procesowa — nadzór wykonania (PO / delegat · wiążące)

- **Stan:** proces **czysty** — trzymać kolejkę QC i granice werdyktów, nie mieszać statusów w czacie.
- **Coach (AFI wąski):** **nie** zamawiać dalszych zmian w kodzie tego slice’u od agenta **dopóki** QC nie opublikuje **nowego** findingu w §8 (implementacja uznana za **zamkniętą po stronie agenta**; ewentualna **ponowna ocena** = rola QC).
- **Interview / Negotiation:** intake **w kolejce u QC** — patrz *Last update* (linki do §6 i werdyktów).
- **Szerszy** Practice / Settings / Community — **osobny** temat, **nie** zatwierdzony jako całość; **anti-widen:** brak komunikatu „cała Practice po Coach”.
- **Zakres pracy nadzorcy:** wyłącznie **dyscyplina procesu**, **granice modułów**, **zapobieganie fałszywemu AFI** — nie zastępowanie agentów ani QC.

### Obowiązujący model wykonania (PO)

- **Jeden dokument:** [`../squad/IMPLEMENTATION_EXECUTION_RULES.md`](../squad/IMPLEMENTATION_EXECUTION_RULES.md) — hierarchia źródeł prawdy, obowiązkowe katalogi (`docs/qc-reports/`, `docs/qc/`, `docs/squad/`), flow **Agent → raport dostawy → Ready For QC → QC → Integration Status → PO (gdy wymagane)**.  
- **§17 przejście:** zakresy z wcześniejszych zleceń **nie** są zamknięte „z pamięci czatu” — właściciel zakresu składa świeży raport dostawy z sekcjami *Existing Reports Checked* / *Existing QC Reports Checked*, QC robi deltę względem poprzednich werdyktów, dopiero wtedy uznajemy zgodność z nowym obiegiem. Wyjątki wąskie tylko jawnie tutaj (nazwa zakresu + uzasadnienie + data).
- **Wyjątek §17 (2026-04-19):** **Settings — URL `?tab=` + Vitest + raport resubmission** — werdykt [`qc-verdict-settings-url-resubmission-2026-04-19.md`](./qc-verdict-settings-url-resubmission-2026-04-19.md); pełny slice Practice/Settings/Community z 2026-04-18 **nadal** wymaga osobnego domknięcia.

### Current QC status (binding — OpenAI / Assistant / Legal spot)

Tekst poniżej jest **kanoniczny** (zgodny z [`qc-agent-work-spot-verification-2026-04-19.md`](./qc-agent-work-spot-verification-2026-04-19.md), sekcja **Integration Status**). **Nie poszerzaj** AFI poza wąski zakres.

**Approved For Integration:**

- the narrow slice only:
  - centralized OpenAI layer in lib/openai
  - Assistant AI product meta
  - optional Legal Hub grounded summary from catalog hits
  - related backend tests

**Not Approved For Integration:**

- the wider frontend / Practice / Settings / Community batch
- any scope still blocked by [`qc-decision-practice-modules-settings-community-2026-04-18.md`](./qc-decision-practice-modules-settings-community-2026-04-18.md)
- full Legal Hub file_search / vector-store retrieval

**Binding rules:** Do not broaden the approval beyond the narrow slice. Do not describe the wider batch as approved. Proceed by integrating the approved narrow slice and continuing implementation on the rejected or incomplete wider scope.

### Agent 3 (C) — Practice / Settings / Community: **stan częściowy** (wąski ≠ szeroki)

- **Approved For Integration — Coach (wąski):** [`qc-verdict-c-f1-practice-hidden-spend-coach-slice-2026-04-20.md`](./qc-verdict-c-f1-practice-hidden-spend-coach-slice-2026-04-20.md) + re-eval werdyktów Coach/testu (m.in. [`qc-verdict-c-f1-reeval-coach-intake-practice-boundaries-2026-04-22.md`](./qc-verdict-c-f1-reeval-coach-intake-practice-boundaries-2026-04-22.md)). **PO / nadzór:** **nie** dosyłać ekstra pracy na ten slice bez nowego §8 QC.
- **Approved For Integration — Live Interview billing (wąski, osobno):** [`qc-verdict-live-interview-billing-slice-2026-04-21.md`](./qc-verdict-live-interview-billing-slice-2026-04-21.md) — **nie** rozszerzać na „cały Interview” ani na intake Interview/Negotiation poniżej.
- **Not Approved — Interview / Negotiation (§6):** [`agent-3-c-f1-interview-negotiation-server-billing-2026-04-21.md`](./agent-3-c-f1-interview-negotiation-server-billing-2026-04-21.md) — intake **faktycznie błędny**; **czekać** na **poprawiony** §6 od Agenta 3 przed kolejną rundą QC (odpowiedź QC: m.in. [`qc-verdict-c-f1-reeval-coach-intake-practice-boundaries-2026-04-22.md`](./qc-verdict-c-f1-reeval-coach-intake-practice-boundaries-2026-04-22.md)).
- **Not Approved — szerszy** Practice / Settings / Community: [`qc-decision-practice-modules-settings-community-2026-04-18.md`](./qc-decision-practice-modules-settings-community-2026-04-18.md); wąski settings URL tylko wg [`qc-verdict-settings-url-resubmission-2026-04-19.md`](./qc-verdict-settings-url-resubmission-2026-04-19.md).
- **Anti-widen:** brak utożsamiania **Live Interview AFI** z AFI **Interview+Negotiation** §6; brak komunikatu „Practice zielone po Coach”.

### Po werdykcie QC — agenci (implementacja, nie dyskusja)

- **Werdykt zapisany w `docs/qc-reports/` lub `docs/qc/` = koniec dyskusji zamiast pracy** dla tego zakresu. Dalej wyłącznie: **diff w repo** zgodnie z **Required Next Action** + świeży raport dostawy **§6** w [`IMPLEMENTATION_EXECUTION_RULES.md`](../squad/IMPLEMENTATION_EXECUTION_RULES.md) i **Ready For QC**.  
- Wielodniowy wątek bez commitów **nie** zastępuje implementacji — patrz **§5a** i **Hard Rule 8** w tym samym pliku. Eskalacja do PO tylko tam, gdzie wymagają tego specy QC/PO — nie jako zwykła „obgadanka” werdyktu.

### Praca w repo — zero seminarium z dokumentów

- **Nie** macie czasu na: „w dokumencie D jest napisane E” jako jedyne deliverable w wątku albo PR **bez diffu**.
- **Tak:** otwieracie `docs/squad/` tylko po to, żeby **wiedzieć co kodować**, potem **commitujecie** w `frontend/` / `backend/` / `shared/`, uruchamiacie build/test, zapisujecie raport w `docs/qc-reports/` z linią **`READY FOR QC`** i **listą zmienionych plików** (wg [`execution-reporting-standard.md`](../policies/execution-reporting-standard.md)).
- **Dokumentacja** (`docs/squad/*`, `docs/features/*-refactor*`) = **mapa**; **prawda wykonania** = **kod + raport QC**. Kto dyskutuje zamiast commitować — blokuje integrację.

### Kwalifikacja zakresu squad (implementacja vs cofnięcie do poprawy)

Źródło faz: [`../squad/Squad_Workboard.md`](../squad/Squad_Workboard.md). Litera **A = Agent 1, B = Agent 2, C = Agent 3** — [`../squad/squad-abc-qc-certificate-gated-work-split-v1.0.md`](../squad/squad-abc-qc-certificate-gated-work-split-v1.0.md).

#### Cofnij do poprawy (najpierw to — kod + testy + raport, potem ponowne QC)

| Zakres | Owner | Co zrobić |
|--------|-------|-----------|
| **Practice + Settings + Community** (slice 2026-04-18) | **C** | **Częściowo zamknięte (wąski tranche):** settings `?tab=` + testy + raport — [`qc-verdict-settings-url-resubmission-2026-04-19.md`](./qc-verdict-settings-url-resubmission-2026-04-19.md) (**Approved For Integration**). **Dalej obowiązuje:** pełny slice wg [`qc-decision-practice-modules-settings-community-2026-04-18.md`](./qc-decision-practice-modules-settings-community-2026-04-18.md) — praktyka end-to-end, persystencja/API consent/community jeśli wymaga PO, testy debetu Warmup gdy w tym samym batchu, Job Radar DoD; kolejne `READY FOR QC` + delta QC. |
| **Live AI smoke Session 2** | środowisko + QC | [`qc-ai-live-smoke-2026-04-16.md`](./qc-ai-live-smoke-2026-04-16.md) — `OPENAI_API_KEY` + sukces wywołania; dopiero wtedy możliwy `Approved` dla smoke. |

#### Do implementacji (następny commit — bez dyskusji o treści PDF speca)

| Zakres | Owner | Pierwszy konkret (repo) |
|--------|-------|-------------------------|
| **Faza 1 — billing / spend (A-F1)** | **A** | **Approved For Integration** — [`qc-verdict-agent-1-foundations-a-f1-a-f2-a-f4-2026-04-18.md`](./qc-verdict-agent-1-foundations-a-f1-a-f2-a-f4-2026-04-18.md). Engine + schema + 27 unit tests zamknięte. Dalszy kod od A tylko gdy PO potwierdzi allowances/pack pricing/salary-above i wymagane są zmiany constantów. |
| **Faza 1 — praktyka (C-F1)** | **C** | **Odczyt PO:** **AFI** — wąski **Coach** (werdykty w sekcji Agent 3); **AFI** — wąski **Live Interview billing** [`qc-verdict-live-interview-billing-slice-2026-04-21.md`](./qc-verdict-live-interview-billing-slice-2026-04-21.md) (**nie** = szerszy Interview). **Not Approved:** §6 Interview/Negotiation — intake **błędny faktami**; **Agent 3** → **poprawiony** §6, potem QC. **Bez** ekstra pracy na Coach od PO (chyba że nowe §8 QC). **NAFI:** szerszy Practice/Settings/Community. **Anti-widen.** |
| **Faza 2 — profil SoT (A-F2)** | **A** | **Approved For Integration** — ten sam werdykt co wyżej. 23 unit tests, downstream wiring w `jobs.router.search` / `emailAutoApply` / `autoApply.router.addToQueue` + trzy nowe tRPC (`getMatchContext`, `getGrowthRecommendations`, `isEmployerBlocked`). |
| **Faza 2 — Skill Lab rdzeń (B-F2)** | **B** | **Odblokowany przez Approved A-F2.** **Bounded AFI (2026-04-20):** [`qc-verdict-agent-2-delivery-intelligence-legal-skill-jobradar-2026-04-19.md`](./qc-verdict-agent-2-delivery-intelligence-legal-skill-jobradar-2026-04-19.md) — tylko tranche **core signals** (`skillLab.coreSignals` + `skillLabCore.service` + sekcja UI); **poza** tym intakiem: pełna spec Skill Lab, **`skill_lab_gap_analysis` / `skill_lab_course_suggest`** przez engine — **osobny** §6 + §8. |
| **Faza 2 — settings + consent (C-F2)** | **C** | **Odblokowany przez Approved A-F2.** Persystencja zgód / API; carry: `profile.isEmployerBlocked` + `profile.getMatchContext` gotowe do konsumpcji bez dodatkowej pracy A. |
| **Faza 3 — Job Radar + Legal (B-F3)** | **B** | **Bounded AFI (2026-04-20):** ten sam werdykt Agent 2 — tranche Job Radar (stable `employerId`, saved-job scan, employer history, UI) + Legal **narrow** (katalog + honest `vectorRetrievalMode` + grounded summary z hitów); **NAFI:** literal REST z YAML, pełny **`file_search`**. **Dalej poza bounded:** jedna ścieżka routingu `frontend/src/router.tsx` (`/radar` vs `/job-radar`) + engine debet dla kosztowych ścieżek Job Radar — osobny intak jeśli ma być AFI. |
| **Faza 3 — Community** | **C** | Po prereq z ABC; spięcie z billingiem zgodnie z [`../squad/Agent_3_Practice_And_Preferences_Spec.md`](../squad/Agent_3_Practice_And_Preferences_Spec.md) — przez engine. |
| **Faza 4 (A-F4)** | **A** | **Approved For Integration** — `.canonical-repo-key` + library + 11 shell tests + CI wiring (`deploy.yml` → `test` job blokuje deploy przy regresji guardów). Polish B/C możliwy po `Approved` wcześniejszych faz swojej litery. |

**Stan integracji:** slice **Assistant + Case Practice** ma od QC decyzję **Approved For Integration** — pakiet: `docs/qc-reports/qc-to-po-assistant-integration-2026-04-16.md`. To zamyka poprzedni cykl submission.

**Sygnał właściciela repozytorium → PO (zielone światło, chat → repo):** Właściciel potwierdził agentowi **pełne zielone światło** na kontynuację prac w bieżącym kierunku (FU, EN-first / podnoszenie standardu wizualnego tam gdzie dotykamy UI, dalsze iteracje po ścieżce QC). **PO:** proszę potraktować ten akapit jako formalne powiadomienie w kanale `docs/qc-reports/`. **Nie skraca** obowiązku **Agent → QC → PO** przy akceptacji konkretnych zmian w kodzie ani recenzji QC przed merge. Kontekst historyczny: sekcje sygnału w `docs/qc-reports/agent-b-report.md` i `docs/qc-reports/agent-c-report.md`.

**Agent C — czego dotyka (źródło prawdy):** `docs/qc-reports/agent-c-task-card.md` — sklejenie A+B end-to-end (Assistant UI + realny payload: trasy, akcje, safety w UI), weryfikacja integracyjna (wrażliwe vs normalne prompty + reload historii z meta), regresja nawigacji (Applications / Profile / Skills + flow Assistanta), raport końcowy w `docs/qc-reports/agent-c-report.md` wg `docs/policies/execution-reporting-standard.md` z linią `READY FOR QC`.  
**Alias procesowy:** **„Vo” = Agent C** (komunikacja w `docs/qc-reports/`; nie stosować tego aliasu w copy UI dla użytkownika).  
**Visual Consistency Owner:** ten sam **Agent C (Vo)** — patrz wiersz roli i akapit *Motywy www* poniżej.

**Follow-up FU-1..3:** QC przyjął paczkę — werdykt w [`qc-fu-followup-pack-intake-2026-04-16.md`](./qc-fu-followup-pack-intake-2026-04-16.md): **Approved For Integration** (FU-1, FU-2, FU-3).  
**Nowe zlecenia:** tylko z sekcji PO poniżej lub nowy wpis PO; raportujecie do QC przy kolejnym `READY FOR QC`.

| Rola | Co robicie teraz |
|------|------------------|
| **PO** | Zlecenia follow-up w sekcji *PO — aktywne zlecenia*. **Visual Consistency Owner** jest przypisany: **Agent C (Vo)** — zmiana roli tylko przez nowy zapis w tym pliku (decyzja PO / właściciela). |
| **Visual Consistency Owner** | **Agent C (alias Vo)** od 2026-04-16. Pilnujesz normy [`unified-app-layout-and-theme-standard-v1.0.md`](../policies/unified-app-layout-and-theme-standard-v1.0.md) przy PR dotykających UI; eskalujesz regresje motywów; koordynujesz sprint „P0 ekrany” wg [`visual-consistency-owner-role-spec.md`](../policies/visual-consistency-owner-role-spec.md). Współpracujesz z Agentem A (implementacja UI); nie zastępujesz PO w IA. |
| **Agent A / B / C** | **FU-1..3:** **Approved For Integration** (QC 2026-04-16). Kolejne paczki: `READY FOR QC` → intake jak dotąd. Anti-idle: przy nowym pinie z PO — checkpoint w raporcie. |
| **Kto wdraża** | Gałąź robocza: `claude/improvements`. Weryfikacja referencyjna: `cd /Users/nikodem/job-app-restore/proj/backend && npm test && npm run build`, `cd /Users/nikodem/job-app-restore/proj/frontend && npm run build`. |

**Kanał komunikacji:** `docs/qc-reports/` + **`docs/qc/`** (nowy model raportów QC — [`../qc/qc-reporting-certification-and-po-communication-spec-v1.0.md`](../qc/qc-reporting-certification-and-po-communication-spec-v1.0.md)) + łańcuch Agent → QC → PO (bez „statusu z czatu” jako dowodu wejścia do QC). QC przed werdyktem **przeszukuje oba** katalogi.

**Job Radar OpenAPI (wątek kontraktu / handoff dev — jeden plik):** [`qc-job-radar-openapi-contract-dev-handoff-2026-04-16.md`](./qc-job-radar-openapi-contract-dev-handoff-2026-04-16.md) — **QC Verdict (2026-04-19): Approved For Integration** dla artefaktu kontraktu (YAML + testy w pliku). **Stan repo (2026-04-20, bounded Agent 2):** w kodzie zostaje **jedna** jawna luka `OPENAPI_V1_1_GAPS_VS_REPO` — REST literal vs tRPC; werdykt Agent 2 + intak §6 — linki w *Last update*. Ustalenia PO↔wykonawca **tylko** tam (`PO note` / `Executor reply`), bez dublowania prawdy na czacie.

**Motywy www / spójność wizualna:** **Visual Consistency Owner = Agent C (alias Vo)** od 2026-04-16. Źródło roli i RACI: `docs/policies/visual-consistency-owner-role-spec.md`. Kontrakt layout+motyw: `docs/policies/unified-app-layout-and-theme-standard-v1.0.md` (checklista PR; min. 3 motywy wg normy).

Jeśli coś się rozjeżdża z tą tablicą — **poprawcie ten plik** albo napiszcie wprost w PR, żeby QC mógł zsynchronizować prawdę.

---

## PO — aktywne zlecenia (follow-up po Approved For Integration)

Źródło luk: `qc-to-po-assistant-integration-2026-04-16.md` + sekcje *Known Limitations* w raportach agentów.

### Kolejność pin (PO): B → C → A

Ustalenie na dziś: **najpierw Agent B, potem Agent C, na końcu Agent A** — dotyczy kolejności **review / domykania ryzyk / merge sensu**, nie „kto może commitować zero linii”.

| Krok | Agent | FU | Sens kolejności |
|------|-------|----|-----------------|
| 1 | **B** | **FU-2** | Kontrakt / następny krok Case Practice — żeby reszta nie budowała na piasku. |
| 2 | **C** | **FU-3** | Legacy history meta — spójność po zmianach kontraktu i zachowaniu historii. |
| 3 | **A** | **FU-1** | Copy / UX sensitive-case (warning vs block) — najlepiej po stabilizacji B+C, żeby nie dublować poprawek. |

**QC:** przyjmujcie submissiony jak wpływają, ale **pierwszy pełny werdykt blokowy** w tej rundzie follow-upów realizujcie zgodnie z pinem **B → C → A** (chyba że PO zmieni pin w tym pliku).

### Zasada anti-idle (obowiązkowa)

- **Checkpoint 2h:** w annex raportu wpis `### Checkpoint 2h (data/godzina)` + co zrobione + następny krok. Brak checkpointu = ryzyko blokady — Agent eskaluje do PO (wyjątek z procesu).
- **Bloker >2h na technice:** w tabeli zmień status FU na `BLOCKED (techniczny)` + jedna linia przyczyny; równolegle wykonaj **FU-PAR**.
- **MVP przed idealnie:** QC przyjmuje pierwszą iterację spełniającą *MVP DoD* w tabeli.

### Pierwszy konkretny ruch (start w <30 min)

| Owner | Pierwszy plik / akcja |
|-------|------------------------|
| **Agent A** | `frontend/src/app/assistant/AssistantPage.tsx` — w annex: 2 przykłady promptów (warning vs block) + które stringi UI zmieniasz. |
| **Agent B** | `docs/qc-reports/agent-b-report.md` — sekcja „Decyzja FU-2: ścieżka A lub B” + szkic 5–10 linii przed głęboką implementacją. |
| **Agent C** | `docs/qc-reports/agent-c-report.md` — tabela inferencji (min. 5 wierszy, może być szkic). |

| ID | Owner | Zadanie (konkret) | MVP DoD (wystarczy do `READY FOR QC` v1) | Status |
|----|-------|-------------------|------------------------------------------|--------|
| **FU-1** | Agent A | Pass copy/UX sensitive-case (warning vs block) | Zmiana w UI dla min. 2 scenariuszy + annex: prompty testowe + `cd /Users/nikodem/job-app-restore/proj/frontend && npm run build` OK | **Approved For Integration** (QC: `qc-fu-followup-pack-intake-2026-04-16.md`) |
| **FU-2** | Agent B | Case Practice — następny krok | Albo (B) raport: 3 pytania do PO + rekomendacja, albo (A) szkic w `shared/` (`// draft` OK) + 10 linii w raporcie | **Approved For Integration** (QC: ten sam pakiet) |
| **FU-3** | Agent C | Legacy history meta | Annex: tabela reguł + 3 kroki repro; test opcjonalny | **Approved For Integration** (QC: ten sam pakiet) |
| **FU-PAR** | Agent z BLOCKED na własnym FU | Praca pomocnicza | W annex: jedna linia czasu + wynik `cd /Users/nikodem/job-app-restore/proj/frontend && npm run build` + lista max 5 `TODO`/`FIXME` w `frontend/src/app/assistant` (bez obowiązku naprawy) | — |

**Uwaga:** FU-1..3 to **osobne** wejścia do QC — każde kończy się `READY FOR QC` i osobną linią statusu (poniżej możecie dopisać wiersze FU-1 itd. po submission).

---

## Kickoff Confirmation
- Mode: PO->QC Gate Active
- Operational Flow: Agent -> QC -> PO
- Communication Channel: `docs/qc-reports/`
- Agent Confirmation: Accepted And Started

## Agent A
- Status: **Approved For Integration** — **FU-1** (QC: `qc-fu-followup-pack-intake-2026-04-16.md`)
- Task Card (oryginał slice): `docs/qc-reports/agent-a-task-card.md`
- Report: `docs/qc-reports/agent-a-report.md` (sekcja FU-1 + annex z promptami testowymi + Checkpoint 2h)

## Agent B
- Status: **Approved For Integration** — **FU-2** (QC: `qc-fu-followup-pack-intake-2026-04-16.md`)
- **Inteligencja modułów (B) — bounded AFI 2026-04-20:** [`qc-verdict-agent-2-delivery-intelligence-legal-skill-jobradar-2026-04-19.md`](./qc-verdict-agent-2-delivery-intelligence-legal-skill-jobradar-2026-04-19.md) + intak [`agent-2-delivery-intelligence-legal-skill-jobradar-2026-04-19.md`](./agent-2-delivery-intelligence-legal-skill-jobradar-2026-04-19.md) — tylko trzy nazwane tranche’e; backend **`npm test -- --run` → 125/125**; otwarte: REST literal vs tRPC, brak pełnego Legal **`file_search`**, pełna spec Skill Lab / AI cost poza intakiem.
- Task Card: `docs/qc-reports/agent-b-task-card.md`
- Report: `docs/qc-reports/agent-b-report.md`
- Evidence: `cd /Users/nikodem/job-app-restore/proj/backend && npm run build && npm test -- --run src/services/__tests__/assistant-meta.spec.ts`

## Agent C
- Status: **Approved For Integration** — **FU-3** (QC: `qc-fu-followup-pack-intake-2026-04-16.md`; annex: `agent-c-report.md`) — **osobno** od pełnego zakresu Practice/Settings.
- **Practice / C-F1 (stan częściowy — odczyt PO):** **AFI** — wąski **Coach** (werdykty jak w sekcji Agent 3) + **osobno** **AFI** **Live Interview billing** [`qc-verdict-live-interview-billing-slice-2026-04-21.md`](./qc-verdict-live-interview-billing-slice-2026-04-21.md) (**nie** = cały Interview). **Not Approved:** §6 Interview/Negotiation [`agent-3-c-f1-interview-negotiation-server-billing-2026-04-21.md`](./agent-3-c-f1-interview-negotiation-server-billing-2026-04-21.md) — intake **błędny faktami**; **Agent 3** musi złożyć **poprawiony** §6. **NAFI:** szerszy Practice/Settings/Community. Szczegóły: **„Odczyt PO”** + **„Agent 3 (C)”** powyżej.
- **Visual Consistency Owner:** tak (od 2026-04-16) — obowiązki wg `docs/policies/visual-consistency-owner-role-spec.md`.
- **Alias:** **Vo** = Agent C (zapisane w raporcie i task card 2026-04-16).
- Task Card: `docs/qc-reports/agent-c-task-card.md`
- Report: `docs/qc-reports/agent-c-report.md`

## QC
- **Model operacyjny QC (format recenzji, pamięć raportów, delta vs poprzednie werdykty, eskalacja do PO):** [`../qc/qc-reporting-certification-and-po-communication-spec-v1.0.md`](../qc/qc-reporting-certification-and-po-communication-spec-v1.0.md) · indeks [`../qc/README.md`](../qc/README.md). Rola + checklisty modułów: [`../squad/Quality_Control_Developer_Spec.md`](../squad/Quality_Control_Developer_Spec.md).
- **2026-04-19:** Resubmission **wąski** (settings URL tab + Vitest + raport [`execution-practice-settings-qc-resubmission-2026-04-19.md`](./execution-practice-settings-qc-resubmission-2026-04-19.md)) — [`qc-verdict-settings-url-resubmission-2026-04-19.md`](./qc-verdict-settings-url-resubmission-2026-04-19.md): **Approved For Integration** (tylko wymienione pliki / zakres w werdykcie; **nie** cofa **Not Approved** dla całego tematu z 2026-04-18).
- **2026-04-19:** Job Radar OpenAPI v1.1 — [`qc-job-radar-openapi-contract-dev-handoff-2026-04-16.md`](./qc-job-radar-openapi-contract-dev-handoff-2026-04-16.md) (sekcja **QC Verdict**): **Approved For Integration** dla artefaktu kontraktu (YAML + testy w dokumencie). **2026-04-20 (repo vs artefakt):** po bounded Agent 2 w kodzie `OPENAPI_V1_1_GAPS_VS_REPO` = **1** pozycja (REST literal vs tRPC); intencje `from-saved-job` / employer history zrealizowane w **tRPC** — patrz werdykt Agent 2 + *Last update*.
- **2026-04-20:** Werdykt bounded Agent 2 — [`qc-verdict-agent-2-delivery-intelligence-legal-skill-jobradar-2026-04-19.md`](./qc-verdict-agent-2-delivery-intelligence-legal-skill-jobradar-2026-04-19.md); intak §6 (resync): [`agent-2-delivery-intelligence-legal-skill-jobradar-2026-04-19.md`](./agent-2-delivery-intelligence-legal-skill-jobradar-2026-04-19.md). **125/125** testów backend w ostatniej weryfikacji `npm test -- --run`.
- **2026-04-19:** Spot verification — [`qc-agent-work-spot-verification-2026-04-19.md`](./qc-agent-work-spot-verification-2026-04-19.md): werdykt integracji **identyczny** jak sekcja **Current QC status (binding — OpenAI / Assistant / Legal spot)** powyżej (AFI = tylko narrow slice; NAFI = wider batch + `qc-decision-practice-*` + pełny Legal `file_search`).
- **2026-04-18:** Practice modules + Settings/Community slice (pełny przedmiot decyzji) — [`qc-decision-practice-modules-settings-community-2026-04-18.md`](./qc-decision-practice-modules-settings-community-2026-04-18.md): **Not Approved For Integration** do czasu osobnego domknięcia pozostałych punktów.
- Status: **FU follow-up pack zamknięty** — [`qc-fu-followup-pack-intake-2026-04-16.md`](./qc-fu-followup-pack-intake-2026-04-16.md): **Approved For Integration** (FU-1, FU-2, FU-3; intake wg pinu B→C→A). Poprzedni slice Assistant + Case Practice bez zmian: [`qc-to-po-assistant-integration-2026-04-16.md`](./qc-to-po-assistant-integration-2026-04-16.md).
- **AI Live Smoke (ścieżka live):** [`qc-ai-live-smoke-2026-04-16.md`](./qc-ai-live-smoke-2026-04-16.md) — Session 2: **`Not Approved`** do czasu `OPENAI_API_KEY` w środowisku smoke + sukces wywołania modelu; **Approved For Integration** dla tego smoke wolno dopisać tylko po spełnieniu reguły w dokumencie (nowa sesja z dowodem).
- Packet To PO (zamknięty slice): `docs/qc-reports/qc-to-po-assistant-integration-2026-04-16.md`

## QC Rule
- Przed werdyktem: przeszukać **`docs/qc-reports/`** i **`docs/qc/`** pod kątem tego samego zakresu; w dokumencie recenzji **jawnie** odnotować status poprzednich raportów (§2 i §8 w [`../qc/qc-reporting-certification-and-po-communication-spec-v1.0.md`](../qc/qc-reporting-certification-and-po-communication-spec-v1.0.md)).
- No report in required format = no QC intake
- Chat-only status is invalid for acceptance

## Aktywna weryfikacja obiegu (PO / QC — powtarzalny audyt)

**Cel:** potwierdzić, że agenci składają raporty z `READY FOR QC`, że QC publikuje werdykty z kompletnym *Required Next Action* (w tym **Mandatory first line**), oraz że kod w repo się rusza (nie tylko czat).

1. **Mandatory first line w werdyktach** (każdy dokument z nagłówkiem **QC Verdict** musi zawierać ten sam tekst jako **pierwszą** treść pod *Required Next Action* — [`../qc/qc-reporting-certification-and-po-communication-spec-v1.0.md`](../qc/qc-reporting-certification-and-po-communication-spec-v1.0.md) §8). **Polityka repo:** pełny backfill w `docs/qc-reports/qc-*.md` (2026-04-19); brak linii = recenzja **niekompletna**.

```bash
cd /Users/nikodem/job-app-restore/proj && rg -l "^## QC Verdict|^### QC Verdict" docs/qc-reports --glob "qc-*.md"
```

```bash
cd /Users/nikodem/job-app-restore/proj && rg -l "Owning agent: required work is executed" docs/qc-reports --glob "qc-*.md"
```

Porównaj wyniki: pliki z pierwszego zestawu, których **nie** ma w drugim — **uzupełnij** (nie stosujemy wyłącznie grandfatheringu w nagłówku). Wyjątek: szablon w [`../qc/qc-reporting-certification-and-po-communication-spec-v1.0.md`](../qc/qc-reporting-certification-and-po-communication-spec-v1.0.md) — inna rola pliku.

2. **Agenci — sygnał dostawy:** `rg "READY FOR QC|Ready For QC" docs/qc-reports docs/qc --glob "*.md"` oraz świeże commity: `cd /Users/nikodem/job-app-restore/proj && git log --oneline -15 --date=short`.

3. **Otwarte bramki (czy praca idzie do przodu):** ten plik — sekcje **Current QC status**, **Cofnij do poprawy**, **AI Live Smoke**; brak nowego `READY FOR QC` + brak commitów przy otwartym wierszu = **anty-sygnał** do eskalacji na standupie.
