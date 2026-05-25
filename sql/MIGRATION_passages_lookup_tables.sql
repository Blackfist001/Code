START TRANSACTION;

CREATE TABLE IF NOT EXISTS `types_passage` (
  `id_type_passage` int NOT NULL AUTO_INCREMENT,
  `code` varchar(64) NOT NULL,
  `legacy_value` varchar(100) DEFAULT NULL,
  `label` varchar(100) NOT NULL,
  `is_system` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int NOT NULL DEFAULT 0,
  PRIMARY KEY (`id_type_passage`),
  UNIQUE KEY `uq_types_passage_code` (`code`),
  UNIQUE KEY `uq_types_passage_legacy_value` (`legacy_value`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `statuts_passage` (
  `id_statut_passage` int NOT NULL AUTO_INCREMENT,
  `code` varchar(64) NOT NULL,
  `legacy_value` varchar(100) DEFAULT NULL,
  `label` varchar(100) NOT NULL,
  `is_system` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int NOT NULL DEFAULT 0,
  PRIMARY KEY (`id_statut_passage`),
  UNIQUE KEY `uq_statuts_passage_code` (`code`),
  UNIQUE KEY `uq_statuts_passage_legacy_value` (`legacy_value`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `raisons_passage` (
  `id_raison_passage` int NOT NULL AUTO_INCREMENT,
  `code` varchar(64) NOT NULL,
  `legacy_value` varchar(100) DEFAULT NULL,
  `label` varchar(100) NOT NULL,
  `is_system` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int NOT NULL DEFAULT 0,
  PRIMARY KEY (`id_raison_passage`),
  UNIQUE KEY `uq_raisons_passage_code` (`code`),
  UNIQUE KEY `uq_raisons_passage_legacy_value` (`legacy_value`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `types_passage` (`code`, `legacy_value`, `label`, `is_system`, `sort_order`)
VALUES
  ('aucun', 'Aucun', 'Aucun', 1, 10),
  ('entree_matin', 'Entrée matin', 'Entrée matin', 1, 20),
  ('sortie_midi', 'Sortie midi', 'Sortie midi', 1, 30),
  ('rentree_midi', 'Rentrée midi', 'Rentrée midi', 1, 40),
  ('entree_apres_midi', 'Entrée après-midi', 'Entrée après-midi', 1, 50),
  ('sortie_autorisee', 'Sortie autorisée', 'Sortie autorisée', 1, 60),
  ('journee', 'Journée', 'Journée', 1, 70)
ON DUPLICATE KEY UPDATE `label` = VALUES(`label`), `sort_order` = VALUES(`sort_order`);

INSERT INTO `statuts_passage` (`code`, `legacy_value`, `label`, `is_system`, `sort_order`)
VALUES
  ('autorise', 'Autorisé', 'Autorisé', 1, 10),
  ('refuse', 'Refusé', 'Refusé', 1, 20),
  ('absence_justifiee', 'Absence justifiée', 'Absence justifiée', 1, 30),
  ('sortie_justifiee', 'Sortie justifiée', 'Sortie justifiée', 1, 40),
  ('absent', 'Absent', 'Absent', 1, 50),
  ('en_retard', 'En retard', 'En retard', 1, 60),
  ('present', 'Présent', 'Présent', 1, 70)
ON DUPLICATE KEY UPDATE `label` = VALUES(`label`), `sort_order` = VALUES(`sort_order`);

INSERT INTO `raisons_passage` (`code`, `legacy_value`, `label`, `is_system`, `sort_order`)
VALUES
  ('certificat_medical', 'Certificat médical', 'Certificat médical', 1, 10),
  ('autorisation_parents', 'Autorisation  des parents', 'Autorisation  des parents', 1, 20),
  ('autre', 'Autre', 'Autre', 1, 30)
ON DUPLICATE KEY UPDATE `label` = VALUES(`label`), `sort_order` = VALUES(`sort_order`);

ALTER TABLE `passages`
  MODIFY `type_passage` varchar(100) DEFAULT NULL,
  MODIFY `statut` varchar(100) DEFAULT NULL;

SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'passages'
    AND COLUMN_NAME = 'raison'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE `passages` ADD COLUMN `raison` varchar(100) DEFAULT NULL AFTER `statut`',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE `passages`
  MODIFY `raison` varchar(100) DEFAULT NULL;

SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'passages'
    AND COLUMN_NAME = 'id_type_passage'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE `passages` ADD COLUMN `id_type_passage` int DEFAULT NULL AFTER `type_passage`',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'passages'
    AND COLUMN_NAME = 'id_statut_passage'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE `passages` ADD COLUMN `id_statut_passage` int DEFAULT NULL AFTER `statut`',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'passages'
    AND COLUMN_NAME = 'id_raison_passage'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE `passages` ADD COLUMN `id_raison_passage` int DEFAULT NULL AFTER `raison`',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE `passages` p
LEFT JOIN `types_passage` tp ON tp.`legacy_value` = p.`type_passage` OR tp.`label` = p.`type_passage`
SET p.`id_type_passage` = tp.`id_type_passage`,
    p.`type_passage` = COALESCE(tp.`label`, p.`type_passage`)
WHERE p.`type_passage` IS NOT NULL;

UPDATE `passages` p
LEFT JOIN `statuts_passage` sp ON sp.`legacy_value` = p.`statut` OR sp.`label` = p.`statut`
SET p.`id_statut_passage` = sp.`id_statut_passage`,
    p.`statut` = COALESCE(sp.`label`, p.`statut`)
WHERE p.`statut` IS NOT NULL;

UPDATE `passages` p
LEFT JOIN `raisons_passage` rp ON rp.`legacy_value` = p.`raison` OR rp.`label` = p.`raison`
SET p.`id_raison_passage` = rp.`id_raison_passage`,
    p.`raison` = COALESCE(rp.`label`, p.`raison`)
WHERE p.`raison` IS NOT NULL;

SET @idx_exists := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'passages'
    AND INDEX_NAME = 'fk_passages_type_idx'
);
SET @sql := IF(@idx_exists = 0,
  'ALTER TABLE `passages` ADD KEY `fk_passages_type_idx` (`id_type_passage`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'passages'
    AND INDEX_NAME = 'fk_passages_statut_idx'
);
SET @sql := IF(@idx_exists = 0,
  'ALTER TABLE `passages` ADD KEY `fk_passages_statut_idx` (`id_statut_passage`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'passages'
    AND INDEX_NAME = 'fk_passages_raison_idx'
);
SET @sql := IF(@idx_exists = 0,
  'ALTER TABLE `passages` ADD KEY `fk_passages_raison_idx` (`id_raison_passage`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_exists := (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'passages'
    AND CONSTRAINT_NAME = 'fk_passages_type'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql := IF(@fk_exists = 0,
  'ALTER TABLE `passages` ADD CONSTRAINT `fk_passages_type` FOREIGN KEY (`id_type_passage`) REFERENCES `types_passage` (`id_type_passage`) ON UPDATE RESTRICT ON DELETE RESTRICT',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_exists := (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'passages'
    AND CONSTRAINT_NAME = 'fk_passages_statut'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql := IF(@fk_exists = 0,
  'ALTER TABLE `passages` ADD CONSTRAINT `fk_passages_statut` FOREIGN KEY (`id_statut_passage`) REFERENCES `statuts_passage` (`id_statut_passage`) ON UPDATE RESTRICT ON DELETE RESTRICT',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_exists := (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'passages'
    AND CONSTRAINT_NAME = 'fk_passages_raison'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql := IF(@fk_exists = 0,
  'ALTER TABLE `passages` ADD CONSTRAINT `fk_passages_raison` FOREIGN KEY (`id_raison_passage`) REFERENCES `raisons_passage` (`id_raison_passage`) ON UPDATE RESTRICT ON DELETE RESTRICT',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

DROP TRIGGER IF EXISTS `trg_passages_before_insert_lookup`;
DROP TRIGGER IF EXISTS `trg_passages_before_update_lookup`;

SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'passages'
    AND COLUMN_NAME = 'type_passage'
);
SET @sql := IF(@col_exists = 1,
  'ALTER TABLE `passages` DROP COLUMN `type_passage`',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'passages'
    AND COLUMN_NAME = 'statut'
);
SET @sql := IF(@col_exists = 1,
  'ALTER TABLE `passages` DROP COLUMN `statut`',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'passages'
    AND COLUMN_NAME = 'raison'
);
SET @sql := IF(@col_exists = 1,
  'ALTER TABLE `passages` DROP COLUMN `raison`',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

COMMIT;
