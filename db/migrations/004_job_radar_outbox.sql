BEGIN;

CREATE TABLE job_radar_outbox (
  id UUID PRIMARY KEY,
  aggregate_type TEXT NOT NULL,
  aggregate_id UUID NOT NULL,
  event_name TEXT NOT NULL,
  event_version TEXT NOT NULL DEFAULT '1.0',
  payload JSONB NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ NULL,
  delivery_attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT NULL,

  CONSTRAINT chk_job_radar_outbox_payload_is_object
    CHECK (jsonb_typeof(payload) = 'object')
);

CREATE INDEX ix_job_radar_outbox_unpublished
  ON job_radar_outbox (published_at, occurred_at)
  WHERE published_at IS NULL;

CREATE INDEX ix_job_radar_outbox_aggregate
  ON job_radar_outbox (aggregate_type, aggregate_id);

COMMIT;
