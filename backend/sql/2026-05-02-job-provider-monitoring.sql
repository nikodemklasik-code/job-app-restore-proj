-- Job Provider Monitoring Table
-- Tracks provider health, structure changes, and parsing success rates
-- Run: mysql -u multivohub -p multivohub_jobapp < backend/sql/2026-05-02-job-provider-monitoring.sql

CREATE TABLE IF NOT EXISTS job_provider_logs (
  id VARCHAR(36) PRIMARY KEY,
  provider VARCHAR(50) NOT NULL,
  event_type VARCHAR(50) NOT NULL, -- 'search_success', 'search_failure', 'structure_change', 'parsing_error'
  query VARCHAR(255),
  location VARCHAR(255),
  jobs_found INT DEFAULT 0,
  parsing_method VARCHAR(50), -- 'next_data_json', 'structured_data', 'html_regex', 'api'
  error_message TEXT,
  response_time_ms INT,
  http_status INT,
  metadata JSON, -- Additional context (e.g., HTML structure samples, error details)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_provider_created (provider, created_at),
  INDEX idx_event_type (event_type),
  INDEX idx_provider_event (provider, event_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Provider health summary view
CREATE OR REPLACE VIEW job_provider_health AS
SELECT 
  provider,
  DATE(created_at) as date,
  COUNT(*) as total_searches,
  SUM(CASE WHEN event_type = 'search_success' THEN 1 ELSE 0 END) as successful_searches,
  SUM(CASE WHEN event_type = 'search_failure' THEN 1 ELSE 0 END) as failed_searches,
  SUM(CASE WHEN event_type = 'structure_change' THEN 1 ELSE 0 END) as structure_changes,
  AVG(jobs_found) as avg_jobs_found,
  AVG(response_time_ms) as avg_response_time_ms,
  ROUND(100.0 * SUM(CASE WHEN event_type = 'search_success' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate_pct
FROM job_provider_logs
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY provider, DATE(created_at)
ORDER BY date DESC, provider;

-- Recent structure changes alert
CREATE OR REPLACE VIEW job_provider_structure_changes AS
SELECT 
  provider,
  event_type,
  parsing_method,
  error_message,
  metadata,
  created_at
FROM job_provider_logs
WHERE event_type IN ('structure_change', 'parsing_error')
  AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
ORDER BY created_at DESC;
