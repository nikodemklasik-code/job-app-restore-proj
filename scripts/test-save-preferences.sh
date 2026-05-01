#!/usr/bin/env bash
# Test zapisywania preferencji bezpośrednio w bazie danych
set -euo pipefail

HOST="root@147.93.86.209"

echo "════════════════════════════════════════════"
echo "  Test zapisywania preferencji użytkownika"
echo "════════════════════════════════════════════"
echo ""

ssh "${HOST}" bash <<'ENDSSH'
set -e
cd /root/project

if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

DB_URL="${DATABASE_URL}"
if [[ "$DB_URL" =~ mysql://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+) ]]; then
  DB_USER="${BASH_REMATCH[1]}"
  DB_PASS="${BASH_REMATCH[2]}"
  DB_HOST="${BASH_REMATCH[3]}"
  DB_PORT="${BASH_REMATCH[4]}"
  DB_NAME="${BASH_REMATCH[5]}"
fi

echo "1. Sprawdzam użytkowników w bazie..."
mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" -e "
  SELECT id, clerk_id, email FROM users LIMIT 5;
"

echo ""
echo "2. Sprawdzam istniejące preferencje..."
mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" -e "
  SELECT * FROM user_job_preferences;
"

echo ""
echo "3. Sprawdzam career_goals..."
mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" -e "
  SELECT user_id, target_job_title, current_job_title FROM career_goals;
"

echo ""
echo "4. Test INSERT do user_job_preferences (symulacja zapisu)..."
echo "   Pobierz ID pierwszego użytkownika i spróbuj zapisać preferencje..."

# Pobierz ID pierwszego użytkownika
USER_ID=$(mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" -sN -e "SELECT id FROM users LIMIT 1;")

if [ -n "$USER_ID" ]; then
  echo "   User ID: $USER_ID"
  
  # Sprawdź czy już istnieje rekord
  EXISTS=$(mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" -sN -e "SELECT COUNT(*) FROM user_job_preferences WHERE user_id = '$USER_ID';")
  
  if [ "$EXISTS" -eq "0" ]; then
    echo "   Wstawiam nowy rekord..."
    mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" -e "
      INSERT INTO user_job_preferences (user_id, last_query, last_location)
      VALUES ('$USER_ID', 'test waiter', 'Manchester');
    "
    echo "   ✅ INSERT zakończony pomyślnie"
  else
    echo "   Aktualizuję istniejący rekord..."
    mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" -e "
      UPDATE user_job_preferences 
      SET last_query = 'test waiter updated', last_location = 'Manchester updated'
      WHERE user_id = '$USER_ID';
    "
    echo "   ✅ UPDATE zakończony pomyślnie"
  fi
  
  echo ""
  echo "5. Weryfikacja - sprawdzam zapisane dane..."
  mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" -e "
    SELECT * FROM user_job_preferences WHERE user_id = '$USER_ID';
  "
else
  echo "   ❌ Brak użytkowników w bazie!"
fi

echo ""
echo "6. Test UPDATE career_goals..."
if [ -n "$USER_ID" ]; then
  mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" -e "
    UPDATE career_goals 
    SET target_job_title = 'Waiter Test'
    WHERE user_id = '$USER_ID';
  "
  echo "   ✅ UPDATE career_goals zakończony"
  
  echo ""
  echo "7. Weryfikacja career_goals..."
  mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" -e "
    SELECT user_id, target_job_title, current_job_title FROM career_goals WHERE user_id = '$USER_ID';
  "
fi
ENDSSH

echo ""
echo "════════════════════════════════════════════"
echo "✅ Test zakończony"
echo "════════════════════════════════════════════"
