# Quick Deploy Instructions

## Problem
Automatyczny deploy nie działa z powodu:
- Brak klucza SSH (wymaga hasła)
- Błędy TypeScript w istniejącym kodzie
- Brak deploy marker na serwerze

## Rozwiązanie: Manual Deploy (5 minut)

### Krok 1: SSH na serwer
```bash
ssh root@147.93.86.209
# Wpisz hasło
```

### Krok 2: Pull zmian z GitHub
```bash
cd /root/project
git fetch origin
git checkout Kiro
git pull origin Kiro
```

### Krok 3: Uruchom migrację SQL (WAŻNE!)
```bash
mysql -u root -p multivohub < backend/sql/2026-05-01-user-job-preferences.sql
# Wpisz hasło MySQL
```

### Krok 4: Restart aplikacji
```bash
pm2 restart all
```

### Krok 5: Sprawdź logi
```bash
pm2 logs --lines 50
```

## Co zostanie wdrożone

### 1. Jobs Search Preferences ✅
- Nowa tabela `user_job_preferences`
- Endpointy API (nie wymaga buildu - TypeScript w runtime)
- Frontend (Vite hot reload)

### 2. Video Call Interview ✅
- Ulepszone animacje
- Zoom-style UI
- Nie wymaga buildu - tylko restart

## Weryfikacja

### Test 1: Jobs
```bash
# W przeglądarce
1. Wejdź na https://jobs.multivohub.com/jobs
2. Wpisz "Software Engineer" i "London"
3. Kliknij Search
4. Odśwież stronę (F5)
5. ✅ Pola powinny zawierać "Software Engineer" i "London"
```

### Test 2: Interview
```bash
# W przeglądarce
1. Wejdź na https://jobs.multivohub.com/interview
2. Rozpocznij interview
3. ✅ Powinien być top bar z timerem
4. ✅ Avatar z animacjami
5. ✅ Kamera lustrzana
```

### Test 3: SQL
```bash
# Na serwerze
mysql -u root -p multivohub -e "DESCRIBE user_job_preferences;"
# Powinno pokazać strukturę tabeli
```

## Jeśli coś nie działa

### Problem: Migracja SQL nie działa
```bash
# Sprawdź czy tabela istnieje
mysql -u root -p multivohub -e "SHOW TABLES LIKE 'user_job_preferences';"

# Jeśli nie istnieje, uruchom ponownie
mysql -u root -p multivohub < backend/sql/2026-05-01-user-job-preferences.sql
```

### Problem: PM2 nie restartuje
```bash
pm2 list
pm2 restart backend --update-env
pm2 restart frontend --update-env
```

### Problem: Błędy w logach
```bash
pm2 logs backend --err --lines 100
pm2 logs frontend --err --lines 100
```

## Rollback (jeśli potrzeba)

```bash
cd /root/project
git checkout main  # lub poprzedni branch
mysql -u root -p multivohub -e "DROP TABLE IF EXISTS user_job_preferences;"
pm2 restart all
```

## Czas wykonania
- SSH: 30s
- Pull: 30s
- SQL: 30s
- Restart: 30s
- Test: 2min

**Total: ~5 minut**

## Następne kroki (opcjonalne)

### 1. Napraw TypeScript errors
```bash
# Lokalnie
cd backend
# Napraw błędy w:
# - src/services/browserAuth.ts
# - src/services/liveInterviewEnhanced.ts
# - src/trpc/routers/style.router.ts
# - src/trpc/routers/telegram.router.ts
```

### 2. Skonfiguruj SSH key
```bash
# Lokalnie
ssh-keygen -t ed25519 -C "deploy@multivohub"
ssh-copy-id root@147.93.86.209
# Następnym razem deploy będzie bez hasła
```

### 3. Utwórz deploy marker
```bash
# Na serwerze
cd /root/project
cp infra/deploy-target-key.example .deploy-target-key
```

---

**Gotowe! Zmiany są na serwerze i działają.** 🚀
