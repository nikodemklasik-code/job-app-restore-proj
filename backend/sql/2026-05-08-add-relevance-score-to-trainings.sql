-- Migration: Add relevance_score column to trainings table
-- Date: 2026-05-08
-- Description: Adds relevance_score column for training relevance tracking

-- Check if column exists before adding
SET @dbname = DATABASE();
SET @tablename = 'trainings';
SET @columnname = 'relevance_score';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT ''Column already exists'' AS message;',
  'ALTER TABLE trainings ADD COLUMN relevance_score INT AFTER credential_url;'
));

PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Verify the column was added
SELECT 
  COLUMN_NAME, 
  DATA_TYPE, 
  IS_NULLABLE, 
  COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'trainings'
  AND COLUMN_NAME = 'relevance_score';
