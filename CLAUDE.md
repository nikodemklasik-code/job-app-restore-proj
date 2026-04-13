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
rsync -az --delete dist/ root@147.93.86.209:/root/project/frontend/dist/
```
- Nginx serwuje `frontend/dist/` bezpośrednio — **bez restartu**
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
- **Claude** → gałąź `claude/improvements`
- **GitHub Copilot / inny agent** → gałąź `copilot/*` lub `neurodiversity`
- Właściciel projektu merguje PRy do `main`
- Przed nową sesją: `git pull origin main` (lub merge `main` do swojej gałęzi)

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
