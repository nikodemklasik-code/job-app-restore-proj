# CLAUDE.md — Notatki robocze projektu MultivoHub

## Gałąź Claude'a
- Claude zawsze pracuje na gałęzi **`claude/improvements`**
- Nie commituj bezpośrednio do `main` ani do gałęzi Copilota (`neurodiversity`, `copilot/*`)
- **Deploy na VPS:** push na `claude/improvements` → GitHub Actions (build) + self-hosted runner (rsync + PM2). Merge do `main` tylko gdy chcesz zsynchronizować stabilną bazę — nie jest potrzebny przy każdej iteracji na produkcję.
- Po skończonej pracy: `git push origin claude/improvements`; PR do `main` wg potrzeby review, nie jako warunek deployu.

## Struktura projektu
```
/root/project/              ← katalog na VPS
  backend/dist/             ← skompilowany backend (tRPC + Express)
  frontend/dist/            ← statyczne pliki frontendu (Vite build)

/Users/nikodem/projects/project/   ← lokalne repo deweloperskie
  backend/
  frontend/
```

## Deploy — canonical lock (nie sekret)
- **Marker integralności (commitowany):** `.canonical-repo-key` — dozwolona ścieżka lokalnego repo, `REMOTE_BASE` na VPS, domena, IP, gałąź deployu. Nie zawiera haseł ani API keys.
- **Polityka:** `docs/policies/canonical-repo-deploy-lock-policy-v1.0.md`
- **Na VPS jednorazowo:** skopiować `infra/deploy-target-key.example` → `${CANONICAL_REMOTE_BASE}/.deploy-target-key` (zgodnie z przykładem w pliku).
- **Szybki test (QC / dev):** `cd /Users/nikodem/job-app-restore/proj && bash scripts/verify-canonical-repo.sh`
- **Ręczny deploy (pełny łańcuch):** `bash scripts/deploy-safe.sh [token]` — ack → backup na VPS → `deploy.sh`; brudne drzewo git blokuje (chyba że `DEPLOY_ALLOW_DIRTY=1`). Sam **`bash scripts/deploy.sh`** — te same guardy (DNS, SSH, `.deploy-target-key`); kopia w `Downloads/KOPIA/...` nie przejdzie ścieżki lokalnej (chyba że `DEPLOY_SKIP_LOCAL_REPO_PATH=1` w `.env.local`).

## Deploy — automatyczny (domyślny)
- Workflow: `.github/workflows/deploy.yml` — trigger: **push** na `claude/improvements` lub ręcznie **Run workflow**.
- W logu sukcesu jest **`github.ref_name`**, żeby od razu było widać, z której gałęzi poszedł deploy.
- **Produkcyjny VPS:** aplikacja (PM2, `npm ci`, artefakty buildu) w **`/root/project`** — zgodnie z `.canonical-repo-key` i `infra/ecosystem.config.cjs`. Osobny staging = inna ścieżka w pliku kanonicznym albo osobny workflow.
- W GitHubie muszą być **te same secrets** co przy starym deployu z `main`; runner self-hosted musi mieć label **`production`** (jak w `runs-on` w jobie deploy).

## Deploy — ręcznie (gdy Actions nie działają)

### Frontend (statyczne pliki)
```bash
cd /Users/nikodem/job-app-restore/proj/frontend && npm run build
rsync -az --delete dist/ root@147.93.86.209:/root/project/frontend/dist/
```
- Nginx (konfig w repo: `infra/nginx/multivohub-jobapp.conf`) serwuje SPA z **`/root/project/frontend/dist`** — po rsync zwykle **bez restartu** nginx (`nginx -t && systemctl reload nginx` tylko gdy zmieniasz sam config).

### Backend (Node.js / tRPC / Express)
```bash
cd /Users/nikodem/job-app-restore/proj/backend && npm run build
rsync -az dist/ root@147.93.86.209:/root/project/dist/backend/
ssh root@147.93.86.209 "cd /root/project && npm ci --omit=dev --prefix backend && pm2 reload infra/ecosystem.config.cjs --update-env || pm2 start infra/ecosystem.config.cjs"
```
- PM2: **`infra/ecosystem.config.cjs`** (procesy `jobapp-server`, worker, webhook) — **`cwd`: `/root/project`**
- Skrypt serwera: `dist/backend/src/server.js` względem `cwd`

### Serwer VPS
- IP: `147.93.86.209`
- User: `root`
- Web server: Nginx (config: `infra/nginx/multivohub-jobapp.conf`)

## Agenci i gałęzie
| Agent | Gałąź robocza | PR / merge do `main` |
|---|---|---|
| **Claude** | `claude/improvements` lub `claude/<temat>` | tylko właściciel (PR); konflikty przy merge PR rozwiązuje właściciel |
| **Copilot** | `copilot/*` | tylko właściciel (PR) |

### Reguły dla Claude'a
- Na początku sesji: **`git fetch origin`**. Gdy `main` ma nowe commity — zsynchronizuj się przez **`git rebase origin/main`** na swojej gałęzi; unikaj **`git merge origin/main`**, żeby nie mnożyć merge commitów.
- Nigdy nie commituj do `main` ani do `copilot/*`.
- Jeden PR = jeden temat.
- Współdzielona gałąź **`claude/improvements`**: po rebase historia się zmienia — przed `git push` uzgodnij z innymi; użyj **`git push --force-with-lease`**, żeby nie nadpisać cudzych commitów. Przy pracy samodzielnej rebase + push zwykle daje najczystszą linię historii.

## Kluczowe endpointy backendu
- `/api/interview/transcribe` — Whisper STT (FormData: `audio` blob)
- `/api/interview/tts` — TTS (JSON: `{ text }` → audio blob)
- `/api/interview/stream` — streaming rozmowy kwalifikacyjnej (SSE)
- `/trpc/*` — wszystkie procedury tRPC

## Baza danych
- MySQL na VPS
- ORM: Drizzle
- Tabele profilu: `profiles`, `experiences`, `educations`, `skills`
- Kolumny `experiences`: `id`, `profileId`, `employerName`, `jobTitle`, `startDate`, `endDate`, `description`
- Kolumny `educations`: `id`, `profileId`, `schoolName`, `degree`, `fieldOfStudy`, `startDate`, `endDate`

## Zmienne środowiskowe (backend)
- `OPENAI_API_KEY` — GPT-4o-mini + Whisper
- `OPENAI_MODEL` — domyślnie `gpt-4o-mini`
- `DATABASE_URL` — MySQL connection string
- `RESEND_API_KEY` — wysyłka emaili

## Tematy (6 motywów)
Zdefiniowane w `frontend/src/index.css` i `frontend/src/stores/themeStore.ts`:
- `light` — jasny (domyślny)
- `dark` — granatowy navy
- `visually-impaired` — wysoki kontrast (żółty/czarny)
- `overstimulated` — spokojny kamień
- `noir` — czarno-biały filmowy
- `elegant` — kremowo-złoty

## Plan wykonawczy (rollout)
- **Kanoniczny plan kolejności, MVP, DoD, ryzyka:** [`docs/executive-plan/final-rollout-execution-plan-v1.0.md`](docs/executive-plan/final-rollout-execution-plan-v1.0.md)
- **Profile growth direction (Growth Plan + Roadmap):** [`docs/features/profile-growth-and-roadmap-spec-v1.0.md`](docs/features/profile-growth-and-roadmap-spec-v1.0.md)

## Podział prac (squad — obowiązujący)
- **Tablica faz, Agent 1 / 2 / 3, QC, PO:** [`docs/squad/README.md`](docs/squad/README.md) · workboard [`docs/squad/Squad_Workboard.md`](docs/squad/Squad_Workboard.md)
- Starsze pliki `*-three-developer-split*.md` w `docs/features/` = szczegóły modułowe; **kolejność globalna** z workboardu squadu.

## Quality Control Developer (bramka jakości)
- Obowiązuje rola finalnego recenzenta techniczno-produktowego przed integracją.
- Żaden task nie ma statusu "done" bez jawnej decyzji: **Approved For Integration** albo **Not Approved**.
- Pełna specyfikacja roli, checklista i formaty decyzji: [`docs/policies/quality-control-developer-role-spec.md`](docs/policies/quality-control-developer-role-spec.md)
- Obowiązkowy standard meldowania wykonania i wejścia do QC: [`docs/policies/execution-reporting-standard.md`](docs/policies/execution-reporting-standard.md)
- **Spójny layout + motyw + lewa nawigacja (norma FE):** [`docs/policies/unified-app-layout-and-theme-standard-v1.0.md`](docs/policies/unified-app-layout-and-theme-standard-v1.0.md)
- Łańcuch komunikacji Agent -> QC -> Product Owner -> Agent jest obowiązkowy i opisany w politykach repo.
- QC musi egzekwować folder-aware commands (komendy build/deploy/setup/recovery zawsze z pełnym folderem).
- QC porównuje równolegle dostarczone implementacje (A/B) i decyduje: użyj A, użyj B, połącz A+B, albo odrzuć obie.
- Podział pracy między agentów (A/B/QC): [`docs/policies/agent-work-split.md`](docs/policies/agent-work-split.md)

## TODO / otwarte zadania
- [x] CI/CD: push na `claude/improvements` → GitHub Actions (build) + self-hosted runner → deploy na VPS
- [ ] Avatar w rozmowie kwalifikacyjnej — dopracowanie
- [ ] Merge `claude/improvements` → `main` — rzadki, świadomy krok wyrównania stabilnej bazy (opcjonalny względem deployu; nie jest warunkiem każdego wdrożenia)
