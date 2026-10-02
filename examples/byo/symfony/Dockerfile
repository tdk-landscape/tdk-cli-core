# A real Symfony skeleton (`composer create-project symfony/skeleton`) plus one controller file.
FROM composer:2 AS build
WORKDIR /work
RUN composer create-project symfony/skeleton app --no-interaction --prefer-dist
COPY HealthController.php /work/app/src/Controller/HealthController.php

FROM php:8.4-cli
RUN apt-get update -qq && apt-get install -y -qq unzip git >/dev/null && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /work/app /app
# PHP's built-in server: listen beyond loopback and on the port TDK assigns. For local use only.
CMD ["sh", "-c", "php -S 0.0.0.0:${PORT:-8000} -t public"]
