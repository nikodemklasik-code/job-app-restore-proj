-- ATS-Optimized Documents Phase 1: Job Analysis & Matching
-- Adds fields to support job description analysis and profile matching

ALTER TABLE applications 
ADD COLUMN job_description LONGTEXT AFTER company,
ADD COLUMN metadata JSON AFTER notes,
ADD COLUMN ats_score INT DEFAULT NULL AFTER fit_score,
ADD COLUMN keyword_coverage INT DEFAULT NULL AFTER ats_score;

-- Add index for faster queries
CREATE INDEX idx_applications_ats_score ON applications(ats_score);
CREATE INDEX idx_applications_keyword_coverage ON applications(keyword_coverage);

-- Add column for storing experience achievements (if not already present)
ALTER TABLE experiences 
ADD COLUMN achievements JSON DEFAULT NULL AFTER description;

-- Add column for storing training/certification data
ALTER TABLE trainings 
ADD COLUMN relevance_score INT DEFAULT NULL AFTER provider;

-- Verify migration
SELECT 'ATS-Optimized Documents Phase 1 migration completed' AS status;
