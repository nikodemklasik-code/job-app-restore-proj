# AI end-to-end verification

This document describes how AI flows connect from the browser to OpenAI (or related APIs), what to configure, and how to verify each path manually. It is an **operational checklist**, not automated CI.

## Prerequisites (all paths)

| Requirement | Why |
|-------------|-----|
| `OPENAI_API_KEY` on the **backend** | Required for OpenAI chat, streaming, Whisper, and most parsers. |
| `OPENAI_MODEL` (optional) | Defaults vary by route (`gpt-4o-mini` vs `gpt-4o` for career assistant in code — confirm in `backend/src/services/openai.ts` and routers). |
| Backend running with tRPC + Express | tRPC at `/trpc/*`; some interview features at `/api/interview/*`. |
| Frontend `VITE_API_URL` | Must point at the same backend origin (e.g. `http://localhost:3001` or production API). Empty string = same origin only works if the SPA is served from the API host. |
| **Clerk** sign-in | `assistant.sendMessage` and other `protectedProcedure` routes need a valid session; tRPC client sends `Authorization: Bearer` from `frontend/src/lib/api.ts`. |
| MySQL + user row | Assistant persists messages on internal `userId` resolved from Clerk; DB must accept inserts. |

If any of the above is missing, symptoms are: empty errors, 401 on tRPC, “OpenAI not configured”, or generic fallback text in Style Studio.

---

## Path 1 — Career Assistant (primary tRPC + OpenAI)

**Flow:** Browser → `trpcClient.assistant.sendMessage` → `assistant.router.ts` → `generateCareerResponse` (`openai.ts`) → OpenAI `chat.completions` → reply saved → UI shows assistant message.

**Code:** `frontend/src/stores/careerAssistantStore.ts` (mutate), `backend/src/trpc/routers/assistant.router.ts`, `backend/src/services/openai.ts`.

**Manual check:**

1. Sign in, open **AI Assistant**.
2. Send a short message (e.g. “Summarise a 3-bullet CV outline for a junior developer”).
3. Expect a non-empty assistant reply within a few seconds.

**Failure signals:** TRPCError in network tab; logged “Missing OPENAI_API_KEY”; immediate generic string from `generateCareerResponse` when message list is empty.

**Notes:** Plan tier selects how much universal behavior text is injected (`getUserPlan` + `planToPromptBehaviorTier`); model for this path is set in `openai.ts` (currently `gpt-4o` for completions).

---

## Path 2 — Style Studio (tRPC `style.*`)

**Flow:** Browser → `api.style.analyzeDocument` / `rewriteSection` / `suggestCoursesForSkill` / `generateFromJob` → `style.router.ts` → OpenAI when key present; otherwise heuristics or empty-handling.

**Code:** `frontend/src/app/style/StyleStudio.tsx`, `backend/src/trpc/routers/style.router.ts`.

**Manual check:**

1. Open **Style Studio**, upload or paste text, run **analyse** (or equivalent).
2. With `OPENAI_API_KEY` set, expect JSON-shaped analysis or rewritten text.
3. Without key, UI should still respond with fallback copy (no crash).

---

## Path 3 — Interview practice (HTTP + SSE, not tRPC)

**Flow:** Browser → `fetch(VITE_API_URL + '/api/interview/stream', …)` (SSE) for conversation; optional `transcribe` (Whisper) and `tts` for voice.

**Code:** `frontend/src/app/interview/InterviewPractice.tsx`, `backend` routes mounted in `server.ts` (and related interview services).

**Manual check:**

1. Open **Interview**, start a session, send text; observe streamed tokens or full reply.
2. Optional: test microphone path if Whisper is enabled.

**Failure signals:** CORS or wrong `VITE_API_URL`; 500 if `OPENAI_API_KEY` missing on paths that require it.

---

## Path 4 — Negotiation coach

**Flow:** Similar pattern to interview — uses `API_BASE` + `/api/interview/transcribe` for voice in places; strategy/simulator may use OpenAI in `negotiationConversation.ts`.

**Code:** `frontend/src/app/negotiation/NegotiationCoach.tsx`, `backend/src/services/negotiationConversation.ts`.

---

## Path 5 — CV parsing

**Flow:** Upload PDF → CV router / parser → OpenAI extraction when configured.

**Code:** `backend/src/services/cvParser.ts`, profile CV flows on frontend.

**Manual check:** Upload a small PDF on **Profile** or **Document Lab** (per product flow); confirm structured fields or stored text appears.

---

## Path 6 — Job Radar, Coach tRPC, server routes

- **Job Radar:** `radar.router.ts` uses OpenAI when key is set (e.g. scoring copy).
- **Coach:** `coach.router.ts` — completions with `OPENAI_MODEL`.
- **Express routes:** `server.ts` may expose additional OpenAI streaming helpers; `interview-report`, `interview-summary`, `coach-analysis` routes use env model strings — verify env matches deployed capability.

---

## End-to-end definition (product)

For release sign-off, treat **E2E AI** as:

1. **Authenticated user** on a build pointing at a backend with a valid `OPENAI_API_KEY`.
2. At least **Path 1 (Assistant)** and **one document or interview path** succeeding without 5xx.
3. **No silent fallback** where the UI claims “AI generated” but shows only static mock text (Style Studio should label fallbacks clearly).

---

## Suggested future automation

- Playwright: Clerk test user → Assistant send → assert assistant bubble non-empty.
- Contract test: mock OpenAI and assert tRPC returns structured errors when key absent.

There is no substitute for a **manual smoke** on staging with production-like env before merging to `main`.
