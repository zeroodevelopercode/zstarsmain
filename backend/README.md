# Zstars PHP OTP API

PHP 8.3 + Apache + PostgreSQL + Gmail API (HTTPS). The frontend calls this API through
`VITE_API_BASE_URL` (for example, `https://your-api-host.example.com`).

## Endpoints

- `GET /health` — process/database health check.
- `POST /auth/send-otp` — send a six-digit code to a Gmail address.
- `POST /auth/verify-otp` — verify a challenge and consume it.

OTP lifetime: 5 minutes. Maximum attempts: 5. Resend cooldown: 60 seconds.
Limits: 5 requests per email/hour and 10 requests per source IP/hour.

## Required environment variables

- `APP_ORIGIN`: exact HTTPS origin of the deployed frontend, no trailing slash.
- `DATABASE_URL`: PostgreSQL connection URL. Require TLS in production.
- `OTP_PEPPER`: long, random, private secret used to HMAC challenge IDs, OTPs,
  and source IP identifiers.
- `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`: OAuth
  credentials for the sender account `zeroodevelopercode@gmail.com`. Grant only
  the `https://www.googleapis.com/auth/gmail.send` scope. Store secrets only
  in the backend hosting dashboard. Never commit them.

Gmail API is called over HTTPS, so this backend does not require outbound SMTP.

## Database setup

The container runs the idempotent database migration at startup. Keep PostgreSQL
private and require TLS connections. Back up the database according to the
hosting provider's retention policy.

## Deploy with Docker

Build this directory as the Docker context. The container listens on the
platform-provided `PORT` (default 8080). Configure all required environment
variables.

## Frontend

Set the Vite build variable:

```env
VITE_API_BASE_URL=https://YOUR-API-HOST
```

Then rebuild/redeploy the Vite frontend. The value is public and must contain
only the API origin, never secrets.

## Security notes

- Only `gmail.com` addresses are accepted by this first flow.
- OTPs are generated with `random_int`, HMAC-hashed at rest, expire in five
  minutes, and are consumed after one successful verification.
- The API never returns the OTP or OAuth error details.
- Prepared SQL statements, exact-origin CORS, JSON-only requests, request-size
  limits, per-email/IP rate limits, and TLS HTTPS API requests are enforced.
- The server does not trust client-supplied forwarding headers for IP limiting.
- This API verifies an email address; it does not yet create a durable Zstars
  account or authenticated login session.
