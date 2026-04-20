Completed Work

- **Job Radar / OpenAPI v1.1:** Utrzymanie zgodności kontraktu z `docs/job-radar/job-radar-openapi-v1.1.yaml` — DTO (`job-radar.dto.ts`), mapper (`JobRadarHttpMapper.toScanAcceptedResponse`, `toScanProgressResponseWire` dla `ScanProgressResponse` wire: snake_case, `partial_report_id`, klucze `progress` jak w YAML), router tRPC `jobRadar` (`getScanStatus` zwraca wire). Testy: `job-radar-openapi-v1.1.contract.spec.ts` (ścieżki, kody odpowiedzi GET scan, wymagane pola + zgodność kluczy progress), `job-radar.http.mapper.spec.ts`, integracja `integration/scan-progress-openapi.integration.spec.ts`. Lista jawnych luk `OPENAPI_V1_1_GAPS_VS_REPO` — **3** pozycje (tRPC vs REST, brak `from-saved-job`, brak employer history).
- **Assistant / shared:** `shared/assistant.ts` jest **kanonicznym** źródłem typów i tablic const używanych przez frontend i specyfikację. `shared/assistant.js` pozostaje **tylko** dlatego, że backend (Node ESM) importuje `…/shared/assistant.js` bez transpilacji całego `shared/` — plik `.js` musi powielać **wyłącznie te same wartości** co tablice w `.ts`; w obu plikach są nagłówki „nie dublować ręcznie w rozjechaniu”. Brak drugiej logiki biznesowej w `.js`.
- **Env / OpenAI (smoke QC):** Ścieżki bez klucza zwracają czytelne błędy: `getOpenAIClient()` — komunikat z kontekstem (env / `.env` / secrets). `server.ts`: przed SSE — **503** JSON z `error: OPENAI_NOT_CONFIGURED` i `message` dla `/api/interview/stream`, `/api/negotiation/stream`, `/api/negotiation/simulate`; TTS i Whisper STT — ten sam wzorzec zamiast ogólnego „not configured”. `interviewConversation` / `negotiationConversation` — spójny throw przy pustym braku klucza.
- **Assistant meta:** `buildAssistantResponseMeta` + test zgodności kształtu z typem `AssistantResponseMeta` (`assistant-meta.spec.ts`).

Changed Files / Modules

- `backend/src/modules/job-radar/api/job-radar.http.mapper.ts`
- `backend/src/trpc/routers/jobRadar.router.ts`
- `backend/src/modules/job-radar/__tests__/job-radar-openapi-v1.1.contract.spec.ts`
- `backend/src/modules/job-radar/__tests__/job-radar.http.mapper.spec.ts`
- `backend/src/modules/job-radar/__tests__/integration/scan-progress-openapi.integration.spec.ts`
- `frontend/src/features/job-radar/lib/job-radar-scan.mapper.ts`
- `backend/src/services/openai.ts`
- `backend/src/server.ts`
- `backend/src/services/interviewConversation.ts`
- `backend/src/services/negotiationConversation.ts`
- `shared/assistant.ts`, `shared/assistant.js`
- `backend/src/services/__tests__/assistant-meta.spec.ts`
- `docs/qc-reports/qc-job-radar-openapi-contract-dev-handoff-2026-04-16.md` (uzupełnienie Known limitations + Executor follow-up)

Result

- `jobRadar.getScanStatus` zwraca payload zgodny z **OpenAPI `ScanProgressResponse`** (wire); start scan nadal **ScanAcceptedResponse** wire.
- Frontend normalizuje odpowiedź scanu (wire + legacy camelCase w `progress`).
- Brak `OPENAI_API_KEY` nie kończy się „cichym” streamem na wybranych endpointach — **503** z jednoznacznym `message` albo throw z opisem przed wywołaniem OpenAI w kodzie współdzielonym.
- Kontrakt assistant w runtime backendu nadal spięty z `shared/assistant` (`.ts` + `.js` wartości zsynchronizowane).

How To Verify

```bash
cd /Users/nikodem/job-app-restore/proj/backend && npm run build && npm test -- --run src/modules/job-radar/__tests__ src/services/__tests__/assistant-meta.spec.ts
```

Pełna paczka testów backendu (opcjonalnie):

```bash
cd /Users/nikodem/job-app-restore/proj/backend && npm run build && npm test -- --run
```

Smoke ręczny (bez klucza): `POST /api/interview/stream` z poprawnym body → **503** + JSON `OPENAI_NOT_CONFIGURED`; `POST /api/interview/tts` / `transcribe` — ten sam wzorzec.

Known Limitations / Follow-Up

- **Job Radar:** Nadal obowiązują 3 jawne luki w `OPENAPI_V1_1_GAPS_VS_REPO` (tRPC vs pełny REST OpenAPI, brak dedykowanego `from-saved-job`, brak employer history). QC: `docs/qc-reports/qc-job-radar-openapi-contract-dev-handoff-2026-04-16.md` — sekcja **QC Verdict** do uzupełnienia.
- **`shared/assistant.js`:** Dopóki importy backendu wskazują na `.js`, wymagana jest **ręczna zsynchronizowana kopia** tablic z `.ts` po każdej zmianie wartości — rozważyć w CI skrypt `diff` / codegen (poza zakresem tego raportu).
- **Persystencja `mode` na wiadomościach użytkownika** (historia vs jawny tryb UI) — otwarte w szkicu Case Practice w `shared/assistant.ts`.

### Decyzja FU-2 (PO follow-up)

- Ścieżka **A:** szkic kontraktu Case Practice w `shared/assistant.ts` (`// draft`). Kanoniczny builder meta w backendzie realizuje trasy i safety zgodnie z task card.

### Sygnał Product Owner (nieoficjalny kanał → zapis w repo)

- 2026-04-16: zielone światło na kontynuację — `docs/qc-reports/qc-live-status.md`. Łańcuch Agent → QC → PO bez zmian dla merge.

### Checkpoint 2h (2026-04-16)

- Zrobione: Job Radar wire `getScanStatus`, testy modułu + assistant-meta, komunikaty OpenAI env, raport Agent B.
- Następny krok: werdykt QC na handoff Job Radar; ewentualnie CI sync `assistant.js`.

Status

- READY FOR QC
