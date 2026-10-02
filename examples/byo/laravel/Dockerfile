# A real Laravel project from `composer create-project` (default SQLite file, no external database).
FROM composer:2 AS build
WORKDIR /work
RUN composer create-project laravel/laravel app --no-interaction --prefer-dist

FROM php:8.4-cli
RUN apt-get update -qq && apt-get install -y -qq unzip git >/dev/null && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /work/app /app
# create-project already wrote .env with an APP_KEY and created database/database.sqlite.
# artisan serve must listen beyond loopback (--host) and on the port TDK assigns.
CMD ["sh", "-c", "php artisan serve --host=0.0.0.0 --port=${PORT:-8000}"]
