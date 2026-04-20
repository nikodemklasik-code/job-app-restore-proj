-- Optional: posted ledger + pending charges (MultivoHub MySQL).
-- Run once on the target database before using billing.getLedger / billing.getPendingSpend.

CREATE TABLE IF NOT EXISTS `billing_ledger` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `direction` VARCHAR(16) NOT NULL,
  `category` VARCHAR(32) NOT NULL,
  `description` VARCHAR(255) NOT NULL,
  `currency` VARCHAR(3) NOT NULL DEFAULT 'GBP',
  `amount_cents` INT NOT NULL,
  `unit_price` DECIMAL(10,2) NULL,
  `quantity` INT NULL,
  `source_type` VARCHAR(64) NULL,
  `source_id` VARCHAR(36) NULL,
  `occurred_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `billing_ledger_user_occurred_idx` (`user_id`, `occurred_at`),
  KEY `billing_ledger_user_direction_idx` (`user_id`, `direction`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `pending_charges` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `category` VARCHAR(32) NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'queued',
  `description` VARCHAR(255) NOT NULL,
  `currency` VARCHAR(3) NOT NULL DEFAULT 'GBP',
  `amount_cents` INT NOT NULL,
  `source_type` VARCHAR(64) NULL,
  `source_id` VARCHAR(36) NULL,
  `expected_commit_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `pending_charges_user_status_idx` (`user_id`, `status`),
  KEY `pending_charges_user_created_idx` (`user_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
