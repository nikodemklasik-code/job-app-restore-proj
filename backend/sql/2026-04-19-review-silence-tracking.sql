-- Review silence tracking: adds silence_days and last_followed_up_at to applications.
-- Idempotent — safe to re-run.

SET @has_silence_days := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'applications'
    AND COLUMN_NAME = 'silence_days'
);
SET @sql_silence_days := IF(
  @has_silence_days = 0,
  'ALTER TABLE applications ADD COLUMN silence_days INT NOT NULL DEFAULT 0',
  'SELECT 1'
);
PREPARE stmt1 FROM @sql_silence_days;
EXECUTE stmt1;
DEALLOCATE PREPARE stmt1;

SET @has_last_followed_up_at := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'applications'
    AND COLUMN_NAME = 'last_followed_up_at'
);
SET @sql_last_followed_up_at := IF(
  @has_last_followed_up_at = 0,
  'ALTER TABLE applications ADD COLUMN last_followed_up_at TIMESTAMP NULL DEFAULT NULL',
  'SELECT 1'
);
PREPARE stmt2 FROM @sql_last_followed_up_at;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

SET @has_silence_days_idx := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'applications'
    AND INDEX_NAME = 'applications_silence_days_idx'
);
SET @sql_silence_days_idx := IF(
  @has_silence_days_idx = 0,
  'ALTER TABLE applications ADD INDEX applications_silence_days_idx (silence_days)',
  'SELECT 1'
);
PREPARE stmt3 FROM @sql_silence_days_idx;
EXECUTE stmt3;
DEALLOCATE PREPARE stmt3;
