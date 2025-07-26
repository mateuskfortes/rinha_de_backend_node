-- ENUM create
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'process_type') THEN
        CREATE TYPE process_type AS ENUM ('default', 'fallback');
    END IF;
END$$;

-- Table create
CREATE TABLE IF NOT EXISTS transactions (
    correlationId UUID PRIMARY KEY,
    amount NUMERIC(10, 2) NOT NULL,
    requestedAt TIMESTAMPTZ NOT NULL,
    type process_type NOT NULL
);
