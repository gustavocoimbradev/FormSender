#!/usr/bin/env bash
# Puts the database back to its initial state (what a fresh install looks like):
# every table is dropped and recreated, the seeders run again and the Redis
# queue/cache is emptied. The next visit lands on the setup screen.
#   scripts/reset.sh          asks for confirmation
#   YES=1 scripts/reset.sh    no question (scripts and automation)
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

command -v docker >/dev/null 2>&1 || fail "Docker was not found." "Open Docker Desktop (with WSL integration on) and try again."
docker info >/dev/null 2>&1 || fail "Docker is not running." "Open Docker Desktop, wait for it to start and try again."

[ -n "$(docker compose ps -q app 2>/dev/null)" ] \
    || fail "The project is not running." "Start it with make up:dev (or make start:dev) and run make reset:dev again."

printf '\n'
brand_title
printf '\n\n'
printf '%s!%s This erases %sall data%s: users, forms, received messages and settings.\n' "$Y" "$N" "$B" "$N"
printf '  The database goes back to its initial state and you will need to create the administrator again.\n\n'

if [ "${YES:-}" != "1" ]; then
    [ -t 0 ] || fail "No terminal to confirm." "Run with YES=1 to confirm without asking: make reset:dev YES=1"

    printf 'Type %syes%s to continue: ' "$B" "$N"
    read -r answer
    case "$(printf '%s' "$answer" | tr '[:upper:]' '[:lower:]')" in
        yes|y|sim|s) ;;
        *) printf '\n%sNothing was changed.%s\n' "$D" "$N"; exit 0 ;;
    esac
    printf '\n'
fi

if ! output="$(docker compose exec -T app php artisan migrate:fresh --seed --force 2>&1)"; then
    fail "Could not wipe the database." "$(printf '%s' "$output" | tail -3 | cut -c1-110)" "See the details with: make logs:dev"
fi
ok "Database wiped"

docker compose exec -T redis redis-cli FLUSHALL >/dev/null 2>&1 \
    && ok "Queue and cache emptied" \
    || printf '%s!%s Could not empty the queue (Redis). Old jobs may remain.\n' "$Y" "$N"

printf '\n%s%s✔ Back to a fresh install.%s\n' "$G" "$B" "$N"
printf '  %sOpen the dashboard: the first screen is the initial setup.%s\n\n' "$D" "$N"
