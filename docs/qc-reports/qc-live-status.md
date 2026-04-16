# QC Live Status

Last Update: 2026-04-16 (PO — anti-idle: MVP + checkpoint 2h + FU-PAR; **kolejność pin: B → C → A**)

## Broadcast do zespołu (czytajcie to pierwsze)

**Stan integracji:** slice **Assistant + Case Practice** ma od QC decyzję **Approved For Integration** — pakiet: `docs/qc-reports/qc-to-po-assistant-integration-2026-04-16.md`. To zamyka poprzedni cykl submission.

**Teraz obowiązują wyłącznie zlecenia z sekcji poniżej (PO).** Raportujecie do QC jak dotąd; statusy w tym pliku aktualizujcie przy każdym `READY FOR QC`.

| Rola | Co robicie teraz |
|------|------------------|
| **PO** | Zlecenia follow-up są w sekcji *PO — aktywne zlecenia*. Integracja poprzedniego slice jest zaakceptowana przy świadomości Known Gaps z pakietu QC→PO. |
| **Agent A / B / C** | Bierzecie **FU-1 / FU-2 / FU-3**. **W ciągu 2 godzin od odczytu tego pliku** musicie mieć *widoczny postęp*: commit albo dopisek w swoim `agent-*-report.md` (annex „Checkpoint 2h” — 3–5 linii: co zrobione / co następne). **Nie wolno stać w ciszy.** Po MVP: `READY FOR QC` w tabeli + aktualizacja statusu wiersza FU. |
| **Kto wdraża** | Gałąź robocza: `claude/improvements`. Weryfikacja referencyjna: `cd /Users/nikodem/job-app-restore/proj/backend && npm test && npm run build`, `cd /Users/nikodem/job-app-restore/proj/frontend && npm run build`. |

**Kanał komunikacji:** tylko `docs/qc-reports/` + łańcuch Agent → QC → PO (bez „statusu z czatu” jako dowodu wejścia do QC).

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
| **FU-1** | Agent A | Pass copy/UX sensitive-case (warning vs block) | Zmiana w UI dla min. 2 scenariuszy + annex: prompty testowe + `cd /Users/nikodem/job-app-restore/proj/frontend && npm run build` OK | READY FOR QC (Submitted) |
| **FU-2** | Agent B | Case Practice — następny krok | Albo (B) raport: 3 pytania do PO + rekomendacja, albo (A) szkic w `shared/` (`// draft` OK) + 10 linii w raporcie | READY FOR QC (Submitted) |
| **FU-3** | Agent C | Legacy history meta | Annex: tabela reguł + 3 kroki repro; test opcjonalny | ASSIGNED |
| **FU-PAR** | Agent z BLOCKED na własnym FU | Praca pomocnicza | W annex: jedna linia czasu + wynik `cd /Users/nikodem/job-app-restore/proj/frontend && npm run build` + lista max 5 `TODO`/`FIXME` w `frontend/src/app/assistant` (bez obowiązku naprawy) | — |

**Uwaga:** FU-1..3 to **osobne** wejścia do QC — każde kończy się `READY FOR QC` i osobną linią statusu (poniżej możecie dopisać wiersze FU-1 itd. po submission).

---

## Kickoff Confirmation
- Mode: PO->QC Gate Active
- Operational Flow: Agent -> QC -> PO
- Communication Channel: `docs/qc-reports/`
- Agent Confirmation: Accepted And Started

## Agent A
- Status: **READY FOR QC (Submitted)** — PO follow-up **FU-1** (sensitive-case copy/UX: warning vs block)
- Task Card (oryginał slice): `docs/qc-reports/agent-a-task-card.md`
- Report: `docs/qc-reports/agent-a-report.md` (sekcja FU-1 + annex z promptami testowymi + Checkpoint 2h)

## Agent B
- Status: **READY FOR QC (Submitted)** — task card meta + PO follow-up **FU-2** (sciezka A: draft w `shared/assistant.ts` + annex w raporcie)
- Task Card: `docs/qc-reports/agent-b-task-card.md`
- Report: `docs/qc-reports/agent-b-report.md`
- Evidence: `cd /Users/nikodem/job-app-restore/proj/backend && npm run build && npm test -- --run src/services/__tests__/assistant-meta.spec.ts`

## Agent C
- Status: **ASSIGNED** — PO follow-up **FU-3** (legacy history meta — annex + repro)
- Task Card: `docs/qc-reports/agent-c-task-card.md`
- Report: `docs/qc-reports/agent-c-report.md`

## QC
- Status: **Czeka na nowe submission** — FU-1, FU-2, FU-3 (poprzedni slice: Approved For Integration; pakiet poniżej bez zmian)
- Packet To PO (zamknięty slice): `docs/qc-reports/qc-to-po-assistant-integration-2026-04-16.md`
- AI Live Smoke (2026-04-16 11:55 BST): **BLOCKED — missing OPENAI_API_KEY**, report: `docs/qc-reports/qc-ai-live-smoke-2026-04-16.md`

## QC Rule
- No report in required format = no QC intake
- Chat-only status is invalid for acceptance
