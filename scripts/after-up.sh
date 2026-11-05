#!/usr/bin/env bash
# Runs next to `docker compose up` (foreground): once the app is healthy it seeds
# the database (idempotent) and prints the access links. Gives up quietly if the
# stack goes away (Ctrl+C) or never becomes healthy.
set -uo pipefail

cd "$(dirname "$0")/.."

for _ in $(seq 1 90); do
    container="$(docker compose ps -q app 2>/dev/null)"
    [ -z "$container" ] && { sleep 2; continue; }

    if [ "$(docker inspect -f '{{.State.Health.Status}}' "$container" 2>/dev/null)" = "healthy" ]; then
        docker compose exec -T app php artisan db:seed --force >/dev/null 2>&1
        ./scripts/urls.sh
        echo "Press Ctrl+C to stop everything."
        exit 0
    fi

    sleep 2
done
