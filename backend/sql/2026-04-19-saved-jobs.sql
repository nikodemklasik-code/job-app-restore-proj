-- Creates saved_jobs table for user job bookmarks.
CREATE TABLE IF NOT EXISTS saved_jobs (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  job_id VARCHAR(36) NOT NULL,
  saved_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY saved_jobs_user_job_uq (user_id, job_id),
  INDEX saved_jobs_user_id_idx (user_id),
  INDEX saved_jobs_job_id_idx (job_id)
);
