-- JobRadar SQL schema v1 (PostgreSQL-style)
-- For MySQL/Drizzle migrations, translate ENUMs to VARCHAR + CHECK or lookup tables.
-- This file is the logical source of truth for relations and indexes.

-- ---------------------------------------------------------------------------
-- ENUMs
-- ---------------------------------------------------------------------------

CREATE TYPE scan_trigger_enum AS ENUM (
  'saved_job',
  'manual_search',
  'url_input'
);

CREATE TYPE scan_status_enum AS ENUM (
  'processing',
  'partial_report',
  'ready',
  'sources_blocked',
  'scan_failed'
);

CREATE TYPE confidence_enum AS ENUM (
  'low',
  'medium',
  'high'
);

CREATE TYPE recommendation_enum AS ENUM (
  'Strong Match',
  'Good Option',
  'Mixed Signals',
  'High Risk'
);

CREATE TYPE source_type_enum AS ENUM (
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

CREATE TYPE parse_status_enum AS ENUM (
  'pending',
  'parsed',
  'failed',
  'blocked'
);

CREATE TYPE finding_type_enum AS ENUM (
  'positive',
  'warning',
  'red_flag',
  'fit_match',
  'fit_mismatch',
  'benchmark'
);

-- ---------------------------------------------------------------------------
-- Core entities
-- ---------------------------------------------------------------------------

CREATE TABLE employers (
  id UUID PRIMARY KEY,
  canonical_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  website_url TEXT,
  linkedin_url TEXT,
  instagram_url TEXT,
  registry_source TEXT,
  registry_id TEXT,
  industry TEXT,
  size_band TEXT,
  headquarters TEXT,
  founded_year INT,
  company_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX ux_employers_canonical_name ON employers (canonical_name);

CREATE TABLE employer_aliases (
  id UUID PRIMARY KEY,
  employer_id UUID NOT NULL REFERENCES employers(id) ON DELETE CASCADE,
  alias_name TEXT NOT NULL,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_employer_aliases_employer_id ON employer_aliases (employer_id);
CREATE INDEX ix_employer_aliases_alias_name ON employer_aliases (alias_name);

CREATE TABLE job_posts (
  id UUID PRIMARY KEY,
  employer_id UUID REFERENCES employers(id) ON DELETE SET NULL,
  source_url TEXT,
  source_type source_type_enum,
  title TEXT NOT NULL,
  role_family TEXT,
  seniority TEXT,
  location TEXT,
  country TEXT,
  work_mode TEXT,
  employment_type TEXT,
  salary_min NUMERIC(12,2),
  salary_max NUMERIC(12,2),
  salary_period TEXT,
  currency CHAR(3),
  description_raw TEXT,
  posted_at TIMESTAMPTZ,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_job_posts_employer_id ON job_posts (employer_id);
CREATE INDEX ix_job_posts_role_family ON job_posts (role_family);
CREATE INDEX ix_job_posts_location ON job_posts (location);

-- saved_jobs / shortlist — adjust FK to your users table
CREATE TABLE saved_jobs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  job_post_id UUID REFERENCES job_posts(id) ON DELETE SET NULL,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_saved_jobs_user_id ON saved_jobs (user_id);

CREATE TABLE radar_scans (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  employer_id UUID REFERENCES employers(id) ON DELETE SET NULL,
  job_post_id UUID REFERENCES job_posts(id) ON DELETE SET NULL,
  scan_trigger scan_trigger_enum NOT NULL,
  input_query JSONB,
  status scan_status_enum NOT NULL DEFAULT 'processing',
  force_rescan BOOLEAN NOT NULL DEFAULT FALSE,
  quota_cost INT NOT NULL DEFAULT 1,
  -- Dedupe / support: sha256 hex of normalized inputs
  entity_fingerprint TEXT,
  source_fingerprint TEXT,
  idempotency_key TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  failed_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_radar_scans_user_id ON radar_scans (user_id);
CREATE INDEX ix_radar_scans_status ON radar_scans (status);
CREATE INDEX ix_radar_scans_employer_job ON radar_scans (employer_id, job_post_id);
CREATE INDEX ix_radar_scans_entity_fingerprint ON radar_scans (entity_fingerprint);
CREATE INDEX ix_radar_scans_idempotency ON radar_scans (user_id, idempotency_key);

CREATE TABLE collected_sources (
  id UUID PRIMARY KEY,
  scan_id UUID NOT NULL REFERENCES radar_scans(id) ON DELETE CASCADE,
  employer_id UUID REFERENCES employers(id) ON DELETE SET NULL,
  job_post_id UUID REFERENCES job_posts(id) ON DELETE SET NULL,
  source_type source_type_enum NOT NULL,
  source_quality_tier SMALLINT NOT NULL CHECK (source_quality_tier IN (1, 2, 3)),
  source_url TEXT NOT NULL,
  title TEXT,
  published_at TIMESTAMPTZ,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw_content TEXT,
  raw_content_expires_at TIMESTAMPTZ,
  parse_status parse_status_enum NOT NULL DEFAULT 'pending',
  block_reason TEXT,
  content_hash TEXT,
  source_cluster_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX ix_collected_sources_scan_id ON collected_sources (scan_id);
CREATE INDEX ix_collected_sources_employer_id ON collected_sources (employer_id);
CREATE INDEX ix_collected_sources_job_post_id ON collected_sources (job_post_id);
CREATE INDEX ix_collected_sources_parse_status ON collected_sources (parse_status);
CREATE INDEX ix_collected_sources_cluster ON collected_sources (source_cluster_id);

CREATE TABLE extracted_signals (
  id UUID PRIMARY KEY,
  scan_id UUID NOT NULL REFERENCES radar_scans(id) ON DELETE CASCADE,
  employer_id UUID REFERENCES employers(id) ON DELETE CASCADE,
  job_post_id UUID REFERENCES job_posts(id) ON DELETE CASCADE,
  source_id UUID REFERENCES collected_sources(id) ON DELETE SET NULL,
  signal_scope TEXT NOT NULL CHECK (signal_scope IN ('employer', 'offer', 'benchmark', 'fit', 'risk')),
  category TEXT NOT NULL,
  signal_key TEXT NOT NULL,
  signal_value_text TEXT,
  signal_value_number NUMERIC(12,4),
  signal_value_json JSONB,
  confidence confidence_enum NOT NULL,
  is_missing_data BOOLEAN NOT NULL DEFAULT FALSE,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_extracted_signals_scan_id ON extracted_signals (scan_id);
CREATE INDEX ix_extracted_signals_scope_category ON extracted_signals (signal_scope, category);
CREATE INDEX ix_extracted_signals_signal_key ON extracted_signals (signal_key);

CREATE TABLE market_benchmarks (
  id UUID PRIMARY KEY,
  role_family TEXT NOT NULL,
  seniority TEXT,
  location TEXT NOT NULL,
  country TEXT,
  currency CHAR(3) NOT NULL,
  benchmark_period TEXT NOT NULL,
  sample_size INT NOT NULL,
  salary_p25 NUMERIC(12,2),
  salary_median NUMERIC(12,2),
  salary_p75 NUMERIC(12,2),
  source_mix JSONB NOT NULL DEFAULT '[]'::jsonb,
  normalization_version TEXT NOT NULL,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_market_benchmarks_lookup ON market_benchmarks (role_family, seniority, location, currency);

CREATE TABLE radar_scores (
  id UUID PRIMARY KEY,
  scan_id UUID NOT NULL UNIQUE REFERENCES radar_scans(id) ON DELETE CASCADE,
  employer_score SMALLINT NOT NULL CHECK (employer_score BETWEEN 0 AND 100),
  offer_score SMALLINT NOT NULL CHECK (offer_score BETWEEN 0 AND 100),
  market_pay_score SMALLINT NOT NULL CHECK (market_pay_score BETWEEN 0 AND 100),
  benefits_score SMALLINT NOT NULL CHECK (benefits_score BETWEEN 0 AND 100),
  culture_fit_score SMALLINT NOT NULL CHECK (culture_fit_score BETWEEN 0 AND 100),
  risk_score SMALLINT NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
  recommendation recommendation_enum NOT NULL,
  confidence_overall confidence_enum NOT NULL,
  scoring_version TEXT NOT NULL DEFAULT 'v1.1.0',
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE score_drivers (
  id UUID PRIMARY KEY,
  scan_id UUID NOT NULL REFERENCES radar_scans(id) ON DELETE CASCADE,
  score_name TEXT NOT NULL,
  driver_type TEXT NOT NULL CHECK (driver_type IN ('positive', 'negative', 'neutral')),
  label TEXT NOT NULL,
  impact INT NOT NULL,
  confidence confidence_enum NOT NULL,
  source_id UUID REFERENCES collected_sources(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_score_drivers_scan_id ON score_drivers (scan_id);
CREATE INDEX ix_score_drivers_score_name ON score_drivers (score_name);

CREATE TABLE radar_findings (
  id UUID PRIMARY KEY,
  scan_id UUID NOT NULL REFERENCES radar_scans(id) ON DELETE CASCADE,
  finding_type finding_type_enum NOT NULL,
  code TEXT,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  severity TEXT NOT NULL,
  confidence confidence_enum NOT NULL,
  source_id UUID REFERENCES collected_sources(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_radar_findings_scan_id ON radar_findings (scan_id);
CREATE INDEX ix_radar_findings_finding_type ON radar_findings (finding_type);

CREATE TABLE radar_reports (
  id UUID PRIMARY KEY,
  scan_id UUID NOT NULL UNIQUE REFERENCES radar_scans(id) ON DELETE CASCADE,
  freshness_hours INT NOT NULL DEFAULT 0,
  freshness_status TEXT NOT NULL CHECK (freshness_status IN ('fresh', 'acceptable', 'stale')),
  last_scanned_at TIMESTAMPTZ NOT NULL,
  auto_rescan_eligible BOOLEAN NOT NULL DEFAULT FALSE,
  confidence_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  missing_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  next_best_action JSONB,
  benchmark_provenance JSONB,
  override_audit JSONB,
  parser_version TEXT,
  resolver_version TEXT,
  summary_json JSONB NOT NULL,
  details_json JSONB NOT NULL,
  sources_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Optional: user preferences for fit (if not already in app profile)
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  salary_min_expected NUMERIC(12,2),
  salary_max_expected NUMERIC(12,2),
  currency CHAR(3),
  preferred_locations JSONB,
  preferred_work_modes JSONB,
  preferred_company_types JSONB,
  priorities_json JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
