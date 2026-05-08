# 🎯 PROSTY PRZEWODNIK - Edycja Workflow

## Problem z Twoją edycją:
Widzę że próbowałeś dodać, ale **brakuje wcięć i nowych linii** w YAML. YAML wymaga dokładnych wcięć!

---

## ✅ POPRAWNA METODA:

### Krok 1: Otwórz workflow
https://github.com/nikodemklasik-code/job-app-restore-proj/blob/main/.github/workflows/deploy.yml

### Krok 2: Kliknij Edit (ołówek)

### Krok 3: Znajdź te linie (około 209-211):
```yaml
      - name: Sync Job Radar docs (OpenAPI v1.1 contract on VPS)
        run: |
          rsync -avz docs/job-radar/ \
            "${{ secrets.VPS_USER }}@${{ secrets.VPS_HOST }}:${REMOTE_BASE}/docs/job-radar/"

      - name: Install production deps on VPS and reload PM2
```

### Krok 4: USUŃ linię "Install production deps" i WKLEJ TO:
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

      - name: Install production deps on VPS and reload PM2
```

**UWAGA:** 
- Każda linia z `- name:` zaczyna się od **6 spacji**
- Każda linia z `run:` ma **8 spacji**
- Komendy wewnątrz mają **10 spacji**
- Między krokami jest **pusta linia**

### Krok 5: Commit
Message: `feat: Add automatic database migrations to deployment workflow`

---

## 📋 ALTERNATYWA - Skopiuj cały fragment:

Jeśli powyższe jest trudne, możesz skopiować **cały fragment** od "Sync Job Radar" do "Smoke test":

```yaml
      - name: Sync Job Radar docs (OpenAPI v1.1 contract on VPS)
        run: |
          rsync -avz docs/job-radar/ \
            "${{ secrets.VPS_USER }}@${{ secrets.VPS_HOST }}:${REMOTE_BASE}/docs/job-radar/"

      - name: Sync SQL migrations
        run: |
          rsync -avz backend/sql/ \
            "${{ secrets.VPS_USER }}@${{ secrets.VPS_HOST }}:${REMOTE_BASE}/backend/sql/"

      - name: Run database migrations
        run: |
          ssh "${{ secrets.VPS_USER }}@${{ secrets.VPS_HOST }}" \
            "cd ${REMOTE_BASE} && bash scripts/run-migrations-on-vps.sh" \
            || { echo "⚠️ Migration step failed — check database connectivity"; exit 1; }

      - name: Install production deps on VPS and reload PM2
        run: |
          ssh "${{ secrets.VPS_USER }}@${{ secrets.VPS_HOST }}" "bash -lc 'set -e; cd \"${REMOTE_BASE}\"; npm install --omit=dev --prefix backend; pm2 reload infra/ecosystem.config.cjs --update-env || pm2 start infra/ecosystem.config.cjs; pm2 save'"

      - name: Smoke test (on VPS)
        run: |
          ssh "${{ secrets.VPS_USER }}@${{ secrets.VPS_HOST }}" \
            "bash ${REMOTE_BASE}/scripts/smoke-test.sh"
```

I **ZASTĄP** stary fragment tym nowym.

---

## ✅ Jak sprawdzić czy dobrze?

Po commit:
1. GitHub Actions powinien uruchomić deploy
2. W logach powinny pojawić się nowe kroki:
   - ✅ Sync SQL migrations
   - ✅ Run database migrations
3. Jeśli są błędy składni YAML, GitHub pokaże błąd od razu

---

## 💡 WSKAZÓWKA:

Jeśli GitHub pokazuje błąd składni YAML po commit, możesz:
1. Kliknąć "Edit" ponownie
2. Naprawić wcięcia
3. Commit ponownie

YAML jest bardzo wrażliwy na wcięcia - muszą być **dokładnie** takie same jak w innych krokach!

---

**Potrzebujesz pomocy? Daj znać!**
