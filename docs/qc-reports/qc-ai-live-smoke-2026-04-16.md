# QC AI Live Smoke Report (2026-04-16)

## Definitions (do not conflate)

1. **`OPENAI_API_KEY`** — Real OpenAI credential; **only** for live AI smoke / real API calls; stays in **environment**; **never** commit to git.
2. **Internal canonical repo / deploy marker** — **Not** a secret. Non-sensitive string(s) or paths used to verify correct **local folder**, **remote deploy path**, **host**, or pipeline target. Must not hold passwords, API keys, or SSH secrets.
3. **Job Radar REST contract** — Source of truth: [`docs/job-radar/job-radar-openapi-v1.1.yaml`](../job-radar/job-radar-openapi-v1.1.yaml). An OpenAI **uploaded file** copy may exist with `file_id` **`file-PRcqRdUMTqfnaP8LKsh99k`** (Files API handle for that YAML); that id is **not** `OPENAI_API_KEY` and is **not** a deploy secret.

Canonical prose for all three: [`docs/job-radar/CONTRACT-KEYS-AND-SECRETS.md`](../job-radar/CONTRACT-KEYS-AND-SECRETS.md).

## Goal

Verify whether runtime AI generation path is operational (real model call path, not only deterministic metadata tests).

## Executed Checks

- Env probe:
  - `cd /Users/nikodem/job-app-restore/proj && node -e "import dotenv from 'dotenv'; dotenv.config(); console.log(process.env.OPENAI_API_KEY ? 'OPENAI_KEY_PRESENT' : 'OPENAI_KEY_MISSING');"`
  - Result: `OPENAI_KEY_MISSING`
- Direct runtime probe (`generateCareerResponse`):
  - `cd /Users/nikodem/job-app-restore/proj/backend && npx tsx -e "import { generateCareerResponse } from './src/services/openai.ts'; (async () => { try { await generateCareerResponse({ mode:'general', sourceType:'manual_user_input', messages:[{role:'user', content:'Help me improve my CV'}] }); console.log('AI_CALL_OK'); } catch (e) { console.log('AI_CALL_FAIL:', e instanceof Error ? e.message : String(e)); } })();"`
  - Result: `AI_CALL_FAIL: Missing OPENAI_API_KEY`

## QC Verdict (Session 1 — skrót)

Środowisko bez klucza — brak live proof. **Status normatywny** (wyłącznie `Approved For Integration` / `Not Approved` wg spec QC): patrz **Session 2** poniżej — dla bramki live smoke obowiązuje **`Not Approved`** do czasu spełnienia reguły odblokowania (`OPENAI_KEY_PRESENT` + sukces wywołania modelu).

What is verified already (non-live):

- Deterministic metadata + safety contract tests pass in backend unit tests.
- Backend/frontend builds pass.

What is not verified yet (live):

- Real OpenAI response path in `assistant.sendMessage` with model output.
- End-to-end runtime behavior with actual key/network.

## Unblock Steps

1. Provide `OPENAI_API_KEY` in runtime env (`.env` loaded by backend).
2. Re-run the two commands from **Executed Checks**.
3. If key is present, run quick app-level smoke:
   - `cd /Users/nikodem/job-app-restore/proj/backend && npm run dev`
   - Execute authenticated `assistant.sendMessage` with prompts:
     - `help me improve my cv`
     - `I may need ACAS before an employment tribunal for discrimination`
     - `there is violence at work and I feel unsafe right now`
   - Confirm response + `meta.safetyNotes` / `meta.complianceFlags` and UI rendering in `/assistant`.

---

## Session 2 — QC tie-in (2026-04-16, późniejszy przebieg)

**Reguła odblokowania (normatywna):** werdykt **Approved For Integration** dla **tego** dokumentu smoke (ścieżka live) wolno wystawić **tylko** wtedy, gdy w sekcji **Executed Checks** poniżej wynik probe to `OPENAI_KEY_PRESENT` **oraz** próba wywołania modelu kończy się sukcesem (`AI_CALL_OK` lub równoważny zapis z aplikacji). Przy braku klucza końcowy status smoke = **Not Approved** (patrz blok normatywny).

### Executed Checks (Session 2)

- Env probe (root `.env` przez `dotenv`):
  - `cd /Users/nikodem/job-app-restore/proj && node -e "import('dotenv').then(d=>{d.default.config(); console.log(process.env.OPENAI_API_KEY?'OPENAI_KEY_PRESENT':'OPENAI_KEY_MISSING');})"`
  - Result: `OPENAI_KEY_MISSING`

### QC Verdict — Live AI smoke gate (tylko dozwolone statusy)

Brak `OPENAI_API_KEY` w środowisku smoke — **nie** spełnia warunku odblokowania zapisanej powyżej.

```md
Rejected

Problem:
Live AI smoke cannot complete: OpenAI API key is not present in the smoke environment.

Why This Fails Quality Control:
The required runtime proof of model invocation is missing; non-live unit tests alone do not satisfy this smoke gate.

Affected Area:
Backend `OPENAI_API_KEY` loading for `generateCareerResponse` / `assistant.sendMessage` live path.

Required Fix:
Set `OPENAI_API_KEY` in the environment used for smoke (e.g. project root `.env`), re-run Session 2 **Executed Checks** until `OPENAI_KEY_PRESENT` and successful model call; then QC may append a new session with `Approved` / `Approved For Integration` per `quality-control-developer-role-spec.md`.

Status:
Not Approved
```

## Required Next Action

- `Owning agent: required work is executed in the repository, not in chat instead of implementation — see docs/squad/IMPLEMENTATION_EXECUTION_RULES.md §5a and Hard Rule 8.`

1. Ustawić `OPENAI_API_KEY` w środowisku smoke, powtórzyć **Session 2 — Executed Checks** aż do `OPENAI_KEY_PRESENT` i udanego wywołania modelu (reguła odblokowania w tym pliku).  
2. Po spełnieniu warunku — QC może dopisać nową sesję z wynikiem **Approved For Integration** dla tej bramki smoke, zgodnie z [`quality-control-developer-role-spec.md`](../policies/quality-control-developer-role-spec.md).  
3. Do czasu spełnienia pkt 1 — status smoke pozostaje **Not Approved**; prace produktowe w innych modułach **nie** zastępują dowodu live w tym dokumencie.
