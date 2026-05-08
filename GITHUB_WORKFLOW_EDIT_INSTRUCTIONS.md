# 📝 Instrukcja: Dodaj automatyczne migracje do GitHub Workflow

## 🎯 Cel:
Dodać automatyczne uruchamianie migracji SQL przy każdym deploy na VPS.

---

## 📍 Krok 1: Otwórz plik workflow

Kliknij tutaj: https://github.com/nikodemklasik-code/job-app-restore-proj/blob/main/.github/workflows/deploy.yml

---

## ✏️ Krok 2: Edytuj plik

1. Kliknij ikonkę **ołówka** (Edit this file) w prawym górnym rogu
2. Znajdź **linię 209-211** (około):

```yaml
      - name: Sync Job Radar docs (OpenAPI v1.1 contract on VPS)
        run: |
          rsync -avz docs/job-radar/ \
            "${{ secrets.VPS_USER }}@${{ secrets.VPS_HOST }}:${REMOTE_BASE}/docs/job-radar/"

      - name: Install production deps on VPS and reload PM2
```

---

## ➕ Krok 3: Dodaj te linie MIĘDZY nimi

**SKOPIUJ I WKLEJ** dokładnie te linie **ZARAZ PO** "Sync Job Radar docs" (przed "Install production deps"):

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

---

## 📋 Krok 4: Sprawdź wcięcia

**WAŻNE:** Upewnij się, że wcięcia są identyczne jak w innych krokach:
- `- name:` zaczyna się na tej samej kolumnie co inne kroki
- `run: |` jest wcięte 2 spacje
- Komendy wewnątrz `run:` są wcięte 4 spacje więcej

---

## 💾 Krok 5: Commit

1. Przewiń na dół strony
2. W polu "Commit message" wpisz:
   ```
   feat: Add automatic database migrations to deployment workflow
   ```
3. W polu "Extended description" (opcjonalnie):
   ```
   - Sync SQL migrations to VPS during deployment
   - Run migrations automatically before PM2 reload
   - Ensures database schema is always up to date
   ```
4. Wybierz **"Commit directly to the main branch"**
5. Kliknij **"Commit changes"**

---

## ✅ Krok 6: Weryfikacja

Po commit GitHub Actions automatycznie uruchomi deploy. Sprawdź:

1. Przejdź do: https://github.com/nikodemklasik-code/job-app-restore-proj/actions
2. Znajdź najnowszy workflow "Deploy — multivohub-jobapp"
3. Sprawdź czy kroki "Sync SQL migrations" i "Run database migrations" się pojawiły
4. Sprawdź czy przeszły pomyślnie (zielony checkmark ✅)

---

## 🎯 Efekt końcowy:

Po tej zmianie, przy każdym push na `main`:
1. ✅ Zbuduje się frontend i backend
2. ✅ Zsynchronizuje pliki na VPS
3. ✅ **Uruchomi migracje SQL automatycznie** ← NOWE!
4. ✅ Zrestartuje PM2
5. ✅ Smoke test

---

## 📸 Wizualizacja (jak powinno wyglądać):

```yaml
      - name: Sync Job Radar docs (OpenAPI v1.1 contract on VPS)
        run: |
          rsync -avz docs/job-radar/ \
            "${{ secrets.VPS_USER }}@${{ secrets.VPS_HOST }}:${REMOTE_BASE}/docs/job-radar/"

      - name: Sync SQL migrations                    ← NOWE
        run: |                                        ← NOWE
          rsync -avz backend/sql/ \                   ← NOWE
            "${{ secrets.VPS_USER }}@${{ secrets.VPS_HOST }}:${REMOTE_BASE}/backend/sql/"  ← NOWE
                                                      ← NOWE
      - name: Run database migrations                ← NOWE
        run: |                                        ← NOWE
          ssh "${{ secrets.VPS_USER }}@${{ secrets.VPS_HOST }}" \  ← NOWE
            "cd ${REMOTE_BASE} && bash scripts/run-migrations-on-vps.sh" \  ← NOWE
            || { echo "⚠️ Migration step failed — check database connectivity"; exit 1; }  ← NOWE

      - name: Install production deps on VPS and reload PM2
        run: |
          ssh "${{ secrets.VPS_USER }}@${{ secrets.VPS_HOST }}" "bash -lc 'set -e; cd \"${REMOTE_BASE}\"; npm install --omit=dev --prefix backend; pm2 reload infra/ecosystem.config.cjs --update-env || pm2 start infra/ecosystem.config.cjs; pm2 save'"
```

---

## ❓ Pytania?

Jeśli coś nie działa, sprawdź:
- Czy wcięcia są poprawne (YAML jest wrażliwy na wcięcia)
- Czy nie ma literówek w nazwach zmiennych
- Czy GitHub Actions pokazuje błędy w logach

---

**Gotowe! Po wykonaniu tych kroków migracje będą działać automatycznie.** 🚀
