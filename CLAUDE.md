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

## Deploy — automatyczny (domyślny)
- Workflow: `.github/workflows/deploy.yml` — trigger: **push** na `claude/improvements` lub ręcznie **Run workflow**.
- W logu sukcesu jest **`github.ref_name`**, żeby od razu było widać, z której gałęzi poszedł deploy.
- **Ten sam produkcyjny VPS** co wcześniej z `main`: `/var/www/multivohub/`, `/root/project/backend/dist/`, `pm2 restart jobapp-server`. Osobny staging = inne ścieżki albo osobny workflow.
- W GitHubie muszą być **te same secrets** co przy starym deployu z `main`; runner self-hosted musi mieć label **`production`** (jak w `runs-on` w jobie deploy).

## Deploy — ręcznie (gdy Actions nie działają)

### Frontend (statyczne pliki)
```bash
cd frontend && npm run build
rsync -az --delete dist/ root@147.93.86.209:/var/www/multivohub/
```
- Nginx serwuje z `/var/www/multivohub/` — **bez restartu**
- ⚠️ NIE deployuj do `/root/project/frontend/dist/` — tam Nginx nie zagląda
- Zmiana widoczna od razu po rsync

### Backend (Node.js / tRPC / Express)
```bash
cd backend && npm run build
rsync -az dist/ root@147.93.86.209:/root/project/backend/dist/
ssh root@147.93.86.209 "pm2 restart jobapp-server"
```
- PM2 proces: **`jobapp-server`**
- Skrypt: `/root/project/backend/dist/backend/src/server.js`
- Working dir: `/root/project`

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
