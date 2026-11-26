FROM php:8.3-apache

RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq-dev \
    && docker-php-ext-install pdo_pgsql \
    && a2enmod rewrite \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
COPY composer.json ./
RUN composer install --no-dev --no-interaction --prefer-dist --no-progress --optimize-autoloader

COPY public ./public
COPY database ./database
COPY docker/entrypoint.sh /usr/local/bin/zstars-entrypoint
RUN chmod +x /usr/local/bin/zstars-entrypoint \
    && chown -R www-data:www-data /var/www/html

RUN sed -ri 's!/var/www/html!/var/www/html/public!g' /etc/apache2/sites-available/000-default.conf \
    && printf '<Directory /var/www/html/public>\\n    AllowOverride All\\n    Require all granted\\n</Directory>\\n' >> /etc/apache2/apache2.conf

EXPOSE 8080
ENTRYPOINT ["zstars-entrypoint"]
