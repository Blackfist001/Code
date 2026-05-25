-- Persistance DB des audits (logins + changements)

CREATE TABLE IF NOT EXISTS `audit_logins` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user` VARCHAR(100) NOT NULL,
  `ip` VARCHAR(45) NOT NULL DEFAULT '0.0.0.0',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_logins_created_at` (`created_at`),
  KEY `idx_audit_logins_user_created_at` (`user`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `audit_db_changes` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user` VARCHAR(100) NOT NULL,
  `ip` VARCHAR(45) NOT NULL DEFAULT '0.0.0.0',
  `action` VARCHAR(32) NOT NULL,
  `entity` VARCHAR(128) NOT NULL,
  `old_data` JSON DEFAULT NULL,
  `new_data` JSON DEFAULT NULL,
  `meta` JSON DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_db_changes_created_at` (`created_at`),
  KEY `idx_audit_db_changes_entity_action_created_at` (`entity`, `action`, `created_at`),
  KEY `idx_audit_db_changes_user_created_at` (`user`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
