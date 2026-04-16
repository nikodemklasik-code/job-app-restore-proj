# Job Radar OpenAPI v1.1 Contract — Developer Handoff for QC (2026-04-16)

## Jedyny kanał komunikacji (wątek Job Radar OpenAPI contract)

**Ustalenie:** dla tego zadania cała oficjalna wymiana (developer → QC → product owner / Ciebie → ewentualny powrót do dev) odbywa się **wyłącznie w tym pliku w repozytorium**, nie w równoległych „nieoficjalnych” wątkach bez śladu w repo.

| Element | Zasada |
|--------|--------|
| **Ścieżka kanoniczna** | `docs/qc-reports/qc-job-radar-openapi-contract-dev-handoff-2026-04-16.md` (w klonie: pełna ścieżka od rootu monorepo) |
| **Developer** | Aktualizuje sekcje techniczne powyżej; przy zmianie statusu intake edytuje **Status** i ewentualnie **What Exactly Was Done** / **Known Limitations**. |
| **QC** | Dopisuje na końcu pliku sekcję **QC Verdict** (data, wynik: Approved for integration / Not approved, uzasadnienie, komendy które uruchomił). Nie zastępuje bez uzgodnienia faktów dev — tylko werdykt i uwagi. |
| **Ty (PO / właściciel)** | Decyzje priorytetu i „co dalej” po QC — jako commit w tym samym pliku (np. krótka sekcja **PO follow-up**) albo osobny commit z linkiem do tego pliku; unikaj równoległego „źródła prawdy” poza repo. |

Inne kanały (czat, e-mail) mogą służyć tylko do **wysłania linku do tego pliku** lub pilnego pinga, nie do przenoszenia treści werdyktu bez zapisu tutaj.

---

## Status

**READY FOR QC**

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
- **`jobRadar.getScanStatus`** response shape still differs from OpenAPI **`ScanProgressResponse`** (camelCase + `reportId` vs spec snake_case + `partial_report_id`, etc.) — separate follow-up if full wire parity is required.

QC should confirm these gaps remain **honest** (not hidden by loosened contract assertions) and that DTO/mapper/router/FE alignment for **start scan accepted response** matches the **ScanAcceptedResponse** section of the YAML.

## Final Result

- Contract test exists, parses repo YAML only, covers the agreed minimum scope including response codes and models.
- DTO/schema/preprocessor align **`saved_job_id`** branch with implementation.
- Mapper emits OpenAPI response names; frontend updated accordingly.
- Backend and frontend verification commands above pass when run in this workspace.

## QC Intake Checklist (Executor → QC)

- [x] Technical completion report in repository (this file).
- [x] Explicit **READY FOR QC** status (see top).
- [x] Verifiable commands with absolute `cd … &&` pattern per repo policy.

## QC Verdict

_(QC uzupełnia po przeglądzie — jedyna oficjalna rejestracja wyniku review dla tego wątku.)_

- Data:
- Uruchomione weryfikacje (komendy):
- Wynik: **Approved for integration** / **Not approved**
- Uzasadnienie:

---

## PO follow-up

_(Opcjonalnie — krótka decyzja „co dalej” po werdykcie QC, w tym samym kanale.)_

---

*Submitted for QC review per `docs/policies/execution-reporting-standard.md`.*
