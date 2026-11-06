#!/usr/bin/env bash
# Starts Form Sender in production (used by `make prod`): the first time it asks for the address and sets everything up,
# then it builds and starts everything in the background and keeps it running (Docker brings it back after a restart
# of the server). Safe to run again to update.
#   scripts/prod.sh             set up if needed, then build and start
#   scripts/prod.sh --setup     ask for the address again (make prod-setup), then build and start
#   scripts/prod.sh --no-start  only set up (create .env.prod and ask for the address)
#   ADDRESS=forms.mycompany.com scripts/prod.sh    no questions: for scripts and automation
set -uo pipefail

cd "$(dirname "$0")/.."

# shellcheck source=lib/brand.sh
source scripts/lib/brand.sh

ASK_AGAIN=0
START=1
for argument in "$@"; do
    [ "$argument" = "--setup" ] && ASK_AGAIN=1
    [ "$argument" = "--no-start" ] && START=0
done

if [ -t 1 ] && [ -z "${NO_COLOR:-}" ]; then
    G=$'\033[32m'; R=$'\033[31m'; Y=$'\033[33m'; D=$'\033[2m'; B=$'\033[1m'; N=$'\033[0m'
else
    G=""; R=""; Y=""; D=""; B=""; N=""
fi

printf "\n"; brand_title; printf "\n\n"

ok()   { printf '%s✔%s %s\n' "$G" "$N" "$1"; }
warn() { printf '%s!%s %s\n' "$Y" "$N" "$1"; }

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

# ------------------------------------------------------------ the settings file (created once, with secrets)
random() { openssl rand -base64 "$1" | tr -d '\n=+/' | cut -c1-"$2"; }

if [ ! -f "$ENV_FILE" ]; then
    cp .env.prod.example "$ENV_FILE"
    chmod 600 "$ENV_FILE"
    ok "Created $ENV_FILE."
    ASK_AGAIN=1
fi

# The key and the database password are generated once, whenever they are empty (also when the file was made by hand).
# Never replaced when they already have a value: a new key would make the saved SMTP password unreadable.
# | is safe as the sed separator: neither value can contain it.
if ! grep -Eq '^APP_KEY=.+' "$ENV_FILE"; then
    sed -i "s|^APP_KEY=.*|APP_KEY=base64:$(openssl rand -base64 32)|" "$ENV_FILE"
    ok "Generated the application key."
fi
if ! grep -Eq '^DB_PASSWORD=.+' "$ENV_FILE"; then
    sed -i "s|^DB_PASSWORD=.*|DB_PASSWORD=$(random 48 32)|" "$ENV_FILE"
    ok "Generated the database password."
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

# A tunnel token means the server sits behind a Cloudflare Tunnel: the tunnel brings https, so Caddy listens on plain
# http and the ports stay on this machine only.
TUNNEL=0
if [ -n "${TUNNEL_TOKEN:-}" ]; then
    TUNNEL=1
    export COMPOSE_PROFILES=tunnel SITE_ADDRESS=":80" BIND_ADDRESS="127.0.0.1"
fi

# ------------------------------------------------------------ the address
# What people type becomes a full address: a domain gets https (the certificate is automatic); an IP address,
# localhost or a name without dots can only use plain http, because nobody issues a certificate for them.
# Prints the address, or nothing (and a reason on stderr) when it cannot be used.
normalize_address() {
    local text scheme="" host
    text="$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]' | tr -d '[:space:]')"

    case "$text" in
        https://*) scheme="https"; text="${text#https://}" ;;
        http://*) scheme="http"; text="${text#http://}" ;;
    esac

    host="${text%%/*}"
    [ -n "$host" ] || { echo "Type an address." >&2; return 1; }

    case "$host" in
        *:*) echo "Leave the port out: the server uses 80 and 443." >&2; return 1 ;;
    esac

    if printf '%s' "$host" | grep -Eq '^([0-9]{1,3}\.){3}[0-9]{1,3}$'; then
        for octet in ${host//./ }; do
            [ "$octet" -le 255 ] || { echo "An IP address has numbers up to 255." >&2; return 1; }
        done
        [ -n "$scheme" ] || scheme="http"
    elif [ "$host" = "localhost" ] || printf '%s' "$host" | grep -Eq '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$'; then
        [ -n "$scheme" ] || scheme="http"
    elif printf '%s' "$host" | grep -Eq '^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$'; then
        [ -n "$scheme" ] || scheme="https"
    else
        echo "That does not look like a domain or an IP address." >&2
        return 1
    fi

    printf '%s://%s' "$scheme" "$host"
}

current_is_usable() {
    [ -n "${PUBLIC_URL:-}" ] && [ "$PUBLIC_URL" != "https://forms.example.com" ] && normalize_address "$PUBLIC_URL" >/dev/null 2>&1
}

chosen=""

if [ -n "${ADDRESS:-}" ]; then
    # No questions (scripts, automation).
    chosen="$(normalize_address "$ADDRESS")" || fail "ADDRESS is not usable: $ADDRESS" "Use a domain (forms.mycompany.com) or an IP address (203.0.113.5)."
elif [ "$ASK_AGAIN" = 1 ] || ! current_is_usable; then
    [ -t 0 ] || fail "I need to know the address, and there is no one to ask." \
        "Run it like this: ADDRESS=forms.mycompany.com make prod" \
        "or set PUBLIC_URL in $ENV_FILE."

    guess="$(hostname -I 2>/dev/null | awk '{print $1}')"

    printf '%sWhat address will people use to open it?%s\n' "$B" "$N"
    printf '  %sA domain (forms.mycompany.com) gets https by itself, as long as it points at this server.%s\n' "$D" "$N"
    printf '  %sAn IP address (%s) or localhost works too, over plain http.%s\n\n' "$D" "${guess:-203.0.113.5}" "$N"

    attempts=0
    while [ -z "$chosen" ]; do
        attempts=$((attempts + 1))
        [ "$attempts" -le 5 ] || fail "That is not working out." "Run make prod again when you know the address."
        default=""
        current_is_usable && default="$PUBLIC_URL"
        if [ -n "$default" ]; then
            read -r -p "  Address [$default]: " answer || fail "No answer."
            answer="${answer:-$default}"
        else
            read -r -p "  Address: " answer || fail "No answer."
        fi
        chosen="$(normalize_address "$answer")" || chosen=""
    done
    printf '\n'
else
    chosen="$PUBLIC_URL"
fi

if [ "$chosen" != "${PUBLIC_URL:-}" ]; then
    sed -i "s|^PUBLIC_URL=.*|PUBLIC_URL=${chosen}|" "$ENV_FILE"
    PUBLIC_URL="$chosen"
    ok "Address saved in $ENV_FILE: $PUBLIC_URL"
else
    ok "Address: $PUBLIC_URL"
fi

[ "$TUNNEL" = 1 ] && [ "${PUBLIC_URL#https://}" = "$PUBLIC_URL" ] && \
    fail "With a tunnel the address must be https." "Set PUBLIC_URL to the https address of the tunnel in $ENV_FILE (for example https://forms.mycompany.com)."

case "$PUBLIC_URL" in
    http://*) warn "Over plain http. A form on an https site needs its embed script over https too: use a domain for that." ;;
esac

[ "$START" = 1 ] || { printf '\n  %sSet up. Run make prod to start it.%s\n' "$D" "$N"; exit 0; }

# ------------------------------------------------------------ the ports must be free
port_busy() { ss -ltn 2>/dev/null | awk 'NR>1 {print $4}' | grep -Eq "[:.]$1\$"; }

if [ "$TUNNEL" = 1 ]; then
    ok "Tunnel on: nothing is opened on this machine."
elif ! docker ps --format '{{.Names}}' | grep -q '^formsender-prod-web-1$'; then
    for port in 80 443; do
        if [ "$port" = 443 ] && [ "${PUBLIC_URL#https://}" = "$PUBLIC_URL" ]; then continue; fi
        port_busy "$port" && fail "Port $port is already used on this server." \
            "Something else (another web server, like nginx or apache) is listening on it." \
            "Stop that, or free the port, and run make prod again."
    done
fi

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
printf '  %smake prod-logs%s to watch it, %smake prod-backup%s to save the database, %smake prod-down%s to stop it,\n' "$B" "$N" "$B" "$N" "$B" "$N"
printf '  %smake prod-setup%s to change the address.\n' "$B" "$N"
