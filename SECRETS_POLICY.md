# SECRETS POLICY - MULTIVOHUB / JOBS

## Cel
Ten plik opisuje, jak przechowujemy sekrety na serwerze i czego nie robimy.

## Zasada główna
Sekretów nie trzymamy w:
- repo Git
- commitach
- `.env.example`
- wiadomościach Slack / mailach / notatkach
- przypadkowych plikach w katalogach projektu
- kodzie źródłowym

Sekrety trzymamy w:
- Vault pod `secret/`
- lokalnym runtime `.env` tylko jeśli naprawdę trzeba do uruchomienia
- plikach kluczy SSH tylko w odpowiednich ścieżkach systemowych

## Podział przechowywania

### 1. Vault
Główne miejsce na sekrety aplikacyjne.

Używane ścieżki:
- `secret/apps/shared`
- `secret/apps/project`
- `secret/apps/apartment`
- `secret/apps/finance`

Do Vault trafiają:
- hasła do bazy
- API keys
- tokeny
- sekrety auth
- sekrety mailowe
- webhook secrets
- klucze aplikacyjne
- dane integracji zewnętrznych

### 2. Runtime `.env`
Na serwerze może istnieć lokalny `.env`, ale:
- tylko dla uruchomienia aplikacji
- tylko poza repo lub pod ścisłą kontrolą
- nigdy nie commitujemy go do Git

Jeśli używamy `/root/project/.env`, to:
- plik ma być produkcyjny
- nie może zawierać starych śmieci
- obecny wpis `APP_NAME=apartment` jest błędny i ma zostać zastąpiony

### 3. SSH
Klucze SSH nie trafiają do repo ani do zwykłych env.

Na Macu używane ścieżki:
- GitHub:
  - `/Users/nikodem/.ssh/id_ed25519_github`
  - `/Users/nikodem/.ssh/id_ed25519_github.pub`
- Hostinger:
  - `/Users/nikodem/.ssh/id_ed25519_hostinger`
  - `/Users/nikodem/.ssh/id_ed25519_hostinger.pub`

Fingerprinty:
- GitHub: `SHA256:+PrE0Vymi3qmcoNKUCrspcbrT2F/wi+pAduNEb/Hyzk`
- Hostinger: `SHA256:bMVbk41Igti5JfK6wXsIDaUp8Awwu+frnWHycc5m/kM`

Prywatnych kluczy nie wklejamy do:
- repo
- `.env`
- dokumentacji publicznej
- ticketów
- czatów

## Minimalny podział sekretów

### `secret/apps/shared`
Trzymamy tu:
- `APP_ENV`
- `NODE_ENV`
- `APP_URL`
- `PUBLIC_APP_URL`
- `PUBLIC_API_URL`
- `PUBLIC_JOBS_URL`
- `JWT_SECRET`
- `SESSION_SECRET`
- `APP_SECRET`
- `ENCRYPTION_KEY`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM_EMAIL`
- `SMTP_FROM_NAME`
- `RESEND_API_KEY`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GROQ_API_KEY`
- `SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`

### `secret/apps/project`
Trzymamy tu:
- `DATABASE_URL`
- `DIRECT_URL`
- `REDIS_URL`
- `CLERK_SECRET_KEY`
- `CLERK_PUBLISHABLE_KEY`
- `VITE_CLERK_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_MODE`
- `TELEGRAM_BOT_TOKEN`
- `REED_API_KEY`
- `ADZUNA_APP_ID`
- `ADZUNA_APP_KEY`
- `JOOBLE_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `UPLOADS_S3_BUCKET`
- `UPLOADS_S3_REGION`
- `UPLOADS_S3_ACCESS_KEY_ID`
- `UPLOADS_S3_SECRET_ACCESS_KEY`
- `UPLOADS_S3_ENDPOINT`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `VAULT_ROLE_ID`
- `VAULT_SECRET_ID`

## Uprawnienia
- Każda aplikacja ma czytać tylko swoje sekrety
- Do odczytu używamy AppRole
- Nie mieszamy sekretów projektów między sobą
- Nie dajemy pełnego dostępu bez powodu

## Nazewnictwo
Nazwy sekretów zapisujemy wielkimi literami, dokładnie jak w env, np.:
- `DATABASE_URL`
- `OPENAI_API_KEY`
- `CLERK_SECRET_KEY`
- `RESEND_API_KEY`

## Czego nie robić
- nie trzymać sekretów w `README`
- nie trzymać sekretów w `.env.example`
- nie commitować `.env`
- nie kopiować prywatnych kluczy SSH do projektu
- nie używać jednego sekretu do wielu różnych celów
- nie zostawiać starych wartości typu `apartment` w projekcie `multivohub`

## Obecny stan wymagający poprawy
- `/root/project/.env` jest błędny
- trzeba przygotować poprawny produkcyjny zestaw env dla `multivohub-jobapp`
- docelowo aplikacja ma iść sensownie w Dockerze
- sekrety mają być źródłowo w Vault, nie w repo

## Zasada operacyjna
1. Sekret tworzymy lub aktualizujemy w Vault
2. Aplikacja dostaje tylko to, czego potrzebuje
3. Runtime `.env` traktujemy jako warstwę techniczną, nie źródło prawdy
4. Źródłem prawdy dla sekretów jest Vault


## Prywatna dokumentacja sekretów i dostępów

Szczegółowa dokumentacja sekretów, kluczy, recovery steps i danych wrażliwych nie jest przechowywana w repozytorium. Publiczne repo zawiera tylko politykę przechowywania sekretów, nazwy używanych zmiennych, ścieżki logiczne oraz zasady operacyjne.

Pełna dokumentacja operacyjna może istnieć wyłącznie w formie prywatnego, zaszyfrowanego dokumentu poza repozytorium. Taki dokument nie może zawierać danych dostępnych publicznie i nie może być dystrybuowany bez kontroli dostępu.

Developer uzyskuje dostęp do środowiska wyłącznie przez autoryzowany kanał. Dostęp administracyjny do serwera odbywa się przez SSH z przypisanym kluczem. Dostęp do sekretów aplikacyjnych odbywa się przez Vault albo inny autoryzowany interfejs API. Sekrety nie są odczytywane z repo, z plików przykładowych ani z dokumentacji publicznej.

Jeżeli prywatny dokument istnieje, powinien zawierać wyłącznie informacje operacyjne potrzebne do utrzymania systemu, takie jak nazwy kluczy, mapowanie sekretów, procedura rotacji, procedura odzyskiwania i przypisanie odpowiedzialności. Nie powinien być traktowany jako główne źródło prawdy dla sekretów. Źródłem prawdy pozostaje system zarządzania sekretami.

Kodowanie, kompresja i szyfrowanie dokumentów PDF to osobne warstwy. Kodowanie i filtry służą zapisowi danych w formacie PDF, natomiast szyfrowanie służy ochronie treści. Jeżeli prywatna dokumentacja jest przechowywana jako PDF, dokument musi być zabezpieczony szyfrowaniem i przechowywany poza repozytorium. Sam format PDF nie jest zabezpieczeniem, jeśli plik nie został poprawnie zaszyfrowany i kontrolowany dostępem.

Zasada operacyjna jest prosta. Repo zawiera tylko informacje jawne i techniczne minimum. Serwer dostępny jest przez SSH. Sekrety aplikacyjne pobierane są przez Vault lub autoryzowane API. Dane wrażliwe nie są przechowywane w kodzie, w .env.example, w README ani w dokumentacji publicznej.
