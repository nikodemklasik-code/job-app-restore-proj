BEGIN;

CREATE TABLE job_radar_maintenance_runs (
  id UUID PRIMARY KEY,
  job_name TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ NULL,
  status TEXT NOT NULL CHECK (status IN ('processing','ready','failed')),
  details JSONB NOT NULL DEFAULT '{}'::jsonb
);

COMMIT;
