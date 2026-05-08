# ✅ GOTOWE DO NAPRAWY PROFILU

## Status:
- ✅ Deployment zakończony pomyślnie
- ✅ Skrypt migracji na VPS: `scripts/run-migrations-on-vps.sh`
- ✅ SQL migration: `backend/sql/2026-05-08-add-achievements-to-experiences.sql`
- ⏳ **Wymaga uruchomienia na VPS**

## Jak uruchomić migrację:

### Opcja 1: SSH bezpośrednio (NAJSZYBSZA)
```bash
ssh root@YOUR_VPS_IP 'cd /root/project && bash scripts/run-migrations-on-vps.sh'
```

### Opcja 2: Zaloguj się i uruchom
```bash
ssh root@YOUR_VPS_IP
cd /root/project
bash scripts/run-migrations-on-vps.sh
```

## Co zrobi skrypt:
1. Połączy się z bazą danych (używając DATABASE_URL z .env)
2. Uruchomi migrację: `2026-05-08-add-achievements-to-experiences.sql`
3. Doda kolumnę `achievements` do tabeli `experiences`
4. Pokaże potwierdzenie

## Po uruchomieniu:
Sprawdź profil: https://jobs.multivohub.com/profile

Powinien działać bez błędu! ✅

---

**Potrzebujesz dostępu SSH? Daj znać!**
