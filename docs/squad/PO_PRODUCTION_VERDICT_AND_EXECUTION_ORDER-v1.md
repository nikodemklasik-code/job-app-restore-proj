# PO — werdykt priorytetów i rozkaz wykonawczy (Dashboard first)

**Status:** binding execution order for agents and automation  
**Audience:** Product Owner, Agent 1/2/3, QC, Auto  
**Related:** [`PO_PRODUCTION_GAPS_AND_AGENT_SCOPED_ACTIONS.md`](./PO_PRODUCTION_GAPS_AND_AGENT_SCOPED_ACTIONS.md) · [`19-SCREENS_AUTO_TASK_BOOTSTRAP.md`](./19-SCREENS_AUTO_TASK_BOOTSTRAP.md) · [`AUTOMATION_PO_RUNBOOK.md`](./AUTOMATION_PO_RUNBOOK.md)

---

## 1. Co dokładnie blokuje produkcję

Są trzy poziomy blokady.

### Poziom 1. Blokada absolutna, bez tego nic nie ruszy

To są rzeczy, które muszą być wykonane przez PO/QC/ops i agent ich nie zastąpi.

**A1. Brak nowego wiersza w `AUTO_TASK_CHAIN.tsv` i brak `REPORT_PATH`**  
To jest blokada krytyczna numer 1.  
Skutek: agent może coś zakodować, ale automatyka nie ma legalnego następnego celu. Praca ląduje w próżni.

**A2. Brak fizycznych RFQ w `docs/agent-work/`**  
To jest blokada krytyczna numer 2.  
Skutek: backlog istnieje opisowo, ale nie istnieje wykonawczo. Nie ma aktywnego slice’a jako bytu roboczego.

**A3. Brak realnego `TASK` / `REPORT` + brak `set-status.sh` na faktycznych artefaktach**  
To jest blokada sterowania przepływem.  
Skutek: system statusów nie odzwierciedla pracy, więc `po-next` i auto-advance nie są wiarygodne.

**A4. Brak werdyktów QC**  
To jest blokada integracyjna.  
Skutek: nawet skończony slice nie przechodzi do następnego kroku, bo nie ma AFI/REWORK.

Twardy wniosek:

**Dziś produkcję blokuje przede wszystkim brak operacyjnego „legal path to done”.**

### Poziom 2. Blokada wdrożeniowa

To są rzeczy poza repo.

**A5. DDL / migracje / dowody na docelowej bazie**  
Jeśli slice dotyka schematu, bez tego nie ma uczciwej gotowości produkcyjnej.

**A6. Deploy na VPS / sekrety / runner**  
Repo może być gotowe, ale produkcja nie istnieje bez środowiska. Agent w repo nie dotknie Twoich sekretów ani VPS.

### Poziom 3. Blokada produktowa

Tu wchodzą konkretne brakujące slice’y. To nie zatrzymuje samego ruchu operacyjnego, ale zatrzymuje domknięcie wartości użytkowej.

---

## 2. Które braki produktowe są najważniejsze

Nie wszystkie TODO/PLANNED są równie pilne. Trzy kosze.

### Kosz A. Da się zrobić teraz jako uczciwy production slice

**Dashboard** — najbardziej sensowny pierwszy slice integracyjny: jeden kontrakt snapshotowy BE/FE, stany strony, jeden CTA; nie wymaga od razu pełnej semantyki wszystkich domen.

**Settings** — jeśli są martwe toggle’e; server-backed read/write jako ograniczony slice.

**Billing** — widoczność ledger / pending spend (kontrola ryzyka).

**Applications** — jeśli domena już istnieje: stage transitions + audit trail jako pionowy plaster.

**Community Centre** — tylko świadomy MVP: route + shell + jedna trwała akcja (nie „pełny community module”).

### Kosz B. Da się zrobić, ale wymaga ostrej kontroli zakresu

**Applications Review**, **Document Lab** (wąski lineage v1), **Style Studio**, **Job Radar** (utwardzenie tylko przy stabilnym wejściowym flow).

### Kosz C. Nie powinny być pierwszym production ruchem

**AI Assistant** (ownership / payload), **AI Analysis**, **Legal Hub** (retrieval niedomknięty), **Interview** (szeroki lifecycle), **Coach / Warmup / Negotiation / Skill Lab / Job Search** — można później; większe ryzyko ukrytych zależności.

---

## 3. Werdykt priorytetów

### P0 operacyjne (najpierw)

1. Utworzyć legalny wpis chain.  
2. Utworzyć RFQ + report files.  
3. Ustawić statusy.  
4. Dopiero potem implementacja.

### Pierwszy production slice

**Dashboard aggregate** — wysoki efekt widoczny, integruje projekt, bounded scope, szybki test kontraktów FE/BE, nie wymaga dojrzałości AI/Legal/Practice naraz.

### Drugi slice po Dashboard

**Billing visibility** albo **Settings server-backed** — jeśli koszty są ryzykiem: Billing; jeśli UI udaje konfigurację: Settings.

### Community

Dopiero przy świadomym zdjęciu RED jako MVP, nie jako „cała społeczność”.

---

## 4. Co agent Auto może / nie może (repo)

### Może

- Przygotować artefakty RFQ/report (ścieżki, szablony).  
- Wykonać wąski pion FE+BE (np. Dashboard: `dashboard.getSnapshot`, DTO, strona, loading/empty/error, 1 CTA, test kontraktu + render).  
- Uszczelnić automatyzację workflow (walidatory, statusy, komunikaty).  
- Community MVP wąsko (route + shell + jedna trwała procedura).  
- Testy kontraktowe (DTO, procedura, render z mockiem).  
- Migracja w repo (nie potwierdza prod DB).

### Nie może

- Werdyktu QC ani zastąpienia decyzji PO o priorytecie / scalaniu TSV.  
- Deploy na prod, sekrety, runner, stan prod DB.  
- Uczciwie ogłosić „production ready” dla niedomkniętych domen (Legal retrieval, pełny AI context, itd.).

---

## 5. Kroki wykonawcze (fazy)

### Faza 1 — odblokowanie procesu

1. Dodać wiersz do `AUTO_TASK_CHAIN.tsv` z legalnym następnym krokiem i istniejącym `REPORT_PATH`.  
2. Utworzyć fizyczne RFQ (`docs/agent-work/`) i plik reportu (`docs/qc-reports/`).  
3. Ustawić statusy przez `set-status.sh` na konkretnych TASK/REPORT.

### Faza 2 — pierwszy pionowy slice

**Dashboard aggregate** — minimalnie: `dashboard.getSnapshot`, ograniczony DTO, `DashboardPage`, loading/empty/error/success, jeden next step, test kontraktu, test renderu.  
**Poza zakresem tego slice:** pełne widgety wszystkich modułów, wielokrokowe akcje, „inteligentny dashboard AI”, pełne edge case’y wszystkich domen.

### Faza 3 — QC

READY_FOR_QC → AFI lub REWORK → dopiero potem advance.

### Faza 4 — drugi slice

Billing visibility **albo** Settings server-backed (wg ryzyka biznesowego).

---

## 6. Mapa: sensowne vs ryzykowne vs nie na pierwszy ruch

### Sensowne teraz

Dashboard aggregate, Billing visibility, Settings server-backed, Applications stage transitions (jeśli domena jest), Community jako cienki MVP.

### Ryzykowne teraz

Document Lab lineage bez semantyki wersji, Style compare bez stabilnych trybów, Job Radar hardening przy niestabilnym flow wejściowym.

### Nie na pierwszy ruch

AI Assistant context bundle, AI Analysis szerzej, Legal retrieval-heavy, szeroki Interview lifecycle, praktyka jako grupa bez decyzji PO, scalanie całego backlogu 19/8/remaining w jeden łańcuch bez decyzji PO.

---

## 7. Skrót odpowiedzi

**Największe braki vs produkcja:** oprócz TODO na ekranach — brak legalnego chain + RFQ/report + statusów + werdyktu QC + migracji/deploy/sekretów poza repo + slice’ów w TODO/PLANNED.

**Co Auto może:** artefakty, wąski slice FE+BE, testy, automatyzacja, wąski Community MVP, migracja w repo.

**Co Auto nie może:** QC/PO zamiennik, deploy prod, potwierdzenie prod DB, fałszywe „production ready” za niedomknięte domeny.

**Pierwszy ruch:** odblokować chain (A1–A4), potem **Dashboard aggregate**.

---

## 8. Rozkaz wykonawczy (binding)

**Operacyjnie (P0):** traktować **A1–A4** jako blocker; nie zaczynać szeroko AI/Legal/Interview jako pierwszego kroku produkcyjnego.

**Kolejność produktu:** **Dashboard aggregate** → potem **Billing visibility** albo **Settings server-backed** → Community tylko jako świadome MVP.

**Dla Auto:** wykonać **C1 + C2 dla Dashboard aggregate** (artefakty + wąski pion), uszczelnić workflow tylko w granicach legalnego przejścia tasku, **bez poszerzania scope**.

**Dla człowieka (PO/QC/ops):** natychmiast zapewnić chain + `REPORT_PATH` + RFQ/report + później werdykt QC; osobno domknąć deploy / sekrety / dowody DB.
