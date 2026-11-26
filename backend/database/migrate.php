<?php
declare(strict_types=1);

// Idempotent startup migration. Runs inside the private Railway service.
$url = getenv('DATABASE_URL') ?: '';
if ($url === '') {
    fwrite(STDERR, "DATABASE_URL is not configured.\n");
    exit(1);
}

$parts = parse_url($url);
if (!is_array($parts) || empty($parts['host']) || empty($parts['path'])) {
    fwrite(STDERR, "DATABASE_URL is invalid.\n");
    exit(1);
}

$query = [];
parse_str($parts['query'] ?? '', $query);
$sslmode = $query['sslmode'] ?? 'require';
$dsn = sprintf(
    'pgsql:host=%s;port=%d;dbname=%s;sslmode=%s',
    $parts['host'],
    $parts['port'] ?? 5432,
    ltrim($parts['path'], '/'),
    $sslmode
);

try {
    $pdo = new PDO(
        $dsn,
        rawurldecode($parts['user'] ?? ''),
        rawurldecode($parts['pass'] ?? ''),
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT => 10,
        ]
    );

    $sql = file_get_contents(__DIR__ . '/schema.sql');
    if ($sql === false || trim($sql) === '') {
        throw new RuntimeException('Migration SQL is missing or empty.');
    }

    $pdo->beginTransaction();
    $pdo->query('SELECT pg_advisory_xact_lock(781234560)');
    $pdo->exec($sql);
    $pdo->commit();
    fwrite(STDOUT, "Database schema is ready.\n");
} catch (Throwable $error) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    // Do not print connection strings, credentials, or raw database errors.
    fwrite(STDERR, "Database migration failed. Check Railway service logs.\n");
    exit(1);
}
