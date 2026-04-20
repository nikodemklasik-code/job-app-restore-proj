-- ─────────────────────────────────────────────────────────────────
-- MultivoHub v2 — New Tables Migration
-- Run on VPS: mysql -u root -p multivohub < scripts/migrate-v2-new-tables.sql
-- ─────────────────────────────────────────────────────────────────

-- Document Lab (AI-extracted text only, no binary files)
CREATE TABLE IF NOT EXISTS document_uploads (
  id              VARCHAR(36)   PRIMARY KEY,
  user_id         VARCHAR(36)   NOT NULL,
  document_type   VARCHAR(50)   NOT NULL,
  -- Types: cv | cover_letter | certificate | education | portfolio | session_memory | other
  original_filename VARCHAR(255) NOT NULL,
  extracted_text_encrypted TEXT,          -- AES-256 encrypted plain text from document
  parsed_structure     JSON,              -- structured data: skills, dates, employers
  auto_filled_fields   JSON,              -- which profile fields were auto-populated
  session_context VARCHAR(50),            -- for session_memory: coach|interview|negotiation
  is_processed    BOOLEAN       NOT NULL DEFAULT FALSE,
  processing_error VARCHAR(500),
  created_at      TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP     NOT NULL DEFAULT NOW() ON UPDATE NOW(),
  INDEX idx_document_uploads_user (user_id),
  INDEX idx_document_uploads_type (document_type)
);

-- Career Goals & Dashboard preferences
CREATE TABLE IF NOT EXISTS career_goals (
  id                    VARCHAR(36) PRIMARY KEY,
  user_id               VARCHAR(36) NOT NULL UNIQUE,
  current_job_title     VARCHAR(255),
  current_salary        INT,                       -- annual GBP
  target_job_title      VARCHAR(255),
  target_salary         INT,                       -- annual GBP
  target_salary_min     INT NULL,
  target_salary_max     INT NULL,
  target_seniority      VARCHAR(80) NULL,
  work_values           TEXT,                      -- "remote, growth, stability"
  auto_apply_min_score  INT         NOT NULL DEFAULT 75,  -- 50–100%
  strategy_json         JSON NULL,
  created_at            TIMESTAMP   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMP   NOT NULL DEFAULT NOW() ON UPDATE NOW(),
  INDEX idx_career_goals_user (user_id)
);

CREATE TABLE IF NOT EXISTS user_preference_flags (
  user_id                        VARCHAR(36)  NOT NULL PRIMARY KEY,
  case_study_opt_in              BOOLEAN        NOT NULL DEFAULT FALSE,
  community_visibility           BOOLEAN        NOT NULL DEFAULT FALSE,
  referral_participation         BOOLEAN        NOT NULL DEFAULT TRUE,
  shared_sessions_discoverable   BOOLEAN        NOT NULL DEFAULT FALSE,
  ai_personalization_enabled     BOOLEAN        NOT NULL DEFAULT TRUE,
  created_at                     TIMESTAMP      NOT NULL DEFAULT NOW(),
  updated_at                     TIMESTAMP      NOT NULL DEFAULT NOW() ON UPDATE NOW()
);

-- Social media scan consents
CREATE TABLE IF NOT EXISTS social_consents (
  id                    VARCHAR(36)  PRIMARY KEY,
  user_id               VARCHAR(36)  NOT NULL UNIQUE,
  linkedin_consent      BOOLEAN      NOT NULL DEFAULT FALSE,
  facebook_consent      BOOLEAN      NOT NULL DEFAULT FALSE,
  instagram_consent     BOOLEAN      NOT NULL DEFAULT FALSE,
  linkedin_granted_at   TIMESTAMP    NULL,
  facebook_granted_at   TIMESTAMP    NULL,
  instagram_granted_at  TIMESTAMP    NULL,
  created_at            TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMP    NOT NULL DEFAULT NOW() ON UPDATE NOW()
);

-- Employer analysis cache
CREATE TABLE IF NOT EXISTS employer_analysis (
  id              VARCHAR(36)  PRIMARY KEY,
  job_id          VARCHAR(36)  NOT NULL UNIQUE,
  company_name    VARCHAR(255) NOT NULL,
  stability_score INT,          -- 1–5
  culture_score   INT,          -- 1–5
  growth_score    INT,          -- 1–5
  overall_score   INT,          -- 1–5
  summary         TEXT,
  sources         JSON,
  created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP    NOT NULL DEFAULT NOW() ON UPDATE NOW(),
  INDEX idx_employer_analysis_company (company_name)
);

-- Referral program
CREATE TABLE IF NOT EXISTS referrals (
  id               VARCHAR(36)  PRIMARY KEY,
  referrer_id      VARCHAR(36)  NOT NULL,
  referred_user_id VARCHAR(36)  NULL,
  referral_code    VARCHAR(20)  NOT NULL UNIQUE,
  status           VARCHAR(30)  NOT NULL DEFAULT 'pending',
  -- pending | signed_up | converted | rewarded
  reward_granted_at TIMESTAMP   NULL,
  created_at        TIMESTAMP   NOT NULL DEFAULT NOW(),
  INDEX idx_referrals_referrer (referrer_id),
  INDEX idx_referrals_code (referral_code)
);

-- Test / demo accounts registry
CREATE TABLE IF NOT EXISTS test_accounts (
  id          VARCHAR(36)   PRIMARY KEY,
  user_id     VARCHAR(36)   NOT NULL UNIQUE,
  label       VARCHAR(100)  NOT NULL,
  is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
  created_by  VARCHAR(100)  NOT NULL DEFAULT 'admin',
  created_at  TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────
-- SEED: Anonymous Test Account
-- User: Alex Morgan | test@multivohub.com | plan: autopilot (unlimited)
-- ─────────────────────────────────────────────────────────────────

INSERT IGNORE INTO users (id, clerk_id, email, created_at, updated_at, retention_exempt)
VALUES (
  'test-user-alex-morgan-001',
  'test_clerk_alex_morgan_001',
  'test@multivohub.com',
  NOW(), NOW(),
  TRUE   -- exempt from data retention / deletion
);

INSERT IGNORE INTO profiles (id, user_id, full_name, summary, created_at, updated_at)
VALUES (
  'test-profile-alex-morgan-001',
  'test-user-alex-morgan-001',
  'Alex Morgan',
  'Anonymous test account for QA and demo purposes.',
  NOW(), NOW()
);

-- Unlimited autopilot subscription
INSERT IGNORE INTO subscriptions (id, user_id, plan, status, credits, created_at, updated_at)
VALUES (
  'test-sub-alex-morgan-001',
  'test-user-alex-morgan-001',
  'autopilot',   -- highest tier
  'active',
  999999,        -- effectively unlimited credits
  NOW(), NOW()
);

-- Career goals seed
INSERT IGNORE INTO career_goals (id, user_id, target_job_title, target_salary, auto_apply_min_score, created_at, updated_at)
VALUES (
  'test-goals-alex-morgan-001',
  'test-user-alex-morgan-001',
  'Senior Product Manager',
  85000,
  70,
  NOW(), NOW()
);

-- Register as test account
INSERT IGNORE INTO test_accounts (id, user_id, label, created_by, created_at)
VALUES (
  'test-account-alex-morgan-001',
  'test-user-alex-morgan-001',
  'QA Tester — Alex Morgan',
  'admin',
  NOW()
);

SELECT 'Migration v2 complete.' AS status;
SELECT 'Test account: Alex Morgan (test@multivohub.com) — autopilot plan, 999999 credits' AS info;
