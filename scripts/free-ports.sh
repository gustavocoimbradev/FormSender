#!/usr/bin/env bash
# Writes the root .env with a free host port for every service.
# Keeps a port already assigned to this project's own running containers.
set -euo pipefail

cd "$(dirname "$0")/.."

PROJECT="$(basename "$PWD" | tr '[:upper:]' '[:lower:]')"
VARIABLES=(APP_PORT FRONTEND_PORT DB_PORT REDIS_PORT)
declare -A DEFAULTS=([APP_PORT]=8000 [FRONTEND_PORT]=3000 [DB_PORT]=5432 [REDIS_PORT]=6379)

[ -f .env ] || cp .env.example .env

# Ports published by other Docker containers (this project's own are excluded).
other_docker_ports() {
    command -v docker >/dev/null 2>&1 || return 0
    docker ps --format '{{.Label "com.docker.compose.project"}}|{{.Ports}}' 2>/dev/null \
        | grep -v "^${PROJECT}|" | grep -oE ':[0-9]+->' | tr -d ':>-' || true
}

own_docker_ports() {
    command -v docker >/dev/null 2>&1 || return 0
    docker ps --filter "label=com.docker.compose.project=${PROJECT}" --format '{{.Ports}}' 2>/dev/null \
        | grep -oE ':[0-9]+->' | tr -d ':>-' || true
}

host_listening_ports() {
    (ss -ltn 2>/dev/null || netstat -ltn 2>/dev/null) | grep -oE ':[0-9]+ ' | tr -d ': ' || true
}

OWN="$(own_docker_ports)"
BUSY="$(host_listening_ports; other_docker_ports)"
CLAIMED=""

is_busy() { echo "$BUSY" | grep -qx "$1" || echo "$CLAIMED" | grep -qx "$1"; }
is_own()  { echo "$OWN" | grep -qx "$1"; }

for variable in "${VARIABLES[@]}"; do
    current="$(grep -E "^${variable}=" .env | cut -d= -f2 || true)"
    port="${current:-${DEFAULTS[$variable]}}"

    if ! is_own "$port"; then
        port="${DEFAULTS[$variable]}"
        while is_busy "$port"; do port=$((port + 1)); done
    fi

    CLAIMED="${CLAIMED}"$'\n'"${port}"
    if grep -qE "^${variable}=" .env; then
        sed -i -E "s/^${variable}=.*/${variable}=${port}/" .env
    else
        echo "${variable}=${port}" >> .env
    fi
    :
done
