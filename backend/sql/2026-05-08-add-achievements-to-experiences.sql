-- Migration: Add achievements column to experiences table
-- Date: 2026-05-08
-- Description: Adds JSON column for storing achievements array in experiences

-- Check if column exists before adding
SET @dbname = DATABASE();
SET @tablename = 'experiences';
SET @columnname = 'achievements';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT ''Column already exists'' AS message;',
  'ALTER TABLE experiences ADD COLUMN achievements JSON AFTER description;'
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
  AND TABLE_NAME = 'experiences'
  AND COLUMN_NAME = 'achievements';
