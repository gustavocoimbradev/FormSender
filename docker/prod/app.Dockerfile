# The production image of the API, the queue worker and the scheduler (one image, three jobs).
# FrankenPHP is PHP and a web server in one: it also asks for the HTTPS certificate by itself.

FROM composer:2 AS vendor
WORKDIR /app
COPY backend/composer.json backend/composer.lock ./
# A download can fail now and then (a package host answering 504, a slow connection): fewer at a time, and the cache keeps
# what already came, so each new try only fetches what is missing.
ENV COMPOSER_MAX_PARALLEL_HTTP=4
RUN --mount=type=cache,target=/tmp/cache \
    for attempt in 1 2 3 4 5 6 7 8; do composer install --no-dev --prefer-dist --no-interaction --no-scripts --no-autoloader && break; [ "$attempt" = 8 ] && exit 1; sleep 3; done
COPY backend/ ./
RUN --mount=type=cache,target=/tmp/cache \
    composer install --no-dev --prefer-dist --no-interaction --no-scripts --optimize-autoloader --classmap-authoritative

FROM dunglas/frankenphp:1-php8.4
RUN install-php-extensions pdo_pgsql redis zip pcntl opcache
# Room for the files sent through file fields (see backend/config/formsender.php).
RUN printf 'upload_max_filesize = 10M\npost_max_size = 25M\n' > /usr/local/etc/php/conf.d/uploads.ini

WORKDIR /app
COPY --from=vendor /app /app
RUN mkdir -p storage/app/private storage/app/public storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs bootstrap/cache

COPY docker/prod/Caddyfile /etc/caddy/Caddyfile
COPY docker/prod/entrypoint.sh /usr/local/bin/formsender-entrypoint
RUN chmod +x /usr/local/bin/formsender-entrypoint

ENTRYPOINT ["formsender-entrypoint"]
CMD ["frankenphp", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
