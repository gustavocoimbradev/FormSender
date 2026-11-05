#!/usr/bin/env bash
# Puts the database back to its initial state (what a fresh install looks like):
# every table is dropped and recreated, the seeders run again and the Redis
# queue/cache is emptied. The next visit lands on the setup screen.
#   scripts/reset.sh          asks for confirmation
#   YES=1 scripts/reset.sh    no question (scripts and automation)
set -uo pipefail

cd "$(dirname "$0")/.."

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

command -v docker >/dev/null 2>&1 || fail "O Docker não foi encontrado." "Abra o Docker Desktop (com a integração WSL ativa) e tente de novo."
docker info >/dev/null 2>&1 || fail "O Docker não está em execução." "Abra o Docker Desktop, espere ele iniciar e tente de novo."

[ -n "$(docker compose ps -q app 2>/dev/null)" ] \
    || fail "O projeto não está no ar." "Suba com make up (ou make start) e rode make reset de novo."

printf '\n%sFormSender%s\n\n' "$B" "$N"
printf '%s!%s Isto apaga %stodos os dados%s: usuários, formulários, mensagens recebidas e configurações.\n' "$Y" "$N" "$B" "$N"
printf '  O banco volta ao estado inicial e você precisará criar o administrador de novo.\n\n'

if [ "${YES:-}" != "1" ]; then
    [ -t 0 ] || fail "Sem terminal para confirmar." "Rode com YES=1 para confirmar sem perguntar: make reset YES=1"

    printf 'Digite %ssim%s para continuar: ' "$B" "$N"
    read -r answer
    case "$(printf '%s' "$answer" | tr '[:upper:]' '[:lower:]')" in
        sim|s|yes|y) ;;
        *) printf '\n%sNada foi alterado.%s\n' "$D" "$N"; exit 0 ;;
    esac
    printf '\n'
fi

if ! output="$(docker compose exec -T app php artisan migrate:fresh --seed --force 2>&1)"; then
    fail "Não consegui limpar o banco de dados." "$(printf '%s' "$output" | tail -3 | cut -c1-110)" "Veja os detalhes com: make logs"
fi
ok "Banco de dados limpo"

docker compose exec -T redis redis-cli FLUSHALL >/dev/null 2>&1 \
    && ok "Fila e cache esvaziados" \
    || printf '%s!%s Não consegui esvaziar a fila (Redis). Tarefas antigas podem sobrar.\n' "$Y" "$N"

printf '\n%s%s✔ Tudo no estado inicial.%s\n' "$G" "$B" "$N"
printf '  %sAbra o painel: a primeira tela é a de configuração inicial.%s\n\n' "$D" "$N"
