<?php
declare(strict_types=1);

use PHPMailer\PHPMailer\PHPMailer;

require dirname(__DIR__) . '/vendor/autoload.php';

date_default_timezone_set('UTC');

function envValue(string $key): string {
    $value = getenv($key);
    return $value === false ? '' : trim($value);
}

function respond(int $status, array $payload, array $headers = []): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, max-age=0');
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: no-referrer');
    foreach ($headers as $name => $value) {
        header($name . ': ' . $value);
    }
    echo json_encode($payload, JSON_UNESCAPED_SLASHES);
    exit;
}

function database(): PDO {
    static $pdo = null;
    if ($pdo instanceof PDO) return $pdo;

    $url = envValue('DATABASE_URL');
    if ($url === '') throw new RuntimeException('Database is not configured.');

    $parts = parse_url($url);
    if (!is_array($parts) || empty($parts['host']) || empty($parts['path'])) {
        throw new RuntimeException('Invalid database configuration.');
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

    $pdo = new PDO($dsn, rawurldecode($parts['user'] ?? ''), rawurldecode($parts['pass'] ?? ''), [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
        PDO::ATTR_TIMEOUT => 5,
    ]);
    return $pdo;
}

function requestBody(): array {
    $length = (int)($_SERVER['CONTENT_LENGTH'] ?? 0);
    if ($length > 4096) respond(413, ['ok' => false, 'message' => 'Request terlalu besar.']);
    $type = strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0]));
    if ($type !== 'application/json') respond(415, ['ok' => false, 'message' => 'Content-Type harus application/json.']);
    $raw = file_get_contents('php://input', false, null, 0, 4097);
    if (strlen($raw) > 4096) respond(413, ['ok' => false, 'message' => 'Request terlalu besar.']);
    $data = json_decode($raw ?: '', true);
    if (!is_array($data)) respond(400, ['ok' => false, 'message' => 'Format request tidak valid.']);
    return $data;
}

function gmailApiRequest(string $url, array $headers, ?string $body = null): array {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_POST => $body !== null,
        CURLOPT_POSTFIELDS => $body,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 20,
    ]);
    $response = curl_exec($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);
    if ($response === false || $status < 200 || $status >= 300) {
        error_log('Zstars Gmail API request failed. HTTP ' . $status . ($curlError !== '' ? ' transport-error' : ''));
        throw new RuntimeException('Email delivery is temporarily unavailable.');
    }
    $decoded = json_decode((string)$response, true);
    return is_array($decoded) ? $decoded : [];
}

function sendOtpEmail(string $email, string $otp): void {
    $clientId = envValue('GMAIL_CLIENT_ID');
    $clientSecret = envValue('GMAIL_CLIENT_SECRET');
    $refreshToken = envValue('GMAIL_REFRESH_TOKEN');
    $from = 'zeroodevelopercode@gmail.com';
    if ($clientId === '' || $clientSecret === '' || $refreshToken === '') {
        throw new RuntimeException('Gmail API is not configured.');
    }

    $token = gmailApiRequest('https://oauth2.googleapis.com/token', [
        'Content-Type: application/x-www-form-urlencoded',
        'Accept: application/json',
    ], http_build_query([
        'client_id' => $clientId,
        'client_secret' => $clientSecret,
        'refresh_token' => $refreshToken,
        'grant_type' => 'refresh_token',
    ], '', '&', PHP_QUERY_RFC3986));

    $accessToken = (string)($token['access_token'] ?? '');
    if ($accessToken === '') throw new RuntimeException('Gmail access token unavailable.');

    $safeOtp = htmlspecialchars($otp, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $html = '<div style="font-family:Arial,sans-serif;background:#080808;color:#f5f5f5;padding:32px;border-radius:16px;max-width:480px;margin:auto">'
        . '<p style="letter-spacing:3px;color:#999;font-size:11px">ZSTARS ACCOUNT</p>'
        . '<h1 style="font-size:24px;font-weight:500">Your verification code</h1>'
        . '<p style="color:#aaa">Use this one-time code to verify your email address.</p>'
        . '<div style="font-size:36px;letter-spacing:10px;font-weight:700;padding:20px 0">' . $safeOtp . '</div>'
        . '<p style="color:#999;font-size:12px">This code expires in 5 minutes. If you did not request it, you can ignore this email.</p>'
        . '</div>';
    $plain = "Your Zstars verification code is {$otp}. It expires in 5 minutes. If you did not request it, ignore this email.";
    $boundary = 'zstars_' . bin2hex(random_bytes(12));
    $subject = 'Your Zstars verification code';
    $mime = "From: Zstars <{$from}>\r\n"
        . "To: {$email}\r\n"
        . "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=\r\n"
        . "MIME-Version: 1.0\r\n"
        . "Content-Type: multipart/alternative; boundary=\"{$boundary}\"\r\n\r\n"
        . "--{$boundary}\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n"
        . chunk_split(base64_encode($plain))
        . "--{$boundary}\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n"
        . chunk_split(base64_encode($html))
        . "--{$boundary}--";
    $raw = rtrim(strtr(base64_encode($mime), '+/', '-_'), '=');

    gmailApiRequest('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', [
        'Authorization: Bearer ' . $accessToken,
        'Content-Type: application/json',
        'Accept: application/json',
    ], json_encode(['raw' => $raw], JSON_UNESCAPED_SLASHES));
}

function ensureConfig(): void {
    foreach (['APP_ORIGIN', 'DATABASE_URL', 'OTP_PEPPER', 'GMAIL_CLIENT_ID', 'GMAIL_CLIENT_SECRET', 'GMAIL_REFRESH_TOKEN'] as $key) {
        if (envValue($key) === '') throw new RuntimeException('Service configuration incomplete.');
    }
    if (strlen(envValue('OTP_PEPPER')) < 32) throw new RuntimeException('OTP secret is too short.');
}

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = array_values(array_filter(array_map(
    static fn(string $value): string => rtrim(trim($value), '/'),
    explode(',', envValue('APP_ORIGIN'))
)));
$originAllowed = $origin !== '' && in_array(rtrim($origin, '/'), $allowedOrigins, true);

if ($originAllowed) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Max-Age: 600');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    if (!$originAllowed) {
        respond(403, ['ok' => false, 'message' => 'Origin tidak diizinkan.']);
    }
    http_response_code(204);
    exit;
}

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET' && $path === '/health') {
    try {
        database()->query('SELECT 1');
        respond(200, ['ok' => true, 'service' => 'zstars-auth']);
    } catch (Throwable $error) {
        respond(503, ['ok' => false, 'message' => 'Service unavailable.']);
    }
}

if (!$originAllowed) {
    respond(403, ['ok' => false, 'message' => 'Origin tidak diizinkan.']);
}

if ($method !== 'POST' || !in_array($path, ['/auth/send-otp', '/auth/verify-otp'], true)) {
    respond(404, ['ok' => false, 'message' => 'Endpoint tidak ditemukan.']);
}

try {
    ensureConfig();
    $data = requestBody();
    $pdo = database();
    $pepper = envValue('OTP_PEPPER');

    if ($path === '/auth/send-otp') {
        $email = strtolower(trim((string)($data['email'] ?? '')));
        if (strlen($email) > 254 || !filter_var($email, FILTER_VALIDATE_EMAIL)
            || !preg_match('/^[a-z0-9._%+-]+@gmail\.com$/D', $email)) {
            respond(422, ['ok' => false, 'message' => 'Masukkan alamat Gmail yang valid.']);
        }

        // The hosting proxy appends the connecting client address to X-Forwarded-For.
        $forwarded = array_filter(array_map('trim', explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '')));
        $candidateIp = $forwarded ? end($forwarded) : ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
        $ip = filter_var($candidateIp, FILTER_VALIDATE_IP) ? $candidateIp : ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
        $ipHash = hash_hmac('sha256', $ip, $pepper);

        $pdo->beginTransaction();
        $lock = $pdo->prepare('SELECT pg_advisory_xact_lock(hashtext(:email))');
        $lock->execute(['email' => $email]);
        $ipLock = $pdo->prepare('SELECT pg_advisory_xact_lock(hashtext(:ip))');
        $ipLock->execute(['ip' => $ipHash]);

        $emailCount = $pdo->prepare("SELECT COUNT(*) FROM otp_requests WHERE email = :email AND created_at > NOW() - INTERVAL '1 hour'");
        $emailCount->execute(['email' => $email]);
        $ipCount = $pdo->prepare("SELECT COUNT(*) FROM otp_requests WHERE ip_hash = :ip AND created_at > NOW() - INTERVAL '1 hour'");
        $ipCount->execute(['ip' => $ipHash]);
        $lastRequest = $pdo->prepare('SELECT created_at FROM otp_requests WHERE email = :email ORDER BY id DESC LIMIT 1');
        $lastRequest->execute(['email' => $email]);
        $last = $lastRequest->fetchColumn();

        if ((int)$emailCount->fetchColumn() >= 5 || (int)$ipCount->fetchColumn() >= 10) {
            $pdo->rollBack();
            respond(429, ['ok' => false, 'message' => 'Terlalu banyak permintaan. Coba lagi nanti.'], ['Retry-After' => '3600']);
        }
        if ($last !== false && (time() - strtotime((string)$last)) < 60) {
            $pdo->rollBack();
            respond(429, ['ok' => false, 'message' => 'Tunggu sebentar sebelum meminta kode baru.'], ['Retry-After' => '60']);
        }

        $otp = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $challengeId = bin2hex(random_bytes(32));
        $challengeHash = hash_hmac('sha256', $challengeId, $pepper);
        $otpHash = hash_hmac('sha256', $challengeId . ':' . $otp, $pepper);

        try {
            sendOtpEmail($email, $otp);
        } catch (Throwable $mailError) {
            $pdo->rollBack();
            error_log('Zstars OTP email delivery failed.');
            respond(503, ['ok' => false, 'message' => 'Email belum bisa dikirim. Coba lagi nanti.']);
        }

        $invalidateOld = $pdo->prepare('UPDATE otp_challenges SET consumed_at = NOW() WHERE email = :email AND consumed_at IS NULL');
        $invalidateOld->execute(['email' => $email]);
        $insertChallenge = $pdo->prepare(
            'INSERT INTO otp_challenges (challenge_hash, email, otp_hash, expires_at) VALUES (:challenge, :email, :otp, NOW() + INTERVAL \'5 minutes\')'
        );
        $insertChallenge->execute(['challenge' => $challengeHash, 'email' => $email, 'otp' => $otpHash]);
        $insertRequest = $pdo->prepare('INSERT INTO otp_requests (email, ip_hash) VALUES (:email, :ip)');
        $insertRequest->execute(['email' => $email, 'ip' => $ipHash]);
        $pdo->commit();

        respond(202, [
            'ok' => true,
            'challengeId' => $challengeId,
            'message' => 'Jika alamat memenuhi syarat, kode verifikasi akan segera dikirim.',
        ]);
    }

    $challengeId = strtolower(trim((string)($data['challengeId'] ?? '')));
    $otp = trim((string)($data['otp'] ?? ''));
    if (!preg_match('/^[a-f0-9]{64}$/D', $challengeId) || !preg_match('/^[0-9]{6}$/D', $otp)) {
        respond(422, ['ok' => false, 'message' => 'Kode verifikasi tidak valid.']);
    }

    $challengeHash = hash_hmac('sha256', $challengeId, $pepper);
    $pdo->beginTransaction();
    $select = $pdo->prepare('SELECT id, email, otp_hash, attempts, expires_at, consumed_at FROM otp_challenges WHERE challenge_hash = :challenge FOR UPDATE');
    $select->execute(['challenge' => $challengeHash]);
    $challenge = $select->fetch();

    if (!$challenge || $challenge['consumed_at'] !== null || strtotime($challenge['expires_at']) <= time() || (int)$challenge['attempts'] >= 5) {
        $pdo->rollBack();
        respond(400, ['ok' => false, 'message' => 'Kode salah atau sudah kedaluwarsa. Minta kode baru.']);
    }

    $expected = hash_hmac('sha256', $challengeId . ':' . $otp, $pepper);
    if (!hash_equals((string)$challenge['otp_hash'], $expected)) {
        $increment = $pdo->prepare('UPDATE otp_challenges SET attempts = attempts + 1 WHERE id = :id');
        $increment->execute(['id' => $challenge['id']]);
        $pdo->commit();
        respond(400, ['ok' => false, 'message' => 'Kode salah atau sudah kedaluwarsa.']);
    }

    $consume = $pdo->prepare('UPDATE otp_challenges SET consumed_at = NOW() WHERE id = :id AND consumed_at IS NULL');
    $consume->execute(['id' => $challenge['id']]);
    $pdo->commit();

    respond(200, ['ok' => true, 'verified' => true, 'email' => $challenge['email']]);
} catch (Throwable $error) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    error_log('Zstars auth API internal error.');
    respond(500, ['ok' => false, 'message' => 'Terjadi kesalahan server. Coba lagi nanti.']);
}
