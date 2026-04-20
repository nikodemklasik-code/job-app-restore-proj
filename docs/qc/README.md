# QC workspace (`docs/qc/`)

**Wykonanie implementacji (cały squad — szukanie raportów, dostawa agenta, recenzja QC, integracja, PO):** [`../squad/IMPLEMENTATION_EXECUTION_RULES.md`](../squad/IMPLEMENTATION_EXECUTION_RULES.md)

**Kanoniczny model pracy QC (raporty, certyfikacja, PO, format recenzji):** [`qc-reporting-certification-and-po-communication-spec-v1.0.md`](./qc-reporting-certification-and-po-communication-spec-v1.0.md)

## Gdzie co leży

| Lokalizacja | Rola |
|-------------|------|
| **`docs/qc/`** (ten katalog) | Nowe raporty QC wg nazewnictwa `QC_<module>_<phase>_<date>.md` lub z statusem w nazwie — patrz spec §13 |
| **`docs/qc-reports/`** | Broadcast (`qc-live-status.md`), decyzje intake, raporty agentów, smoke — **przeszukuj obowiązkowo** razem z `docs/qc/` |
| **`docs/squad/`** | SoT wykonania: [`../squad/IMPLEMENTATION_EXECUTION_RULES.md`](../squad/IMPLEMENTATION_EXECUTION_RULES.md); spec QC: [`../squad/Quality_Control_Developer_Spec.md`](../squad/Quality_Control_Developer_Spec.md) |

## Podkatalogi (fazy)

Umieszczaj nowe pliki QC zgodnie z fazą squadu:

- [`phase-1/`](./phase-1/README.md)  
- [`phase-2/`](./phase-2/README.md)  
- [`phase-3/`](./phase-3/README.md)  
- [`phase-4/`](./phase-4/README.md)  
- [`modules/`](./modules/README.md) — opcjonalnie per moduł (`billing/`, `practice/`, …) gdy narasta liczba plików  

Brak pliku w danej fazie = normalne na początku; **nie** blokuj QC od przeszukiwania `docs/qc-reports/`.

**Słowa werdyktu przy integracji** — spójnie z [`../policies/quality-control-developer-role-spec.md`](../policies/quality-control-developer-role-spec.md): końcowa decyzja merge/release = **Approved For Integration** albo **Not Approved For Integration**. Wewnątrz raportu możesz użyć skrótów z modelu operacyjnego (Approved / Rejected / Rework Required / Conditionally Approved), byle końcowa linia decyzji była zgodna z polityką integracji.
