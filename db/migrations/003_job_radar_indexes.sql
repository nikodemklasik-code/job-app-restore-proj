BEGIN;

CREATE UNIQUE INDEX ux_job_radar_scans_idempotency_key_user
  ON job_radar_scans (user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX ix_job_radar_scans_status
  ON job_radar_scans (status);

CREATE INDEX ix_job_radar_scans_entity_fingerprint
  ON job_radar_scans (entity_fingerprint);

CREATE INDEX ix_job_radar_scans_source_fingerprint
  ON job_radar_scans (source_fingerprint);

CREATE INDEX ix_job_radar_scans_user_started
  ON job_radar_scans (user_id, started_at DESC);

CREATE INDEX ix_job_radar_sources_scan
  ON job_radar_sources (scan_id);

CREATE INDEX ix_job_radar_sources_cluster
  ON job_radar_sources (source_cluster_id);

CREATE INDEX ix_job_radar_sources_content_hash
  ON job_radar_sources (content_hash);

CREATE INDEX ix_job_radar_sources_parse_status
  ON job_radar_sources (parse_status);

CREATE INDEX ix_job_radar_signals_scan_scope_category
  ON job_radar_signals (scan_id, signal_scope, category);

CREATE INDEX ix_job_radar_signals_signal_key
  ON job_radar_signals (signal_key);

CREATE INDEX ix_job_radar_score_drivers_scan_score
  ON job_radar_score_drivers (scan_id, score_name);

CREATE INDEX ix_job_radar_findings_scan_type
  ON job_radar_findings (scan_id, finding_type);

CREATE INDEX ix_job_radar_reports_status
  ON job_radar_reports (status);

CREATE INDEX ix_job_radar_reports_last_scanned_at
  ON job_radar_reports (last_scanned_at DESC);

COMMIT;
