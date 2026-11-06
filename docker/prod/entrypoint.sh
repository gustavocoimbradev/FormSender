#!/bin/sh
# Runs before every container of the API image: prepares Laravel, then starts what the container is for.
set -e
cd /app

php artisan config:cache --no-interaction
php artisan route:cache --no-interaction
php artisan event:cache --no-interaction

# Only the web container updates the database (the others wait for it to be healthy).
if [ "$RUN_MIGRATIONS" = "1" ]; then
    php artisan migrate --force --no-interaction
fi

exec docker-php-entrypoint "$@"
