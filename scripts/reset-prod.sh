#!/usr/bin/env bash
# Puts the PRODUCTION database back to a fresh install (used by `make reset:prod`): a backup is saved first, then
# every table is dropped and recreated, the files visitors attached are deleted and the Redis queue/cache is emptied.
# The next visit lands on the setup screen (administrator, new accounts and SMTP are asked again).
#   scripts/reset-prod.sh          asks for confirmation (type the address of the site)
#   YES=1 scripts/reset-prod.sh    no question (scripts and automation)
set -uo pipefail

cd "$(dirname "$0")/.."

# shellcheck source=lib/brand.sh
source scripts/lib/brand.sh

if [ -t 1 ] && [ -z "${NO_COLOR:-}" ]; then
    G=$'\033[32m'; R=$'\033[31m'; Y=$'\033[33m'; D=$'\033[2m'; B=$'\033[1m'; N=$'\033[0m'
else
    G=""; R=""; Y=""; D=""; B=""; N=""
fi

ok() { printf '%s✔%s %s\n' "$G" "$N" "$1"; }

fail() {
    printf '%s✖%s %s%s%s\n' "$R" "$N" "$B" "$1" "$N"
    shift
    for line in "$@"; do printf '  %s%s%s\n' "$D" "$line" "$N"; done
    exit 1
}

ENV_FILE=".env.prod"
COMPOSE=(docker compose --profile tunnel --env-file "$ENV_FILE" -f docker-compose.prod.yml)

[ -f "$ENV_FILE" ] || fail "There is no production setup here." "Nothing to reset: $ENV_FILE does not exist. Start it first with make up:prod."
command -v docker >/dev/null 2>&1 || fail "Docker was not found." "Install it and try again."
docker info >/dev/null 2>&1 || fail "Docker is not running." "Start it and try again."

[ -n "$("${COMPOSE[@]}" ps -q web 2>/dev/null)" ] \
    || fail "Production is not running." "Start it with make up:prod and run make reset:prod again."

PUBLIC_URL="$(grep -E '^PUBLIC_URL=' "$ENV_FILE" | head -n1 | cut -d= -f2-)"
SITE="${PUBLIC_URL#*://}"

printf '\n'
brand_title
printf '\n\n'
printf '%s!%s This erases %sall production data%s of %s%s%s: accounts, forms, received messages, attached files and settings.\n' "$Y" "$N" "$B" "$N" "$B" "$SITE" "$N"
printf '  A backup of the database is saved in backups/ first (the attached files are not part of it).\n'
printf '  Afterwards you create the administrator again.\n\n'

if [ "${YES:-}" != "1" ]; then
    [ -t 0 ] || fail "No terminal to confirm." "Run with YES=1 to confirm without asking: make reset:prod YES=1"

    printf 'Type the address of the site (%s%s%s) to continue: ' "$B" "$SITE" "$N"
    read -r answer
    if [ "$(printf '%s' "$answer" | tr '[:upper:]' '[:lower:]' | tr -d '[:space:]')" != "$(printf '%s' "$SITE" | tr '[:upper:]' '[:lower:]')" ]; then
        printf '\n%sNothing was changed.%s\n' "$D" "$N"
        exit 0
    fi
    printf '\n'
fi

# A mistake can be undone only if the copy exists: without it, nothing is erased.
mkdir -p backups
backup="backups/formsender-before-reset-$(date +%Y%m%d-%H%M%S).sql.gz"
if ! "${COMPOSE[@]}" exec -T postgres pg_dump -U formsender formsender 2>/dev/null | gzip > "$backup" || [ ! -s "$backup" ]; then
    rm -f "$backup"
    fail "Could not save the backup, so nothing was erased." "Check that the database is running: make status:prod"
fi
ok "Backup saved: $backup"

if ! output="$("${COMPOSE[@]}" exec -T web php artisan migrate:fresh --force 2>&1)"; then
    fail "Could not wipe the database." "$(printf '%s' "$output" | tail -3 | cut -c1-110)" "See the details with: make logs:prod"
fi
ok "Database wiped"

"${COMPOSE[@]}" exec -T web sh -c 'rm -rf /app/storage/app/private/submission-attachments /app/storage/app/submission-attachments' >/dev/null 2>&1 \
    && ok "Attached files deleted" \
    || printf '%s!%s Could not delete the attached files. They stay in the storage volume.\n' "$Y" "$N"

"${COMPOSE[@]}" exec -T redis redis-cli FLUSHALL >/dev/null 2>&1 \
    && ok "Queue and cache emptied" \
    || printf '%s!%s Could not empty the queue (Redis). Old jobs may remain.\n' "$Y" "$N"

printf '\n  %sDone.%s Open %s to set it up again.\n' "$B" "$N" "$PUBLIC_URL"
