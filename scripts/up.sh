#!/usr/bin/env bash
# Form Sender launcher (used by `make dev`).
#   scripts/up.sh          quiet: short, friendly messages; Ctrl+C stops everything
#   scripts/up.sh --logs   streams every log; Ctrl+C stops everything
set -uo pipefail

cd "$(dirname "$0")/.."

# shellcheck source=lib/brand.sh
source scripts/lib/brand.sh

MODE="quiet"
[ "${1:-}" = "--logs" ] && MODE="logs"
[ "${1:-}" = "--after-up" ] && MODE="after"

LOG_DIR=".logs"
LOG_FILE="$LOG_DIR/up.log"

# ---------------------------------------------------------------- terminal ui
if [ -t 1 ] && [ -z "${NO_COLOR:-}" ]; then
    TTY=1
    G=$'\033[32m'; R=$'\033[31m'; Y=$'\033[33m'; D=$'\033[2m'; B=$'\033[1m'; N=$'\033[0m'
else
    TTY=0
    G=""; R=""; Y=""; D=""; B=""; N=""
fi

ok()   { printf '%s✔%s %s\n' "$G" "$N" "$1"; }
warn() { printf '%s!%s %s\n' "$Y" "$N" "$1"; }

# fail "what happened" "hint" ...  -> prints, then ends the command
fail() {
    printf '%s✖%s %s%s%s\n' "$R" "$N" "$B" "$1" "$N"
    shift
    for line in "$@"; do printf '  %s%s%s\n' "$D" "$line" "$N"; done
    exit 1
}

restore_cursor() { [ "$TTY" = 1 ] && printf '\033[?25h'; return 0; }
trap restore_cursor EXIT

# spin PID "label": animates while PID runs, returns PID's exit code
spin() {
    local pid=$1 label=$2 i=0
    local frames=(⠋ ⠙ ⠹ ⠸ ⠼ ⠴ ⠦ ⠧ ⠇ ⠏)

    if [ "$TTY" = 1 ]; then
        printf '\033[?25l'
        while kill -0 "$pid" 2>/dev/null; do
            printf '\r%s%s%s %s' "$Y" "${frames[i % ${#frames[@]}]}" "$N" "$label"
            i=$((i + 1))
            sleep 0.1
        done
        printf '\r\033[K'
        restore_cursor
    else
        printf '… %s\n' "$label"
    fi

    wait "$pid"
}

# ------------------------------------------------------------------- helpers
is_wsl() { grep -qi microsoft /proc/version 2>/dev/null; }

value() { grep -E "^$1=" .env 2>/dev/null | cut -d= -f2; }

preflight() {
    command -v docker >/dev/null 2>&1 || {
        if is_wsl; then
            fail "Docker was not found in this terminal." \
                "Open Docker Desktop > Settings > Resources > WSL integration, enable this distro" \
                "and open a new terminal."
        fi
        fail "Docker was not found." "Install it from https://docs.docker.com/get-docker/ and run make dev again."
    }

    local info
    if ! info="$(docker info 2>&1)"; then
        if echo "$info" | grep -qi 'wsl'; then
            fail "Docker is not integrated with this terminal (WSL)." \
                "Open Docker Desktop > Settings > Resources > WSL integration, enable this distro" \
                "and open a new terminal."
        elif echo "$info" | grep -qi 'permission denied'; then
            fail "No permission to use Docker." \
                "Add your user to the docker group (sudo usermod -aG docker \$USER) and open a new terminal."
        fi
        fail "Docker is not running." "Open Docker Desktop, wait for it to start and run make dev again."
    fi

    docker compose version >/dev/null 2>&1 \
        || fail "Docker Compose (v2) was not found." "Update Docker Desktop or install the docker-compose-plugin."

    ok "Docker ready"
}

choose_ports() {
    ./scripts/free-ports.sh >/dev/null 2>&1 \
        || fail "Could not choose the project's ports." "Run ./scripts/free-ports.sh to see why."
    ok "Ports chosen"
}

# Explains, in plain words, why `docker compose up` failed, then ends the command.
diagnose() {
    local port bad service
    local details=()

    port="$(grep -oE 'Bind for [^ ]*:[0-9]+ failed' "$LOG_FILE" 2>/dev/null | grep -oE '[0-9]+ failed' | grep -oE '[0-9]+' | tail -1)"
    [ -n "$port" ] && fail "Port $port was taken by another program." "Run make dev again: a free port will be picked."

    if grep -qiE 'pull access denied|no such host|TLS handshake|i/o timeout|Temporary failure in name resolution' "$LOG_FILE" 2>/dev/null; then
        fail "Could not download the Docker images." "Check your internet connection and run make dev again."
    fi

    bad="$(docker compose ps -a --format '{{.Service}} {{.State}} {{.Health}}' 2>/dev/null \
        | awk '$2 != "running" || ($3 != "" && $3 != "healthy") { print $1 }' | head -3)"

    for service in $bad; do
        details+=("Service with a problem: $service")
        while IFS= read -r line; do details+=("  $line"); done < <(docker compose logs --no-color --tail 6 "$service" 2>/dev/null | cut -c1-110)
    done

    fail "Something did not start as expected." "${details[@]}" "See everything with: make dev logs   (and to clean up: make down)"
}

seed_database() {
    local output
    if ! output="$(docker compose exec -T app php artisan db:seed --force 2>&1)"; then
        fail "Could not prepare the database." "$(echo "$output" | tail -2 | cut -c1-110)" "See everything with: make dev logs"
    fi
    ok "Database ready"
}

check_panel() {
    command -v curl >/dev/null 2>&1 || return 0

    local port code
    port="$(value FRONTEND_PORT)"
    code="$(curl -s -o /dev/null -w '%{http_code}' -m 10 "http://localhost:$port/api/setup" 2>/dev/null)"

    [ "$code" = "200" ] || fail "The dashboard started, but it cannot reach the server." \
        "Response received on localhost:$port: ${code:-none}" \
        "See the details with: make dev logs"
    ok "Dashboard responding"
}

summary() {
    local front api mailpit
    front="$(value FRONTEND_PORT)"
    api="$(value APP_PORT)"
    mailpit="$(value MAILPIT_UI_PORT)"
    printf '\n%s%s✔ Form Sender is up!%s\n\n' "$G" "$B" "$N"
    printf '  Dashboard  %s%s%s\n' "$B" "http://localhost:$front" "$N"
    printf '  API        %s%s%s\n' "$B" "http://localhost:$api" "$N"
    printf '  Mailpit    %s%s%s\n' "$B" "http://localhost:$mailpit" "$N"

    printf '\n  %sPress Ctrl+C to stop everything.%s\n' "$D" "$N"
}

# ------------------------------------------------------------------ the modes
if [ "$MODE" = "after" ]; then
    # Runs beside the foreground `docker compose up` of --logs: waits for the panel, then summarizes.
    for _ in $(seq 1 120); do
        code="$(curl -s -o /dev/null -w '%{http_code}' -m 5 "http://localhost:$(value FRONTEND_PORT)/api/setup" 2>/dev/null)"
        if [ "$code" = "200" ]; then
            docker compose exec -T app php artisan db:seed --force >/dev/null 2>&1
            summary
            exit 0
        fi
        sleep 3
    done
    warn "The dashboard has not responded yet. Follow the logs above."
    exit 0
fi

printf '\n'
brand_title
printf '\n\n'
preflight
choose_ports

if [ "$MODE" = "logs" ]; then
    "$0" --after-up &
    helper=$!
    trap 'kill "$helper" 2>/dev/null; restore_cursor' EXIT

    docker compose up --remove-orphans
    code=$?
    [ "$code" -eq 130 ] && exit 0
    exit "$code"
fi

mkdir -p "$LOG_DIR"
: > "$LOG_FILE"

docker compose up -d --wait --remove-orphans >"$LOG_FILE" 2>&1 &
spin $! "Starting the services (the first time can take a few minutes)" || diagnose
ok "Services up"

seed_database
check_panel
summary

stop_all() {
    trap - INT TERM HUP
    printf '\n'
    docker compose stop >"$LOG_DIR/stop.log" 2>&1 &
    spin $! "Stopping the services" || warn "Not everything stopped. Run make down."
    ok "Everything stopped. See you!"
    exit 0
}

trap stop_all INT TERM HUP
while true; do sleep 1; done
