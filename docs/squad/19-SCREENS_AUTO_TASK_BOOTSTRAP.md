# 19 screens — bootstrap pod automatyczne środowisko wykonania

**Cel:** PO może podzielić pracę wg [`../features/19-screens-canonical-implementation-and-gap-map-v1.md`](../features/19-screens-canonical-implementation-and-gap-map-v1.md) (§7–§9) i **podłączyć** ją pod istniejący automat (`AUTO_TASK_CHAIN`, `validate-task-chain`, pętla silnika), bez zgadywania kolejności kroków.

## 1. Materiały źródłowe (już w repo)

| Dokument | Po co |
|----------|--------|
| **`docs/squad/`** (`19-SCREENS_RFQ_TEMPLATE.md`, `READY_FOR_QC_REPORT_TEMPLATE.md`, `19-SCREENS_FIRST_PRODUCTION_SLICES.tsv`, `PO_BOOTSTRAP_CHECKLIST.md`, …) | **Repo-ready (Spokkn):** jedyne kanoniczne szablony slice (bez duplikatów w podfolderach) |
| **[`po-examples/README.md`](./po-examples/README.md)** | Przykłady RFQ / READY_FOR_QC — **poza** `docs/qc-reports/`, żeby nie mylić z prawdziwym intake |
| **[`po-repo-ready-bundle/README.md`](./po-repo-ready-bundle/README.md)** | Notatka importu ZIP (bez rozwiniętego `unpacked/` — usunięte jako źródło dryfu) |
| **[`po-bootstrap/README.md`](./po-bootstrap/README.md)** | Redirect: stary folder `po-bootstrap` bez kopii plików |
| **[`production-ready-modules-bundle/README.md`](./production-ready-modules-bundle/README.md)** | Import **8 modułów** (`production_ready_modules_bundle.zip`): Legal, Skill Lab, Case Practice, Interview, Coach, Warmup, Negotiation, Job Search |
| [`8-modules-production-ready-pack-v1.md`](../features/8-modules-production-ready-pack-v1.md) | Indeks plików `*-production-ready-v1.md` + TSV `8-MODULES_*` |
| **[`remaining-screens-production-ready-bundle/README.md`](./remaining-screens-production-ready-bundle/README.md)** | Import **pozostałych screenów** (`remaining_screens_production_ready_bundle.zip`): Dashboard, Profile, Applications, … |
| [`remaining-screens-production-ready-pack-v1.md`](../features/remaining-screens-production-ready-pack-v1.md) | Indeks + TSV `REMAINING-SCREENS_*` |
| [`19-screens-canonical-implementation-and-gap-map-v1.md`](../features/19-screens-canonical-implementation-and-gap-map-v1.md) | Tier 1–4, mapa GREEN/YELLOW/RED, właściciel BE/FE, DoD per ekran |
| [`19-screens-production-readiness-and-cross-flows-v1.md`](../features/19-screens-production-readiness-and-cross-flows-v1.md) | Definicja „produkcyjny”, braki per ekran, **połączenia między ekranami**, billing/reports spine |
| [`19-screens-implementation-spec-v1.md`](../features/19-screens-implementation-spec-v1.md) | Wspólne reguły UI/dane/billing/test + format tasku |
| [`19-screens-gap-map-v1.md`](../features/19-screens-gap-map-v1.md) | Krótka mapa luk (tabela + stopka importu) |
| [`19-screens-route-contracts-v1.md`](../features/19-screens-route-contracts-v1.md) | Kontrakty route / minimalny kontrakt BE |
| [`AUTOMATION_PO_RUNBOOK.md`](./AUTOMATION_PO_RUNBOOK.md) | Kody wyjścia, `po-automation-health.sh`, reguła plik RFQ przed wierszem w TSV |
| [`TODAY_EXECUTION_BOARD.md`](./TODAY_EXECUTION_BOARD.md) | Bieżący tranche (ręcznie zsynchronizuj z §7 po starcie nowej fali) |

## 2. Mapowanie Agent 1/2/3 → A / B / C

| Wiersz w `AUTO_TASK_CHAIN.tsv` | Kanoniczny tor z gap map |
|-------------------------------|---------------------------|
| `AGENT_1` | **Agent A** — Core + trust (Billing, Profile, Dashboard aggregate, Applications, Documents, Settings) |
| `AGENT_2` | **Agent B** — Intelligence (Jobs, Job Radar, Skill Lab, AI Analysis contract, Legal Hub Search) |
| `AGENT_3` | **Agent C** — Practice + powierzchnie (Assistant, Interview, Coach, Warmup, Negotiation, Applications Review, Community MVP) |

Przy planowaniu **kolejnego** taska wybierz ekran z §7 w kolejności tierów, ale **nie** łam zasady: jeden wiersz łańcucha = jeden plik RFQ na dysku.

## 3. Checklist PO przed pierwszym slice w automacie

1. **Wybór slice:** tytuł wg §9: `[SCREEN_NAME] [BOUNDED_SLICE] [OUTCOME]` (np. `[DASHBOARD] [AGGREGATE] [dashboard.getSnapshot + FE header]`).
2. **RFQ:** utwórz `docs/qc-reports/<agent>-<krótki-slug>-ready-for-qc.md` (szkielet: route, pliki FE/BE, out of scope, komendy testów).
3. **Łańcuch:** dopisz wiersz `AGENT_*` w `docs/squad/AUTO_TASK_CHAIN.tsv` z **tym samym** `REPORT_PATH` (commit razem z plikiem RFQ albo najpierw plik).
4. **Walidacja:**  
   **Run In:** ścieżka klona  

   ```bash
   cd /Users/nikodem/job-app-restore/proj && bash scripts/automation/po-automation-health.sh
   ```  

   Kod **0** = automat może wstać; **2** = brak pliku / zły TSV.
5. **Status agenta:**  

   ```bash
   cd /Users/nikodem/job-app-restore/proj && bash scripts/automation/set-status.sh AGENT_1 ASSIGNED "<TASK z RFQ>" "docs/qc-reports/....md" "" "Assigned from 19-screen tier" "25"
   ```  

   (Podmień `AGENT_1` / ścieżkę / opis wg realnego assignee.)
6. **Pętla operacyjna (opcjonalnie):**  

   ```bash
   cd /Users/nikodem/job-app-restore/proj && bash scripts/automation/run-task-engine-loop.sh
   ```  

   Pętla sama **nie wymyśla** zadań — tylko `auto-advance-task-chain.sh` + podgląd; nowe slice’y zawsze wchodzą przez kroki 2–3.

## 4. Czego ten dokument świadomie NIE zastępuje

- **Nie** generuje sam wierszy TSV ani RFQ — to decyzja PO po §7.
- **Nie** uruchamia agentów AI — tylko porządkuje repo + pliki statusu + walidator.
- **Community (RED)** — pierwszy slice wymaga nowej route + min. jednej akcji BE; pierwszy RFQ musi to jawnie opisać zanim trafi do łańcucha.

## 5. Szybka synchronizacja boardu

Po ustaleniu nowego tranche zaktualizuj [`TODAY_EXECUTION_BOARD.md`](./TODAY_EXECUTION_BOARD.md) (wiersze per agent): **nazwa slice**, **link do RFQ**, **odniesienie do §7 tier + numer ekranu w canonical gap map**.
