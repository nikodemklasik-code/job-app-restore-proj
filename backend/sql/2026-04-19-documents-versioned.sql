-- Creates documents table for versioned content editing (CV drafts, cover letters, etc).
-- Separate from document_uploads (file upload/AI extraction).
CREATE TABLE IF NOT EXISTS documents (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(32) NOT NULL,
  parent_document_id VARCHAR(36) NULL,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX documents_user_id_idx (user_id),
  INDEX documents_parent_idx (parent_document_id),
  INDEX documents_type_idx (type),
  INDEX documents_updated_at_idx (updated_at)
);
