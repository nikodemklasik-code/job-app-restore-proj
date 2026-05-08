# 📝 Jak zastąpić cały workflow na GitHub

## 🎯 Instrukcja krok po kroku:

### 1. Otwórz plik workflow na GitHub
Kliknij: https://github.com/nikodemklasik-code/job-app-restore-proj/blob/main/.github/workflows/deploy.yml

### 2. Kliknij Edit (ołówek)
W prawym górnym rogu kliknij ikonkę ołówka

### 3. Zaznacz CAŁĄ zawartość
- Windows/Linux: `Ctrl + A`
- Mac: `Cmd + A`

### 4. Usuń całą zawartość
Naciśnij `Delete` lub `Backspace`

### 5. Otwórz plik z nową zawartością
Otwórz plik: `COMPLETE_WORKFLOW_READY_TO_PASTE.yml` (w tym samym folderze co ten plik)

### 6. Skopiuj CAŁĄ zawartość
- Zaznacz wszystko w pliku `COMPLETE_WORKFLOW_READY_TO_PASTE.yml`
- Windows/Linux: `Ctrl + A`, potem `Ctrl + C`
- Mac: `Cmd + A`, potem `Cmd + C`

### 7. Wklej do edytora GitHub
- Kliknij w puste pole edytora na GitHub
- Windows/Linux: `Ctrl + V`
- Mac: `Cmd + V`

### 8. Sprawdź czy wklejone poprawnie
Przewiń w dół i sprawdź czy widzisz te linie (około linii 217-227):

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

### 9. Commit changes
1. Przewiń na sam dół strony
2. W polu "Commit message" wpisz:
   ```
   feat: Add automatic database migrations to deployment workflow
   ```
3. Wybierz **"Commit directly to the main branch"**
4. Kliknij **"Commit changes"**

---

## ✅ Weryfikacja:

Po commit sprawdź:
1. GitHub Actions: https://github.com/nikodemklasik-code/job-app-restore-proj/actions
2. Znajdź najnowszy workflow "Deploy — multivohub-jobapp"
3. Sprawdź czy kroki "Sync SQL migrations" i "Run database migrations" się pojawiły

---

## 🎯 Co zostanie dodane:

Nowy workflow zawiera **2 dodatkowe kroki**:

1. **Sync SQL migrations** - Kopiuje pliki SQL na VPS
2. **Run database migrations** - Uruchamia migracje automatycznie

Te kroki będą działać przy każdym deploy na main! 🚀

---

## 📁 Pliki:

- `COMPLETE_WORKFLOW_READY_TO_PASTE.yml` - Kompletny workflow do skopiowania
- `HOW_TO_REPLACE_WORKFLOW.md` - Ta instrukcja

---

**Gotowe! Po wykonaniu tych kroków migracje będą działać automatycznie.** ✅
