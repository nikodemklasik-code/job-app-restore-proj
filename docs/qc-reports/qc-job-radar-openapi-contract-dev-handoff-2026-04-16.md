# Job Radar OpenAPI v1.1 Contract — Developer Handoff for QC (2026-04-16)

## Jedyny kanał komunikacji (wątek Job Radar OpenAPI contract)

**Ustalenie:** dla tego zadania cała oficjalna wymiana (developer → QC → product owner / Ciebie → ewentualny powrót do dev) odbywa się **wyłącznie w tym pliku w repozytorium**, nie w równoległych „nieoficjalnych” wątkach bez śladu w repo.

**Kontrakt vs sekrety vs deploy:** źródłem prawdy OpenAPI jest plik w git [`docs/job-radar/job-radar-openapi-v1.1.yaml`](../job-radar/job-radar-openapi-v1.1.yaml). Nie mylić z `OPENAI_API_KEY` ani z markerami integralności deploy — [`docs/job-radar/CONTRACT-KEYS-AND-SECRETS.md`](../job-radar/CONTRACT-KEYS-AND-SECRETS.md).

| Element | Zasada |
|--------|--------|
| **Ścieżka kanoniczna** | `docs/qc-reports/qc-job-radar-openapi-contract-dev-handoff-2026-04-16.md` (w klonie: pełna ścieżka od rootu monorepo) |
| **Developer** | Aktualizuje sekcje techniczne powyżej; przy zmianie statusu intake edytuje **Status** i ewentualnie **What Exactly Was Done** / **Known Limitations**. |
| **QC** | Dopisuje na końcu pliku sekcję **QC Verdict** (data, wynik: Approved for integration / Not approved, uzasadnienie, komendy które uruchomił). Nie zastępuje bez uzgodnienia faktów dev — tylko werdykt i uwagi. |
| **Ty (PO / właściciel)** | Decyzje priorytetu i „co dalej” po QC — jako commit w tym samym pliku (np. krótka sekcja **PO follow-up**) albo osobny commit z linkiem do tego pliku; unikaj równoległego „źródła prawdy” poza repo. |

Inne kanały (czat, e-mail) mogą służyć tylko do **wysłania linku do tego pliku** lub pilnego pinga, nie do przenoszenia treści werdyktu bez zapisu tutaj.

**Ogólna wiadomość Dev → QC** (inne zakresy, pytania, pakiet UX obok Job Radar): [`qc-developer-to-qc-sync-2026-04-17.md`](./qc-developer-to-qc-sync-2026-04-17.md) — tam QC może dopisać sekcję **Odpowiedź QC**; **werdykt Job Radar** nadal zapisujemy **w tym pliku** w **QC Verdict** poniżej.

---

## Status

- **Executor intake:** **READY FOR QC** (checklist wyżej — bez zmiany faktów technicznych).
- **QC:** przegląd zakończony — sekcja **QC Verdict** poniżej (2026-04-19); wynik: **Approved For Integration** dla wątku kontraktu przy 3 jawnych lukach (szczegóły w werdykcie).

## What Exactly Was Done

- Added and maintained **OpenAPI contract tests** that read **only** `docs/job-radar/job-radar-openapi-v1.1.yaml` from the monorepo path (no invented paths, methods, or schema fields).
- Parsed that YAML with the **`yaml`** dev dependency in `backend`.
- Asserted contract surface for **POST `/job-radar/scan`**: declared response codes (`202`, `400`, `401`, `403`, `409`, `429`), `ScanRequest` / `ScanStatus` / `ScanAcceptedResponse` structure and required fields, and full path list from the file.
- Fixed **`saved_job_id` / `savedJobId`**: Zod preprocess maps OpenAPI wire names to internal camelCase; `savedJobId` is part of the oneOf-style refine; `InputNormalizerService` preserves saved-job-only scans for fingerprinting via a stable `saved-job:…` surrogate on `canonicalEmployerCandidate`.
- Fixed **snake_case vs camelCase** consciously: **request** accepts wire aliases via `mapJobRadarScanRequestWireToDtoShape` + `z.preprocess`; **tRPC responses** for `jobRadar.startScan` and `jobRadar.rescanReport` use **`JobRadarHttpMapper.toScanAcceptedResponse`**, which emits **OpenAPI `ScanAcceptedResponse`** property names (`scan_id`, `report_id`, `quota_remaining`, `idempotency_reused`, etc.). Frontend navigation/types were updated to consume those keys.
- Added **`job-radar.http.mapper.spec.ts`** for mapper + preprocess + normalizer regression coverage.

## Scope of Changes (Areas Touched)

- Backend: Job Radar DTO, HTTP mapper, input normalizer, tRPC `jobRadar` router, contract + mapper tests.
- Frontend: Job Radar types and three components that read `startScan` / `rescanReport` mutation results.

## Files Changed (Primary)

| Path | Role |
|------|------|
| `docs/job-radar/job-radar-openapi-v1.1.yaml` | Contract source of truth (unchanged by this task; tests assert against it) |
| `backend/src/modules/job-radar/api/job-radar.dto.ts` | Wire→DTO preprocess, `savedJobId`, refine, `jobPostId` min length when set |
| `backend/src/modules/job-radar/api/job-radar.http.mapper.ts` | `toScanAcceptedResponse` (OpenAPI wire shape) |
| `backend/src/modules/job-radar/infrastructure/services/input-normalizer.service.ts` | `savedJobId` → fingerprint input |
| `backend/src/trpc/routers/jobRadar.router.ts` | Returns `toScanAcceptedResponse` |
| `backend/src/modules/job-radar/__tests__/job-radar-openapi-v1.1.contract.spec.ts` | Contract + explicit `OPENAPI_V1_1_GAPS_VS_REPO` |
| `backend/src/modules/job-radar/__tests__/job-radar.http.mapper.spec.ts` | Mapper / preprocess / normalizer tests |
| `frontend/src/features/job-radar/api/job-radar.types.ts` | `StartScanResponse` + `StartScanPayload` |
| `frontend/src/features/job-radar/components/start-scan-form.tsx` | `scan_id` / `report_id` |
| `frontend/src/features/job-radar/components/start-scan-cta-card.tsx` | same |
| `frontend/src/features/job-radar/components/rescan-report-button.tsx` | same |

## How to Verify (Folder-Aware)

Contract test only:

```bash
cd /Users/nikodem/job-app-restore/proj/backend && npm test -- --run src/modules/job-radar/__tests__/job-radar-openapi-v1.1.contract.spec.ts
```

All Job Radar tests under the module:

```bash
cd /Users/nikodem/job-app-restore/proj/backend && npx vitest run src/modules/job-radar/__tests__/
```

Full backend test suite:

```bash
cd /Users/nikodem/job-app-restore/proj/backend && npm test
```

Frontend build (types + bundle):

```bash
cd /Users/nikodem/job-app-restore/proj/frontend && npm run build
```

## Known Limitations / Explicit Gaps vs OpenAPI (Not Bypassed)

Listed in code as **`OPENAPI_V1_1_GAPS_VS_REPO`** inside `job-radar-openapi-v1.1.contract.spec.ts` (count and strings are asserted so the list cannot silently rot). At handoff time they document:

- Job Radar is exposed via **tRPC**, not as literal Express routes matching every `/job-radar/*` path in the YAML.
- **POST `/job-radar/scan/from-saved-job`** and **GET `/job-radar/employers/{employer_id}/history`** are not implemented as dedicated procedures/routes matching those operations.

**Update (Agent B follow-up):** `jobRadar.getScanStatus` now returns **`ScanProgressResponse` wire** via `JobRadarHttpMapper.toScanProgressResponseWire` (snake_case, `partial_report_id`, OpenAPI `ScanProgress` keys). Frontend normalizes wire + legacy camelCase. Contract test asserts GET `/job-radar/scan/{scan_id}` response codes and required `ScanProgressResponse` keys on mapper output.

QC should confirm remaining gaps stay **honest** and that **start scan** + **scan status** payloads match the YAML sections referenced in tests.

## Final Result

- Contract test exists, parses repo YAML only, covers the agreed minimum scope including response codes and models.
- DTO/schema/preprocessor align **`saved_job_id`** branch with implementation.
- Mapper emits OpenAPI response names; frontend updated accordingly.
- Backend and frontend verification commands above pass when run in this workspace.

## QC Intake Checklist (Executor → QC)

- [x] Technical completion report in repository (this file).
- [x] Explicit **READY FOR QC** status (see top).
- [x] Verifiable commands with absolute `cd … &&` pattern per repo policy.

## Executor follow-up (Agent B — backend)

- `JobRadarHttpMapper.toScanProgressResponseWire` + router `getScanStatus`; contract + integration tests extended; `OPENAPI_V1_1_GAPS_VS_REPO` shortened to 3 items.
- `frontend` `normalizeJobRadarScan` accepts OpenAPI wire progress and legacy camelCase.
- Assistant: Vitest guard `AssistantResponseMeta` assignability on `buildAssistantResponseMeta` output.

## QC Verdict

_(Jedyna oficjalna rejestracja wyniku review dla wątku Job Radar OpenAPI v1.1 w tym pliku.)_

### Previous reports checked (same / overlapping scope)

| Ścieżka | Status |
|---------|--------|
| [`qc-job-radar-openapi-contract-dev-handoff-2026-04-16.md`](./qc-job-radar-openapi-contract-dev-handoff-2026-04-16.md) (ten plik — sekcje dev) | Intake **READY FOR QC**; brak wcześniejszego werdyktu QC w repo dla tego wątku |
| [`qc-decision-practice-modules-settings-community-2026-04-18.md`](./qc-decision-practice-modules-settings-community-2026-04-18.md) | **Not Approved** całego slice’u; Job Radar wymieniony tylko jako część szerszego tematu — **nie** zastępuje osobnej oceny kontraktu OpenAPI |
| [`agent-b-report.md`](./agent-b-report.md) | Raport wykonawcy; zgodny z opisem testów i `OPENAPI_V1_1_GAPS_VS_REPO` |
| [`qc-developer-to-qc-sync-2026-04-17.md`](./qc-developer-to-qc-sync-2026-04-17.md) | Pytania poboczne; werdykt Job Radar **tylko** tutaj |

### Data

2026-04-19

### Uruchomione weryfikacje (komendy)

```bash
cd /Users/nikodem/job-app-restore/proj/backend && npm test -- --run src/modules/job-radar/__tests__/job-radar-openapi-v1.1.contract.spec.ts
```

```bash
cd /Users/nikodem/job-app-restore/proj/backend && npx vitest run src/modules/job-radar/__tests__/
```

```bash
cd /Users/nikodem/job-app-restore/proj/frontend && npm run build
```

**Wynik:** wszystkie powyższe zakończone kodem wyjścia **0** (kontrakt: 11 testów; cały katalog `__tests__` modułu Job Radar: 46 testów w 17 plikach).

### Wynik

**Approved for integration** → w słowniku integracji repo: **Approved For Integration** dla **zakresu wątku OpenAPI v1.1** opisanego w tym handoffu (testy czytają wyłącznie `docs/job-radar/job-radar-openapi-v1.1.yaml`, mapper / DTO / `getScanStatus` wire, frontend na kluczach snake_case zgodnie z raportem wykonawcy), **przy jawnych lukach** poniżej.

### Uzasadnienie

- Kontrakt w kodzie: `OPENAPI_V1_1_GAPS_VS_REPO` w `job-radar-openapi-v1.1.contract.spec.ts` ma **dokładnie 3** wpisy (asercja liczby w teście — lista nie może cicho zgnić); opisują one uczciwie: ekspozycja **tRPC** zamiast literalnych ścieżek REST z YAML, brak **POST `/job-radar/scan/from-saved-job`**, brak **GET `/job-radar/employers/{employer_id}/history`**.
- Testy kontraktu nie wymyślają ścieżek ani schemów spoza pliku YAML (ścieżki i kody odpowiedzi sprawdzane względem dokumentu).
- Zatwierdzenie dotyczy **zgodności kontraktu / wire shape / testów** w zakresie zgłoszonym do QC — **nie** znaczy „pełna zgodność REST z każdą operacją OpenAPI”, dopóki te trzy luki są zamierzone lub zaakceptowane przez PO jako dług produktowy.

### Integracja — co dalej (technicznie)

- Merge / deploy: dozwolony dla plików w zakresie handoffu **przy świadomości** trzech luk; zamknięcie luk REST / procedur wymaga **osobnej** dostawy + opcjonalnie nowego `READY FOR QC`.
- **PO follow-up (opcjonalnie):** czy priorytetem jest implementacja `from-saved-job` i employer **history** pod OpenAPI, czy utrzymanie modelu tRPC + dokumentowany dług wystarczy na dany etap.

### Required Next Action

- `Owning agent: required work is executed in the repository, not in chat instead of implementation — see docs/squad/IMPLEMENTATION_EXECUTION_RULES.md §5a and Hard Rule 8.`
- **Wykonawca:** zamknięcie luk z `OPENAPI_V1_1_GAPS_VS_REPO` albo jawna decyzja PO o długu — przez zmiany w repo + raport **§6** / `READY FOR QC`, nie przez wątek zamiast diffu.
- **QC:** przy kolejnej dostawie dotykającej kontraktu — poprzedni werdykt + delta (reguły w [`../squad/IMPLEMENTATION_EXECUTION_RULES.md`](../squad/IMPLEMENTATION_EXECUTION_RULES.md)).

---

## PO follow-up

_(Opcjonalnie — krótka decyzja „co dalej” po werdykcie QC, w tym samym kanale.)_

---

*Submitted for QC review per `docs/policies/execution-reporting-standard.md`.*
