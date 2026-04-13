# CLAUDE.md — Notatki robocze projektu MultivoHub

## Gałąź Claude'a
- Claude zawsze pracuje na gałęzi **`claude/improvements`**
- Nie commituj bezpośrednio do `main` ani do gałęzi Copilota (`neurodiversity`, `copilot/*`)
- Po skończonej pracy: `git push origin claude/improvements` i otwórz PR do `main`

## Struktura projektu
```
/root/project/              ← katalog na VPS
  backend/dist/             ← skompilowany backend (tRPC + Express)
  frontend/dist/            ← statyczne pliki frontendu (Vite build)

/Users/nikodem/projects/project/   ← lokalne repo deweloperskie
  backend/
  frontend/
```

## Deploy — jak to działa (manualny)

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

## Workflow z wieloma agentami

### Zasady (potwierdzone przez oba agenty)
| Agent | Gałąź | PR | Merge |
|---|---|---|---|
| **Claude** | `claude/improvements` (lub `claude/<temat>`) | otwiera PR | właściciel |
| **GitHub Copilot** | `copilot/<temat>` | otwiera PR | właściciel |
| **main** | zawsze stabilny | — | tylko właściciel |

### Reguły dla Claude'a
- Na początku każdej sesji: `git fetch origin && git merge origin/main` (sync z mainem)
- Nigdy nie commituj do `main` ani do gałęzi `copilot/*`
- Jeden PR = jeden temat (nie mieszaj niezwiązanych zmian)
- Konflikty rozwiązuje właściciel podczas merge PR

### Kiedy mogą być konflikty
Tylko podczas merge PR — kontrolowany proces po stronie właściciela.
Ryzyko: Claude i Copilot edytują ten sam plik w tym samym czasie → właściciel rozwiązuje przy merge.

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

## TODO / otwarte zadania
- [ ] Automatyczny CI/CD (GitHub Actions → build → deploy na VPS)
- [ ] Avatar w rozmowie kwalifikacyjnej — dopracowanie
- [ ] Merge `claude/improvements` → `main` po review
