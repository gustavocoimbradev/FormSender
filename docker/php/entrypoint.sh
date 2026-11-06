#!/bin/sh
set -e

cd /var/www/backend

if [ ! -f .env ]; then
    cp .env.example .env
fi

if [ ! -d vendor ]; then
    composer install --no-interaction --prefer-dist
fi

# `php artisan serve` hands only a few environment variables to the server it starts, so the panel's address (which
# changes with the free port that was picked) goes into .env, where the server reads it.
if [ -n "$PANEL_URL" ]; then
    if grep -q '^PANEL_URL=' .env; then
        sed -i "s|^PANEL_URL=.*|PANEL_URL=$PANEL_URL|" .env
    else
        printf '\nPANEL_URL=%s\n' "$PANEL_URL" >> .env
    fi
fi

if ! grep -q '^APP_KEY=base64:' .env; then
    php artisan key:generate --force
fi

if [ "$RUN_MIGRATIONS" = "true" ]; then
    php artisan migrate --force
fi

if [ "$RUN_SEED" = "true" ]; then
    php artisan db:seed --force
fi

exec "$@"
