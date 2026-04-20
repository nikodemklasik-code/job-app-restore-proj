# Squad — podział A / B / C z bramką certyfikatu QC (v1.0)

**Status:** uzupełnia [`README.md`](./README.md) i [`Squad_Workboard.md`](./Squad_Workboard.md). Nie zastępuje workboardu faz — precyzuje **nazewnictwo A/B/C** oraz **kiedy wolno uznać implementację za zamkniętą**.

---

## Mapowanie ról (obowiązujące)

| Litera | Agent | Spec |
|--------|-------|------|
| **A** | Agent 1 | [`Agent_1_Foundations_Spec.md`](./Agent_1_Foundations_Spec.md) |
| **B** | Agent 2 | [`Agent_2_Intelligence_Modules_Spec.md`](./Agent_2_Intelligence_Modules_Spec.md) |
| **C** | Agent 3 | [`Agent_3_Practice_And_Preferences_Spec.md`](./Agent_3_Practice_And_Preferences_Spec.md) |

W komunikacji w repo i raportach można używać zamiennie **A / Agent 1**, **B / Agent 2**, **C / Agent 3**.

---

## Czym jest „certyfikat QC”

**Certyfikat QC** = jawny wpis w `docs/qc-reports/*.md` ze statusem końcowym zgodnym z [`docs/policies/quality-control-developer-role-spec.md`](../policies/quality-control-developer-role-spec.md): dla danego zakresu pracy wystawiony zostaje werdykt **`Approved For Integration`**.

- **`Not Approved For Integration`** — implementacja **nie** jest zamknięta; zakres wraca do poprawek u właścicielskiego agenta.
- Brak pliku / brak werdyktu — **brak certyfikatu**; nie wolno traktować slice’u jako domkniętego produktowo ani przenosić na PO jako „gotowe”.

---

## Zasada główna: implementacja kończy się dopiero po certyfikacie QC

1. **Koniec implementacji dla zakresu X** następuje wyłącznie wtedy, gdy dla **tego samego zakresu X** istnieje decyzja QC **`Approved For Integration`** (certyfikat), powiązana z raportem dostawy (`READY FOR QC`, format zgodny z [`execution-reporting-standard.md`](../policies/execution-reporting-standard.md)).

2. **Łańcuch „uprzedniego” certyfikatu (zależności):** jeżeli zakres prac B lub C **kontraktowo** opiera się na dostarczonym przez A API / schemacie / zachowaniu billing (lub innej jawnej zależności z workboardu), to **B lub C nie uznaje swojej implementacji za domkniętą**, dopóki **wymagany uprzednio** slice A (lub inny wskazany w tabeli poniżej) **nie posiada** certyfikatu QC `Approved For Integration` dla tej zależności.

3. **PO** wchodzi po QC, zgodnie z [`Product_Owner_Spec.md`](./Product_Owner_Spec.md) (*Review order*, *PO approval gate*) — certyfikat QC **nie** zastępuje sign-offu PO tam, gdzie PO jest wymagany.

---

## Podział prac z bramkami (fazy workboardu × A / B / C)

Zakres funkcjonalny faz nadal wynika z [`Squad_Workboard.md`](./Squad_Workboard.md). Poniżej tylko **reguły certyfikatu** — kiedy wolno uznać implementację danej fazy za **zakończoną**.

### A (Agent 1)

| Faza | Implementacja (skrót) | Uprzedni certyfikat QC przed domknięciem |
|------|------------------------|------------------------------------------|
| **1** | Billing engine, allowance, balance / packs / spend / approval | *Brak* względem innych agentów — slice **A-F1** kończy się dopiero po własnym `Approved For Integration` z QC |
| **2** | Profil jako SoT (work values, próg, growth, roadmap, …) | **`Approved` dla A-F1** (faza uprzednia tego samego agenta), zanim A uzna **A-F2** za domknięte; plus `Approved` dla **A-F2** po QC tego slice’u |
| **4** | Deploy integrity | **`Approved` dla A-F1 i A-F2** (i innych faz A, jeśli deploy dotyka ich kodu); slice kończy się po **`Approved` dla A-F4** z QC |

### B (Agent 2)

| Faza | Implementacja (skrót) | Uprzedni certyfikat QC przed domknięciem |
|------|------------------------|------------------------------------------|
| **2** | Skill Lab — rdzeń logiki | **`Approved` dla A-F2** (profil / kontrakty), zanim B uzna **B-F2** za domknięte; plus `Approved` dla **B-F2** |
| **3** | Job Radar, Legal Hub, PDF, źródła | **`Approved` dla B-F2** (faza uprzednia B) + **`Approved` dla A-F2** (billing/profil przy kosztach); plus `Approved` dla **B-F3** |
| **4** | Dopracowania B | **`Approved` dla B-F3** (faza uprzednia B); slice kończy się po **`Approved` dla B-F4** z QC |

### C (Agent 3)

| Faza | Implementacja (skrót) | Uprzedni certyfikat QC przed domknięciem |
|------|------------------------|------------------------------------------|
| **1** | Praktyka: nazwy, routing, shared shell | Jeśli **C-F1** debituje / woła billing: **`Approved` dla A-F1** przed domknięciem **C-F1**; zawsze `Approved` dla **C-F1** po QC |
| **2** | Settings + consent (podstawy) | **`Approved` dla C-F1** + **`Approved` dla A-F2** (dane profilu/zgód z backendu); jeśli UI łączy Skill Lab: także **`Approved` dla B-F2** — opis zakresu w decyzji QC |
| **3** | Community + koszty w praktyce | **`Approved` dla C-F2** + **`Approved` dla B-F3** (gdy Community dotyka ofert / Legal / kredytów); plus `Approved` dla **C-F3** |
| **4** | Polish praktyki + settings | **`Approved` dla C-F3** (faza uprzednia C); slice kończy się po **`Approved` dla C-F4** z QC |

**Łączenie slice’ów:** jeden raport QC z jednym `Approved` może pokrywać kilka liter (np. A+C), o ile **lista plików i zakres** są jednoznaczne w `docs/qc-reports/`.

---

## Obowiązek dokumentowania certyfikatu

Po każdym `Approved For Integration` QC **aktualizuje** krótką linię statusu (np. [`docs/qc-reports/qc-live-status.md`](../qc-reports/qc-live-status.md)) oraz **linkuje** nowy plik decyzji — żeby A/B/C i PO widzieli, który **uprzedni** certyfikat zwalnia następne domknięcie.

---

## Historia

| Data | Zmiana |
|------|--------|
| 2026-04-18 | v1.0 — mapowanie A/B/C ↔ Agent 1–3; zasada domknięcia implementacji po certyfikacie QC + łańcuch zależności. |
