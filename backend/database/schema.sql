CREATE TABLE IF NOT EXISTS otp_challenges (
    id BIGSERIAL PRIMARY KEY,
    challenge_hash CHAR(64) NOT NULL UNIQUE,
    email VARCHAR(254) NOT NULL,
    otp_hash CHAR(64) NOT NULL,
    attempts SMALLINT NOT NULL DEFAULT 0 CHECK (attempts >= 0 AND attempts <= 5),
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_challenges_email_created
    ON otp_challenges (email, created_at DESC);

CREATE TABLE IF NOT EXISTS otp_requests (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(254) NOT NULL,
    ip_hash CHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_requests_email_created
    ON otp_requests (email, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_otp_requests_ip_created
    ON otp_requests (ip_hash, created_at DESC);
