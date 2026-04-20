#!/usr/bin/env bash
# Rolling mirror of the repo (no .git, no node_modules, no build outputs).
# Default destination: ~/Downloads/KOPIA/.job-app-restore/proj (dirs created if missing).
# Each run removes the previous mirror at that path and replaces it — one slot only.
#
# Override destination: ROLLING_BACKUP_DEST=/other/path bash scripts/rolling-workspace-backup.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="${ROLLING_BACKUP_DEST:-$HOME/Downloads/KOPIA/.job-app-restore/proj}"

# Refuse dangerous / empty destinations (typos like "/" or "$HOME")
case "$DEST" in
  ''|/|"$HOME"|"$HOME/" )
    echo "❌ Refusing backup: invalid ROLLING_BACKUP_DEST / resolved path: ${DEST:-empty}" >&2
    exit 1
    ;;
esac
case "$DEST" in
  *Downloads/KOPIA/.job-app-restore/proj*) ;; # canonical OK
  *)
    if [[ "${ROLLING_BACKUP_ALLOW_ALT_DEST:-}" != "1" ]]; then
      echo "❌ Backup must go under ~/Downloads/KOPIA/.job-app-restore/proj" >&2
      echo "   Got: $DEST" >&2
      echo "   Override: ROLLING_BACKUP_ALLOW_ALT_DEST=1 ROLLING_BACKUP_DEST=... $0" >&2
      exit 1
    fi
    ;;
esac

mkdir -p "$(dirname "$DEST")"
rm -rf "$DEST"
mkdir -p "$DEST"
rsync -a \
  --exclude node_modules \
  --exclude '**/node_modules' \
  --exclude .git \
  --exclude frontend/dist \
  --exclude backend/dist \
  "$ROOT/" "$DEST/"
echo "Rolling backup updated: $DEST"
