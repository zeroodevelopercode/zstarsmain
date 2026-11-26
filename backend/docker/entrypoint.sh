#!/bin/sh
set -eu
PORT="${PORT:-8080}"
sed -ri "s/Listen [0-9]+/Listen ${PORT}/" /etc/apache2/ports.conf
sed -ri "s/<VirtualHost \\*:[0-9]+>/<VirtualHost *:${PORT}>/" /etc/apache2/sites-available/000-default.conf

# Apply idempotent schema changes before accepting HTTP traffic.
php /var/www/html/database/migrate.php

exec apache2-foreground
