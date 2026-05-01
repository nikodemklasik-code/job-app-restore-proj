-- User job search preferences (last search query and location)
-- Allows Jobs page to remember user's last search

CREATE TABLE IF NOT EXISTS user_job_preferences (
  user_id VARCHAR(36) PRIMARY KEY,
  last_query VARCHAR(255) DEFAULT '',
  last_location VARCHAR(255) DEFAULT 'United Kingdom',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Index for faster lookups
CREATE INDEX idx_user_job_preferences_user_id ON user_job_preferences(user_id);
