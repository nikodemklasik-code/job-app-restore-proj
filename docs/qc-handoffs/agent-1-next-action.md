# Agent 1 — QC Next Action (aktualne)

**Stan:** `REWORK_REQUIRED` — Dashboard aggregate snapshot (`A1_T3`)  
**Zaktualizowano:** 2026-04-19  
**Raport dostawy:** [`docs/qc-reports/dashboard-dashboard-aggregate-snapshot-ready-for-qc.md`](../qc-reports/dashboard-dashboard-aggregate-snapshot-ready-for-qc.md)  
**Werdykt QC:** [`docs/qc-reports/qc-verdict-agent-1-dashboard-aggregate-snapshot-2026-04-19.md`](../qc-reports/qc-verdict-agent-1-dashboard-aggregate-snapshot-2026-04-19.md)

---

## Co Agent 1 faktycznie zrobił (ponowna weryfikacja)

| Element | Stan |
|---------|------|
| **`dashboard.getSnapshot`** | Jest w `backend/src/trpc/routers/dashboard.router.ts` — `protectedProcedure`, dane z `ctx.user.id`, agregaty profilu / aplikacji / billing / practice / `nextAction`. |
| **Frontend** | `DashboardPage.tsx` woła `api.dashboard.getSnapshot.useQuery` z `enabled` zależnym od Clerk — zgodne z raportem. |
| **Testy w repo** | Plik [`dashboard.router.spec.ts`](../../backend/src/trpc/routers/__tests__/dashboard.router.spec.ts) zawiera **tylko** testy **`mapApplicationStatusToDashboard`** (mapper). **Nie** ma hermetycznych testów procedury **`getSnapshot`**. |
| **Raport dostawy** | Sekcja „Scope delivered” / „Hermetic vitest for bootstrap branch” **nadal** sugeruje pokrycie `getSnapshot` — to jest **niezgodne z kodem testów** (nagłówek z adnotacją QC tylko częściowo to łagodzi). |

Wniosek: **implementacja snapshotu jest**, **dowód testowy dla routera zgodny z raportem — nie**.

---

## Co Agent 1 ma zrobić (jednoznacznie)

Wykonaj **opcję A albo B** (albo obie — najlepiej A), potem **odśwież RFQ** i status.

### Opcja A — preferowane (jakość)

1. Dopisz w `backend/src/trpc/routers/__tests__/dashboard.router.spec.ts` (lub osobnym pliku obok) **hermetyczne** testy **`dashboard.getSnapshot`**:
   - `vi.mock('../../db/index.js')` oraz ewentualnie mock `getAccountState` z `creditsBilling`, jeśli ścieżka billing jest wywoływana w `getSnapshot`.
   - Minimum: **jeden** happy-path — zwrócone rekordy z `select`/`count`/`groupBy` ustawione tak, by output przeszedł `snapshotOutputSchema`.
   - Minimum: **jedna** ścieżka błędu lub braku użytkownika — zgodna z faktycznym kodem (np. `NOT_FOUND` gdy brak wiersza w `users`), żeby raport nie obiecywał „bootstrap”, którego kod nie realizuje.
2. Uruchom i wpisz w raport dokładną komendę + wynik Vitest.

### Opcja B — jeśli nie robisz testów routera w tym slice

1. W pliku [`dashboard-dashboard-aggregate-snapshot-ready-for-qc.md`](../qc-reports/dashboard-dashboard-aggregate-snapshot-ready-for-qc.md) **usuń lub przepisz** zdania o „hermetycznym vitest dla bootstrap / getSnapshot”.
2. Jasno napisz: **„Automatyczne testy: tylko mapper statusów aplikacji; `getSnapshot` — smoke manualny / osobny intake”** — bez przesadywania pokrycia.
3. Jeśli tak zostawiasz, **PO musi świadomie zaakceptować** brak testów pod router (to osłabia bramkę QC).

### Zawsze po zmianach

4. Zaktualizuj [`docs/status/agent-1.status`](../status/agent-1.status): `STATE=READY_FOR_QC`, świeży `UPDATED_AT`, `NOTES` z linkiem do zaktualizowanego raportu.  
5. **Nie poszerzaj** zakresu poza ten raport bez nowej linii od PO.

---

## Czego nie robić

- Nie certyfikuj „pełnego dashboardu produktowego” z jednego slice’a.  
- Nie zmieniaj treści werdyktu QC — na poprawkę odpowiada nowy przebieg QC po resubmit.
