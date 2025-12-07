FROM php:8.3-fpm

RUN apt-get update && apt-get install -y libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql \
    && pecl install redis \
    && docker-php-ext-enable redis

WORKDIR /var/www/html

COPY ./src /var/www/html

EXPOSE 9000
