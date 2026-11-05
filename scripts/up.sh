#!/usr/bin/env bash
# FormSender launcher (used by `make up`).
#   scripts/up.sh          quiet: short, friendly messages; Ctrl+C stops everything
#   scripts/up.sh --logs   streams every log; Ctrl+C stops everything
set -uo pipefail

cd "$(dirname "$0")/.."

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

# The address other devices on the same network can use to reach this machine.
lan_ip() {
    local ip=""

    if is_wsl && command -v powershell.exe >/dev/null 2>&1; then
        # Docker Desktop publishes the ports on the Windows host, so the Windows address is the one that works.
        ip="$(powershell.exe -NoProfile -NonInteractive -Command "(Get-NetIPConfiguration | Where-Object { \$_.IPv4DefaultGateway -ne \$null -and \$_.NetAdapter.Status -eq 'Up' } | Select-Object -First 1).IPv4Address.IPAddress" 2>/dev/null | tr -d '\r' | head -1)"
    elif command -v ipconfig >/dev/null 2>&1; then
        ip="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)"
    elif command -v hostname >/dev/null 2>&1; then
        ip="$(hostname -I 2>/dev/null | tr ' ' '\n' | grep -E '^(192\.168|10\.|172\.(1[6-9]|2[0-9]|3[01]))\.' | head -1)"
    fi

    printf '%s' "$ip" | grep -E '^(192\.168|10\.|172\.(1[6-9]|2[0-9]|3[01]))\.' || true
}

preflight() {
    command -v docker >/dev/null 2>&1 || {
        if is_wsl; then
            fail "O Docker não foi encontrado neste terminal." \
                "Abra o Docker Desktop > Settings > Resources > WSL integration, ative esta distro" \
                "e abra um novo terminal."
        fi
        fail "O Docker não foi encontrado." "Instale em https://docs.docker.com/get-docker/ e rode make up de novo."
    }

    local info
    if ! info="$(docker info 2>&1)"; then
        if echo "$info" | grep -qi 'wsl'; then
            fail "O Docker não está integrado a este terminal (WSL)." \
                "Abra o Docker Desktop > Settings > Resources > WSL integration, ative esta distro" \
                "e abra um novo terminal."
        elif echo "$info" | grep -qi 'permission denied'; then
            fail "Sem permissão para usar o Docker." \
                "Adicione seu usuário ao grupo docker (sudo usermod -aG docker \$USER) e abra um novo terminal."
        fi
        fail "O Docker não está em execução." "Abra o Docker Desktop, espere ele iniciar e rode make up de novo."
    fi

    docker compose version >/dev/null 2>&1 \
        || fail "O Docker Compose (v2) não foi encontrado." "Atualize o Docker Desktop ou instale o plugin docker-compose-plugin."

    ok "Docker pronto"
}

choose_ports() {
    ./scripts/free-ports.sh >/dev/null 2>&1 \
        || fail "Não consegui escolher as portas do projeto." "Rode ./scripts/free-ports.sh para ver o motivo."
    ok "Portas escolhidas"
}

# Explains, in plain words, why `docker compose up` failed, then ends the command.
diagnose() {
    local port bad service
    local details=()

    port="$(grep -oE 'Bind for [^ ]*:[0-9]+ failed' "$LOG_FILE" 2>/dev/null | grep -oE '[0-9]+ failed' | grep -oE '[0-9]+' | tail -1)"
    [ -n "$port" ] && fail "A porta $port foi ocupada por outro programa." "Rode make up de novo: uma porta livre será escolhida."

    if grep -qiE 'pull access denied|no such host|TLS handshake|i/o timeout|Temporary failure in name resolution' "$LOG_FILE" 2>/dev/null; then
        fail "Não consegui baixar as imagens do Docker." "Verifique sua conexão com a internet e rode make up de novo."
    fi

    bad="$(docker compose ps -a --format '{{.Service}} {{.State}} {{.Health}}' 2>/dev/null \
        | awk '$2 != "running" || ($3 != "" && $3 != "healthy") { print $1 }' | head -3)"

    for service in $bad; do
        details+=("Serviço com problema: $service")
        while IFS= read -r line; do details+=("  $line"); done < <(docker compose logs --no-color --tail 6 "$service" 2>/dev/null | cut -c1-110)
    done

    fail "Algo não subiu como esperado." "${details[@]}" "Veja tudo com: make up logs   (e, para limpar: make down)"
}

seed_database() {
    local output
    if ! output="$(docker compose exec -T app php artisan db:seed --force 2>&1)"; then
        fail "Não consegui preparar o banco de dados." "$(echo "$output" | tail -2 | cut -c1-110)" "Veja tudo com: make up logs"
    fi
    ok "Banco de dados pronto"
}

check_panel() {
    command -v curl >/dev/null 2>&1 || return 0

    local port code
    port="$(value FRONTEND_PORT)"
    code="$(curl -s -o /dev/null -w '%{http_code}' -m 10 "http://localhost:$port/api/setup" 2>/dev/null)"

    [ "$code" = "200" ] || fail "O painel subiu, mas não está conseguindo falar com o servidor." \
        "Resposta recebida em localhost:$port: ${code:-nenhuma}" \
        "Veja os detalhes com: make up logs"
    ok "Painel respondendo"
}

summary() {
    local port ip
    port="$(value FRONTEND_PORT)"
    ip="$(lan_ip)"

    printf '\n%s%s✔ FormSender no ar!%s\n\n' "$G" "$B" "$N"
    printf '  Abra no navegador   %s%s%s\n' "$B" "http://localhost:$port" "$N"

    if [ -n "$ip" ]; then
        printf '  Na sua rede         %s%s%s\n\n' "$B" "http://$ip:$port" "$N"
        ./scripts/qr.sh "http://$ip:$port"
    else
        printf '\n'
    fi

    printf '\n  %sPressione Ctrl+C para parar tudo.%s\n' "$D" "$N"
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
    warn "O painel ainda não respondeu. Acompanhe os logs acima."
    exit 0
fi

printf '\n%sFormSender%s\n\n' "$B" "$N"
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
spin $! "Iniciando os serviços (na primeira vez pode levar alguns minutos)" || diagnose
ok "Serviços no ar"

seed_database
check_panel
summary

stop_all() {
    trap - INT TERM HUP
    printf '\n'
    docker compose stop >"$LOG_DIR/stop.log" 2>&1 &
    spin $! "Parando os serviços" || warn "Nem tudo parou. Rode make down."
    ok "Tudo parado. Até logo!"
    exit 0
}

trap stop_all INT TERM HUP
while true; do sleep 1; done
