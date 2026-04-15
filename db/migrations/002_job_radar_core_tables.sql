BEGIN;

CREATE TABLE job_radar_scans (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  employer_id UUID NULL,
  job_post_id UUID NULL,
  scan_trigger job_radar_scan_trigger NOT NULL,
  status job_radar_scan_status NOT NULL DEFAULT 'processing',

  idempotency_key UUID NULL,
  entity_fingerprint TEXT NOT NULL,
  source_fingerprint TEXT NULL,

  input_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  progress JSONB NOT NULL DEFAULT '{
    "employer_scan":"pending",
    "offer_parse":"pending",
    "benchmark":"pending",
    "reviews":"pending",
    "scoring":"pending",
    "report_compose":"pending"
  }'::jsonb,

  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ NULL,
  failed_reason TEXT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_job_radar_scan_progress_is_object
    CHECK (jsonb_typeof(progress) = 'object')
);

CREATE TABLE job_radar_reports (
  id UUID PRIMARY KEY,
  scan_id UUID NOT NULL UNIQUE REFERENCES job_radar_scans(id) ON DELETE CASCADE,

  status job_radar_scan_status NOT NULL,
  scoring_version TEXT NOT NULL,
  parser_version TEXT NOT NULL,
  normalization_version TEXT NOT NULL,
  resolver_version TEXT NOT NULL,

  freshness_status job_radar_freshness_status NOT NULL DEFAULT 'fresh',
  freshness_hours NUMERIC(10,2) NOT NULL DEFAULT 0,
  last_scanned_at TIMESTAMPTZ NOT NULL,
  auto_rescan_eligible BOOLEAN NOT NULL DEFAULT FALSE,
  rescan_recommended BOOLEAN NOT NULL DEFAULT FALSE,

  confidence_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  missing_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  key_findings JSONB NOT NULL DEFAULT '[]'::jsonb,
  red_flags JSONB NOT NULL DEFAULT '[]'::jsonb,
  next_best_action JSONB NULL,
  benchmark_provenance JSONB NULL,

  override_applied BOOLEAN NOT NULL DEFAULT FALSE,
  override_id TEXT NULL,
  override_reason TEXT NULL,
  override_confidence job_radar_confidence NULL,
  override_ceiling job_radar_recommendation NULL,

  summary_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  details_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  sources_json JSONB NOT NULL DEFAULT '[]'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_job_radar_reports_confidence_is_object
    CHECK (jsonb_typeof(confidence_summary) = 'object'),
  CONSTRAINT chk_job_radar_reports_missing_data_is_array
    CHECK (jsonb_typeof(missing_data) = 'array'),
  CONSTRAINT chk_job_radar_reports_sources_is_array
    CHECK (jsonb_typeof(sources_json) = 'array')
);

CREATE TABLE job_radar_scores (
  id UUID PRIMARY KEY,
  scan_id UUID NOT NULL UNIQUE REFERENCES job_radar_scans(id) ON DELETE CASCADE,

  employer_score SMALLINT NOT NULL CHECK (employer_score BETWEEN 0 AND 100),
  offer_score SMALLINT NOT NULL CHECK (offer_score BETWEEN 0 AND 100),
  market_pay_score SMALLINT NOT NULL CHECK (market_pay_score BETWEEN 0 AND 100),
  benefits_score SMALLINT NOT NULL CHECK (benefits_score BETWEEN 0 AND 100),
  culture_fit_score SMALLINT NOT NULL CHECK (culture_fit_score BETWEEN 0 AND 100),
  risk_score SMALLINT NOT NULL CHECK (risk_score BETWEEN 0 AND 100),

  recommendation job_radar_recommendation NOT NULL,
  confidence_overall job_radar_confidence NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE job_radar_sources (
  id UUID PRIMARY KEY,
  scan_id UUID NOT NULL REFERENCES job_radar_scans(id) ON DELETE CASCADE,
  employer_id UUID NULL,
  job_post_id UUID NULL,

  source_type job_radar_source_type NOT NULL,
  source_quality_tier SMALLINT NOT NULL CHECK (source_quality_tier IN (1,2,3)),
  source_url TEXT NOT NULL,
  normalized_url TEXT NULL,
  canonical_url TEXT NULL,

  title TEXT NULL,
  source_cluster_id TEXT NULL,
  content_hash TEXT NULL,

  published_at TIMESTAMPTZ NULL,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw_content TEXT NULL,
  raw_content_expires_at TIMESTAMPTZ NULL,
  parse_status job_radar_parse_status NOT NULL DEFAULT 'pending',
  block_reason TEXT NULL,

  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_job_radar_sources_metadata_is_object
    CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE TABLE job_radar_signals (
  id UUID PRIMARY KEY,
  scan_id UUID NOT NULL REFERENCES job_radar_scans(id) ON DELETE CASCADE,
  source_id UUID NULL REFERENCES job_radar_sources(id) ON DELETE SET NULL,
  employer_id UUID NULL,
  job_post_id UUID NULL,

  signal_scope TEXT NOT NULL CHECK (signal_scope IN ('employer','offer','benchmark','fit','risk')),
  category TEXT NOT NULL,
  signal_key TEXT NOT NULL,

  signal_value_text TEXT NULL,
  signal_value_number NUMERIC(14,4) NULL,
  signal_value_json JSONB NULL,

  confidence job_radar_confidence NOT NULL,
  source_quality_tier SMALLINT NULL CHECK (source_quality_tier IN (1,2,3)),
  source_cluster_id TEXT NULL,

  is_missing_data BOOLEAN NOT NULL DEFAULT FALSE,
  is_conflicted BOOLEAN NOT NULL DEFAULT FALSE,
  conflict_reason TEXT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE job_radar_score_drivers (
  id UUID PRIMARY KEY,
  scan_id UUID NOT NULL REFERENCES job_radar_scans(id) ON DELETE CASCADE,
  score_name TEXT NOT NULL,
  driver_type job_radar_driver_type NOT NULL,
  label TEXT NOT NULL,
  impact INTEGER NOT NULL,
  confidence job_radar_confidence NOT NULL,
  source_id UUID NULL REFERENCES job_radar_sources(id) ON DELETE SET NULL,
  source_ref TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE job_radar_findings (
  id UUID PRIMARY KEY,
  scan_id UUID NOT NULL REFERENCES job_radar_scans(id) ON DELETE CASCADE,
  finding_type job_radar_finding_type NOT NULL,
  code TEXT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low','medium','high','severe')),
  confidence job_radar_confidence NOT NULL,
  source_id UUID NULL REFERENCES job_radar_sources(id) ON DELETE SET NULL,
  source_ref TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE job_radar_benchmarks (
  id UUID PRIMARY KEY,
  scan_id UUID NOT NULL REFERENCES job_radar_scans(id) ON DELETE CASCADE,
  role_family TEXT NOT NULL,
  seniority TEXT NULL,
  location TEXT NOT NULL,
  country TEXT NULL,
  currency CHAR(3) NOT NULL,

  benchmark_region TEXT NOT NULL,
  benchmark_period TEXT NOT NULL,
  sample_size INTEGER NOT NULL CHECK (sample_size >= 0),
  source_mix JSONB NOT NULL DEFAULT '[]'::jsonb,
  normalization_version TEXT NOT NULL,

  salary_p25 NUMERIC(12,2) NULL,
  salary_median NUMERIC(12,2) NULL,
  salary_p75 NUMERIC(12,2) NULL,

  confidence job_radar_confidence NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_job_radar_benchmarks_source_mix_is_array
    CHECK (jsonb_typeof(source_mix) = 'array')
);

COMMIT;
