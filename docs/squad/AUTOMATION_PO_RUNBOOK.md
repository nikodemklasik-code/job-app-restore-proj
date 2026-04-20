# Automat wykonawczy — runbook dla PO (przewidywalne awarie)

**Cel:** Każda awaria ma **nazwę klasy**, **stały kod wyjścia** i **jedną komendę diagnostyczną** — bez zgadywania, czemu pętla „nic nie robi”.

## Jedno polecenie przed decyzją

**Run In:** `/Users/nikodem/job-app-restore/proj` (albo ścieżka Twojego klona)

**Command:**

```bash
cd /Users/nikodem/job-app-restore/proj && bash scripts/automation/po-automation-health.sh
```

Opcjonalnie **żółta bramka** (nieudane = backlog QC / agent bez ruchu > 15 min):

```bash
cd /Users/nikodem/job-app-restore/proj && bash scripts/automation/po-automation-health.sh --strict
```

## Kody wyjścia (stabilne)

| Kod | Znaczenie | Co robi PO |
|-----|-----------|------------|
| **0** | Łańcuch + statusy parsowalne | Możesz patrzeć na treść zadań / QC; automat nie jest zablokowany „technicznie”. |
| **2** | `AUTO_TASK_CHAIN.tsv` wskazuje na **nieistniejący** plik RFQ | Albo **utwórz** plik pod ścieżką z kolumny `REPORT_PATH`, albo **usuń/wstrzymaj** wiersz w TSV do czasu RFQ. Nigdy odwrotnie (wiersz bez pliku = validator zawsze czerwony). |
| **3** | Brak pliku `docs/status/<rola>.status` | Odtwórz status przez `set-status.sh` albo skopiuj sensowny blok z `docs/status/.history/`. |
| **4** | Plik statusu jest, ale **brak czytelnego `STATE=`** w ostatnim bloku | Napraw format (jeden spójny blok jak generuje `set-status.sh`). |
| **5** | Brak `docs/squad/AUTO_TASK_CHAIN.tsv` | Przywróć plik z gita / backupu — to nie jest „pusta kolejka”, to zepsuty klon. |
| **10** | Tylko z **`--strict`**: ostrzeżenia o zastoju | Działanie ludzkie: QC intake, agent, lub aktualizacja `LAST_PROGRESS_AT` przez `set-status.sh`. |

Skrypt walidatora łańcucha: `scripts/automation/validate-task-chain.sh` — zwraca **0** albo **2** (oraz **5** przy braku pliku łańcucha).

## Trzy najczęstsze „fałszywe zatrzymania”

1. **„Silnik kręci się, ale nikt nie przechodzi dalej”**  
   Agent jest w `APPROVED_AWAITING_NEXT_ASSIGNMENT`, a **następny `REPORT_PATH` nie istnieje** — `auto-advance-task-chain.sh` celowo nie przypisuje.  
   **Fix:** dodaj plik RFQ + wiersz w TSV w **jednym** commicie (albo najpierw plik, potem wiersz).

2. **`run-task-engine-loop.sh` od razu wychodzi**  
   Na starcie woła `validate-task-chain.sh`; przy kodzie **2** pętla nie startuje.  
   **Fix:** jak wyżej — łańcuch musi być zawsze zgodny z dyskiem.

3. **STALE w tabeli pretty-terminal**  
   Brak lub stary `LAST_PROGRESS_AT` — agenci nie wołają `set-status.sh` przy realnym postępie.  
   **Fix:** procesowy: agent co sensowny krok aktualizuje status; PO może wymusić `set-status.sh` z tym samym `TASK` i nowym `NOTES`.

## Szybki widok kolejek (bez zaglądania w pliki)

**Run In:** `/Users/nikodem/job-app-restore/proj`

**Command:**

```bash
cd /Users/nikodem/job-app-restore/proj && bash scripts/automation/po-next.sh
```

## Zasada przewidywalności dla zespołu

- **Nie** dodawaj wiersza do `AUTO_TASK_CHAIN.tsv`, dopóki plik w `REPORT_PATH` nie istnieje (wyjątek: ten sam commit tworzy oba).  
- **Jedna klasa błędu = jeden skrypt** naprawczy: najpierw `po-automation-health.sh`, potem dopiero debug w treści zadań.

## Format `docs/status/*.status` (kanon)

- **Jedyna ścieżka zapisu:** `scripts/automation/set-status.sh` — ustawia `ROLE`, `STATE`, `TASK`, `REPORT`, `VERDICT`, `UPDATED_AT`, `LAST_PROGRESS_AT`, `NOTES`, `PROGRESS` oraz kopiuje snapshot do `docs/status/.history/`.
- Skrypty `po-handle-bottleneck.sh`, `qc-assign-rework.sh`, `set-current-state-now.sh` wołają `set-status.sh` (bez ręcznego `python` / heredoca do `.status`), żeby `status-lib.sh` i `po-automation-health.sh` zawsze widziały ten sam kształt pliku.

Powiązane: [`TODAY_EXECUTION_BOARD.md`](./TODAY_EXECUTION_BOARD.md), [`ACTIVE_EXECUTION_AND_QC_LOOP_RULES.md`](./ACTIVE_EXECUTION_AND_QC_LOOP_RULES.md).
