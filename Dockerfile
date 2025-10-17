
FROM php:8.3-apache

RUN apt-get update && apt-get install -y libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql

WORKDIR /var/www/html

COPY . /var/www/html/

RUN rm -rf /var/www/html/index.html && \
    echo '<VirtualHost *:80>\n\
    DocumentRoot /var/www/html/public\n\
    <Directory /var/www/html/public>\n\
    AllowOverride All\n\
    Require all granted\n\
    </Directory>\n\
    </VirtualHost>' > /etc/apache2/sites-available/000-default.conf


RUN chown -R www-data:www-data /var/www/html
RUN a2enmod rewrite

EXPOSE 80

