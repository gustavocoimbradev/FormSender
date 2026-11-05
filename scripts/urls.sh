#!/usr/bin/env bash
# Prints the access URLs of the running stack, read from the root .env.
set -euo pipefail

cd "$(dirname "$0")/.."

value() { grep -E "^$1=" .env | cut -d= -f2; }

echo
echo "FormSender is up:"
echo "  Frontend  http://localhost:$(value FRONTEND_PORT)"
echo "  API       http://localhost:$(value APP_PORT)/api"
echo "  Postgres  localhost:$(value DB_PORT)  (db: $(value DB_DATABASE), user: $(value DB_USERNAME))"
echo "  Redis     localhost:$(value REDIS_PORT)"
echo
