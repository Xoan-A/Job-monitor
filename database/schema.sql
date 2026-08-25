CREATE TABLE IF NOT EXISTS jobs (
    id               BIGSERIAL PRIMARY KEY,
    source           VARCHAR(50)  NOT NULL,
    external_id      VARCHAR(255),
    title            TEXT         NOT NULL,
    company          TEXT,
    location         TEXT,
    description      TEXT,
    url              TEXT,
    published_at     TIMESTAMPTZ,
    scraped_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    employment_type  VARCHAR(50),
    remote_type      VARCHAR(50),
    salary_min       NUMERIC(14, 2),
    salary_max       NUMERIC(14, 2),
    salary_currency  CHAR(3),
    content_hash     CHAR(64),
    -- User workflow state (used by the web frontend)
    user_status      VARCHAR(20)  NOT NULL DEFAULT 'new',
    is_saved         BOOLEAN      NOT NULL DEFAULT FALSE,
    notes            TEXT,
    reviewed_at      TIMESTAMPTZ,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (source, external_id)
);

CREATE TABLE IF NOT EXISTS scrape_runs (
    id             BIGSERIAL PRIMARY KEY,
    source         VARCHAR(50) NOT NULL,
    started_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at    TIMESTAMPTZ,
    status         VARCHAR(20) NOT NULL,
    jobs_found     INTEGER     NOT NULL DEFAULT 0,
    jobs_created   INTEGER     NOT NULL DEFAULT 0,
    error_message  TEXT
);

CREATE INDEX IF NOT EXISTS idx_jobs_published_at     ON jobs (published_at);
CREATE INDEX IF NOT EXISTS idx_jobs_source_external  ON jobs (source, external_id);
CREATE INDEX IF NOT EXISTS idx_jobs_company          ON jobs (company);
CREATE INDEX IF NOT EXISTS idx_scrape_runs_source    ON scrape_runs (source);
CREATE INDEX IF NOT EXISTS idx_scrape_runs_status    ON scrape_runs (status);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_jobs_updated_at ON jobs;
CREATE TRIGGER trg_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
