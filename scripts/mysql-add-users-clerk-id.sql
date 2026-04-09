-- Ręczna naprawa, gdy nie możesz uruchomić drizzle-kit push.
-- Baza: ta sama co w DATABASE_URL (u Ciebie bywa apartment_finance).
--
-- KROK 1 — dodaj kolumnę (jeśli już jest, MySQL zwróci błąd — wtedy pomiń):
--   mysql -u USER -p YOUR_DB < scripts/mysql-add-users-clerk-id.sql
--
ALTER TABLE users ADD COLUMN clerk_id VARCHAR(255) NULL;

-- Unikalny indeks: wiele wierszy z NULL jest dozwolone w MySQL (do czasu backfillu).
CREATE UNIQUE INDEX users_clerk_id_unique ON users (clerk_id);

-- KROK 2 — zaloguj się w aplikacji (AppShell wywoła ensureFromClerk): powstanie wiersz z clerk_id.
-- Jeśli masz STARE wiersze w users bez Clerk: usuń je albo uzupełnij clerk_id ręcznie.

-- KROK 3 — gdy KAŻDY wiersz ma clerk_id:
-- ALTER TABLE users MODIFY clerk_id VARCHAR(255) NOT NULL;
