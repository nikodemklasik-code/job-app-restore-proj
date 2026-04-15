-- JobRadar: PostgreSQL enums (v1)
-- Run order: 001 → 005

BEGIN;

CREATE TYPE job_radar_scan_trigger AS ENUM (
  'saved_job',
  'manual_search',
  'url_input'
);

CREATE TYPE job_radar_scan_status AS ENUM (
  'processing',
  'partial_report',
  'ready',
  'sources_blocked',
  'scan_failed'
);

CREATE TYPE job_radar_stage_state AS ENUM (
  'pending',
  'processing',
  'done',
  'partial',
  'failed',
  'skipped',
  'blocked'
);

CREATE TYPE job_radar_confidence AS ENUM (
  'low',
  'medium',
  'high'
);

CREATE TYPE job_radar_recommendation AS ENUM (
  'Strong Match',
  'Good Option',
  'Mixed Signals',
  'High Risk'
);

CREATE TYPE job_radar_source_type AS ENUM (
  'official_website',
  'careers_page',
  'linkedin',
  'instagram',
  'registry',
  'job_board',
  'salary_aggregator',
  'review_site',
  'forum',
  'other'
);

CREATE TYPE job_radar_parse_status AS ENUM (
  'pending',
  'parsed',
  'failed',
  'blocked'
);

CREATE TYPE job_radar_finding_type AS ENUM (
  'positive',
  'warning',
  'red_flag',
  'fit_match',
  'fit_mismatch',
  'benchmark'
);

CREATE TYPE job_radar_driver_type AS ENUM (
  'positive',
  'negative',
  'neutral'
);

CREATE TYPE job_radar_freshness_status AS ENUM (
  'fresh',
  'acceptable',
  'stale'
);

COMMIT;
