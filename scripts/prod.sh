#!/usr/bin/env bash
# Starts Form Sender in production (used by `make prod`): it builds, starts everything in the background and
# keeps it running (Docker brings it back after a restart of the server). Safe to run again to update.
set -uo pipefail

cd "$(dirname "$0")/.."

# shellcheck source=lib/brand.sh
source scripts/lib/brand.sh

printf "\n"; brand_title; printf "\n\n"

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
COMPOSE=(docker compose --env-file "$ENV_FILE" -f docker-compose.prod.yml)

# ------------------------------------------------------------ prerequisites
command -v docker >/dev/null 2>&1 || fail "Docker is not installed." "Install it from https://docs.docker.com/engine/install/ and run make prod again."
docker info >/dev/null 2>&1 || fail "Docker is installed but not running." "Start it (for example: sudo systemctl start docker) and run make prod again."
docker compose version >/dev/null 2>&1 || fail "Docker Compose v2 was not found." "Update Docker, or install the compose plugin, and run make prod again."

# ------------------------------------------------------------ first run: the settings file
random() { openssl rand -base64 "$1" | tr -d '\n=+/' | cut -c1-"$2"; }

if [ ! -f "$ENV_FILE" ]; then
    cp .env.prod.example "$ENV_FILE"
    key="base64:$(openssl rand -base64 32)"
    password="$(random 48 32)"
    # | is safe as the separator: neither value can contain it.
    sed -i "s|^APP_KEY=.*|APP_KEY=${key}|; s|^DB_PASSWORD=.*|DB_PASSWORD=${password}|" "$ENV_FILE"
    chmod 600 "$ENV_FILE"
    ok "Created $ENV_FILE with a new key and a database password."
    fail "One thing is left: your address." \
        "Open $ENV_FILE, set PUBLIC_URL (for example https://forms.mycompany.com)," \
        "make sure that domain points at this server (ports 80 and 443 open) and run make prod again." \
        "To only try it on this computer, use PUBLIC_URL=http://localhost"
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

[ -n "${PUBLIC_URL:-}" ] || fail "PUBLIC_URL is empty in $ENV_FILE." "Set your address, like https://forms.mycompany.com, and run make prod again."
[ "$PUBLIC_URL" != "https://forms.example.com" ] || fail "PUBLIC_URL still has the example address." "Open $ENV_FILE, set your own address and run make prod again."
case "$PUBLIC_URL" in http://*|https://*) ;; *) fail "PUBLIC_URL must start with http:// or https://." "Now it is: $PUBLIC_URL" ;; esac

# ------------------------------------------------------------ build and start
printf '%sBuilding and starting (the first time takes a few minutes)...%s\n' "$D" "$N"
mkdir -p .logs
if ! "${COMPOSE[@]}" up -d --build --wait --remove-orphans >.logs/prod.log 2>&1; then
    tail -n 25 .logs/prod.log | sed 's/^/  /'
    fail "It did not start." "The full output is in .logs/prod.log." "See what a service says with: make prod-logs"
fi

ok "Form Sender is running."
printf '\n  %sAddress%s   %s\n\n' "$B" "$N" "$PUBLIC_URL"
printf '  %sOpen it and create the first administrator.%s It starts again by itself if the server restarts.\n' "$D" "$N"
printf '  %smake prod-logs%s to watch it, %smake prod-backup%s to save the database, %smake prod-down%s to stop it.\n' "$B" "$N" "$B" "$N" "$B" "$N"
