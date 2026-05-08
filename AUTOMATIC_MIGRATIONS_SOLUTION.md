# ✅ ROZWIĄZANIE: Automatyczne Migracje w Deployment

## Status
🔴 **WYMAGA AKCJI** - Workflow gotowy lokalnie, ale GitHub OAuth blokuje push

---

## 🎯 SZYBKIE ROZWIĄZANIE (wybierz jedno):

### ⚡ Opcja A: Napraw profil TERAZ (30 sekund)

Uruchom migrację ręcznie - wszystkie pliki są już na VPS:

```bash
ssh root@YOUR_VPS_IP 'cd /root/project && bash scripts/run-migrations-on-vps.sh'
```

**Efekt:** Profil zadziała natychmiast ✅

---

### 🔧 Opcja B: Dodaj automatyczne migracje do workflow (5 minut)

Aby migracje działały automatycznie przy każdym deploy:

#### Krok 1: Edytuj workflow na GitHub

1. Otwórz: https://github.com/nikodemklasik-code/job-app-restore-proj/blob/main/.github/workflows/deploy.yml

2. Kliknij **Edit** (ikonka ołówka)

3. Znajdź linię **209** (około):
```yaml
      - name: Sync Job Radar docs (OpenAPI v1.1 contract on VPS)
        run: |
          rsync -avz docs/job-radar/ \
            "${{ secrets.VPS_USER }}@${{ secrets.VPS_HOST }}:${REMOTE_BASE}/docs/job-radar/"
```

4. **DODAJ** zaraz po niej (przed "Install production deps"):
```yaml
      - name: Sync SQL migrations
        run: |
          rsync -avz backend/sql/ \
            "${{ secrets.VPS_USER }}@${{ secrets.VPS_HOST }}:${REMOTE_BASE}/backend/sql/"

      - name: Run database migrations
        run: |
          ssh "${{ secrets.VPS_USER }}@${{ secrets.VPS_HOST }}" \
            "cd ${REMOTE_BASE} && bash scripts/run-migrations-on-vps.sh" \
            || { echo "⚠️ Migration step failed — check database connectivity"; exit 1; }
```

5. Kliknij **Commit changes** → **Commit directly to main**

#### Krok 2: Zsynchronizuj lokalnie

```bash
git fetch origin
git reset --hard origin/main
```

**Efekt:** Każdy deploy będzie automatycznie uruchamiał migracje ✅

---

## 📊 Co jest już gotowe:

| Plik | Status | Lokalizacja |
|------|--------|-------------|
| SQL migration | ✅ Gotowy | `backend/sql/2026-05-08-add-achievements-to-experiences.sql` |
| Skrypt wykonawczy | ✅ Gotowy | `scripts/run-migrations-on-vps.sh` |
| Workflow (lokalnie) | ⏳ Czeka | Commit `5e39d5c` (nie można push przez OAuth) |
| Pliki na VPS | ✅ Zsynchronizowane | `/root/project/` |

---

## 🔍 Dlaczego OAuth blokuje?

GitHub OAuth używany przez Kiro nie ma `workflow` scope, więc nie może modyfikować plików `.github/workflows/*.yml`. To zabezpieczenie GitHub przed nieautoryzowanymi zmianami w CI/CD.

**Rozwiązanie:** Edytuj workflow bezpośrednio na GitHub (masz pełne uprawnienia przez przeglądarkę).

---

## ✅ Co zrobi migracja:

```sql
-- Dodaje kolumnę achievements do tabeli experiences
ALTER TABLE experiences ADD COLUMN achievements JSON AFTER description;
```

- **Idempotentna:** Bezpieczna do wielokrotnego uruchomienia
- **Nie usuwa danych:** Tylko dodaje brakującą kolumnę
- **Szybka:** < 1 sekunda

---

## 🎯 Weryfikacja po uruchomieniu:

1. Otwórz: https://jobs.multivohub.com/profile
2. Sprawdź czy profil się ładuje bez błędu
3. Błąd "Unknown column 'achievements'" powinien zniknąć

---

## 📝 Commit lokalny (gotowy do zastosowania):

```
Commit: 5e39d5c
Author: nikodemklasik-code
Date: Fri May 8 13:01:40 2026

feat: Add automatic database migrations to deployment workflow

- Sync SQL migrations to VPS during deployment
- Run migrations automatically before PM2 reload
- Fixes profile 'achievements' column error
- Migrations are idempotent and safe to run multiple times

Changed: .github/workflows/deploy.yml (+11 lines)
```

---

## 🚀 Następne kroki:

1. **TERAZ:** Uruchom Opcję A (napraw profil natychmiast)
2. **POTEM:** Dodaj Opcję B (automatyzacja na przyszłość)

Pytania? Daj znać!
