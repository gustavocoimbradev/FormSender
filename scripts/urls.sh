#!/usr/bin/env bash
# Prints the access URLs of the running stack, read from the root .env.
set -euo pipefail

cd "$(dirname "$0")/.."

value() { grep -E "^$1=" .env | cut -d= -f2; }

echo
echo "Form Sender is up:"
echo "  Dashboard http://localhost:$(value FRONTEND_PORT)"
echo "  API       http://localhost:$(value APP_PORT)/api"
echo "  Postgres  localhost:$(value DB_PORT)  (db: $(value DB_DATABASE), user: $(value DB_USERNAME))"
echo "  Redis     localhost:$(value REDIS_PORT)"
echo "  Mailpit   http://localhost:$(value MAILPIT_UI_PORT)  (SMTP: localhost:$(value MAILPIT_SMTP_PORT))"
echo "  API docs  http://localhost:$(value APP_PORT)/"
echo
