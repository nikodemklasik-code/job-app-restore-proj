# Jobs Search Fix Report

**Data:** 2026-05-01  
**Branch:** Kiro  
**Status:** ✅ Gotowe do testowania

## Problemy zidentyfikowane

1. ❌ **Brak zapisu preferencji wyszukiwania** - Jobs nie zapamiętywał ostatniego query i lokalizacji
2. ❌ **Brak persystencji między sesjami** - Po odświeżeniu strony użytkownik musiał wpisywać wszystko od nowa
3. ✅ **targetJobTitle w profilu działa** - Backend i frontend już mają pełną obsługę

## Rozwiązanie

### 1. Nowa tabela bazy danych

**Plik:** `backend/sql/2026-05-01-user-job-preferences.sql`

```sql
CREATE TABLE IF NOT EXISTS user_job_preferences (
  user_id VARCHAR(36) PRIMARY KEY,
  last_query VARCHAR(255) DEFAULT '',
  last_location VARCHAR(255) DEFAULT 'United Kingdom',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 2. Schema update

**Plik:** `backend/src/db/schema.ts`

Dodano:
```typescript
export const userJobPreferences = mysqlTable('user_job_preferences', {
  userId: varchar('user_id', { length: 36 }).primaryKey(),
  lastQuery: varchar('last_query', { length: 255 }).default('').notNull(),
  lastLocation: varchar('last_location', { length: 255 }).default('United Kingdom').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});
```

### 3. Backend API endpoints

**Plik:** `backend/src/trpc/routers/jobs.router.ts`

Dodano 2 nowe endpointy:

#### `getJobPreferences`
- Zwraca ostatnie zapisane query i location
- Domyślnie: `{ lastQuery: '', lastLocation: 'United Kingdom' }`

#### `saveJobPreferences`
- Zapisuje query i location po każdym wyszukiwaniu
- Upsert - tworzy lub aktualizuje rekord

### 4. Frontend integration

**Plik:** `frontend/src/app/jobs/JobsDiscovery.tsx`

Zmiany:
1. Dodano query `jobPreferencesQuery` do wczytania preferencji
2. Dodano mutation `saveJobPreferencesMutation` do zapisu
3. Dodano `useEffect` który wczytuje preferencje przy montowaniu komponentu
4. Zaktualizowano `handleSearch` aby zapisywał preferencje przy każdym wyszukiwaniu

## Jak to działa

### Przepływ danych

1. **Przy pierwszym wejściu na /jobs:**
   - Frontend wywołuje `getJobPreferences`
   - Jeśli użytkownik ma zapisane preferencje → wczytuje je do pól query i location
   - Jeśli nie → używa domyślnych wartości

2. **Przy kliknięciu "Search":**
   - Frontend wywołuje `saveJobPreferences` z aktualnymi wartościami
   - Backend zapisuje do `user_job_preferences`
   - Wykonuje wyszukiwanie

3. **Przy kolejnym wejściu:**
   - Użytkownik widzi swoje ostatnie wyszukiwanie
   - Może od razu kliknąć "Search" lub zmienić parametry

## Instrukcje wdrożenia

### 1. Uruchom migrację SQL

**Na lokalnej bazie:**
```bash
cd /Users/nikodem/MultivoHub\ 26042026/job-app-restore-proj
mysql -u root -p multivohub < backend/sql/2026-05-01-user-job-preferences.sql
```

**Na produkcji (przez SSH):**
```bash
ssh root@your-vps
cd /root/project
mysql -u root -p multivohub < backend/sql/2026-05-01-user-job-preferences.sql
```

### 2. Zbuduj i wdróż

```bash
# Backend
cd backend
npm run build

# Frontend  
cd ../frontend
npm run build

# Deploy (jeśli używasz skryptu)
cd ..
bash scripts/deploy.sh
```

### 3. Restart serwera

```bash
# Lokalnie
cd backend
npm run dev

# Produkcja (PM2)
pm2 restart backend
```

## Testowanie

### Test 1: Zapis preferencji
1. Wejdź na `/jobs`
2. Wpisz query: "Software Engineer"
3. Wpisz location: "London"
4. Kliknij "Search"
5. Odśwież stronę (F5)
6. ✅ Pola powinny zawierać "Software Engineer" i "London"

### Test 2: Zmiana preferencji
1. Zmień query na "Product Manager"
2. Zmień location na "Manchester"
3. Kliknij "Search"
4. Odśwież stronę
5. ✅ Pola powinny zawierać nowe wartości

### Test 3: Różni użytkownicy
1. Zaloguj się jako User A
2. Wyszukaj "Designer" w "Birmingham"
3. Wyloguj się
4. Zaloguj jako User B
5. Wejdź na `/jobs`
6. ✅ Pola powinny być puste lub zawierać domyślne wartości (nie preferencje User A)

### Test 4: targetJobTitle w profilu
1. Wejdź na `/profile`
2. Otwórz sekcję "Career Goals"
3. Wpisz "Dream Role": "Senior Developer"
4. Kliknij "Save"
5. Odśwież stronę
6. ✅ "Dream Role" powinno zawierać "Senior Developer"
7. Wejdź na `/jobs`
8. ✅ Jeśli query jest puste, powinno automatycznie wyszukać oferty dla "Senior Developer"

## Weryfikacja w bazie danych

```sql
-- Sprawdź czy tabela została utworzona
SHOW TABLES LIKE 'user_job_preferences';

-- Sprawdź strukturę
DESCRIBE user_job_preferences;

-- Sprawdź zapisane preferencje
SELECT u.email, ujp.last_query, ujp.last_location, ujp.updated_at
FROM user_job_preferences ujp
JOIN users u ON u.id = ujp.user_id
ORDER BY ujp.updated_at DESC
LIMIT 10;

-- Sprawdź career goals
SELECT u.email, cg.target_job_title, cg.target_salary_min, cg.target_salary_max
FROM career_goals cg
JOIN users u ON u.id = cg.user_id
WHERE cg.target_job_title IS NOT NULL
LIMIT 10;
```

## Potencjalne problemy

### Problem: Migracja nie działa
**Rozwiązanie:** Sprawdź czy tabela już istnieje:
```sql
DROP TABLE IF EXISTS user_job_preferences;
```
Następnie uruchom migrację ponownie.

### Problem: Frontend nie zapisuje preferencji
**Rozwiązanie:** 
1. Sprawdź console w przeglądarce (F12)
2. Sprawdź czy endpoint jest wywoływany
3. Sprawdź czy użytkownik jest zalogowany (`userId` musi być ustawione)

### Problem: Preferencje nie są wczytywane
**Rozwiązanie:**
1. Sprawdź czy `jobPreferencesQuery.data` zawiera dane
2. Sprawdź czy `preferencesLoaded` jest ustawione na `true`
3. Sprawdź czy `useEffect` jest wywoływany

## Następne kroki (opcjonalne)

1. **Dodać więcej preferencji:**
   - Zapamiętywanie wybranych sources (reed, adzuna, etc.)
   - Zapamiętywanie minJobFitPercent

2. **Historia wyszukiwań:**
   - Zamiast jednego rekordu, przechowywać ostatnie 10 wyszukiwań
   - Dropdown z sugestiami poprzednich wyszukiwań

3. **Integracja z profilem:**
   - Jeśli użytkownik ma `targetJobTitle` w profilu, ale puste preferencje
   - Automatycznie użyj `targetJobTitle` jako domyślnego query

## Podsumowanie

✅ **Zaimplementowano:**
- Tabelę `user_job_preferences`
- Endpointy `getJobPreferences` i `saveJobPreferences`
- Automatyczne wczytywanie i zapisywanie preferencji w Jobs
- Pełna integracja z istniejącym kodem

✅ **Działa:**
- Zapis targetJobTitle w profilu (już było)
- Automatyczne wyszukiwanie na podstawie profilu (już było)
- Nowe: Zapamiętywanie ostatniego wyszukiwania

🎯 **Rezultat:**
Użytkownik nie musi już wpisywać query i lokalizacji za każdym razem. System zapamiętuje ostatnie wyszukiwanie i automatycznie je wczytuje.
