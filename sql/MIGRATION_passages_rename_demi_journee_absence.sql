-- Migration: renomme passages.demi_journee -> passages.demi_journee_absence
-- et laisse la structure alignée avec etudiants.demi_journee_absence.

SET @old_exists := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'passages'
      AND COLUMN_NAME = 'demi_journee'
);

SET @new_exists := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'passages'
      AND COLUMN_NAME = 'demi_journee_absence'
);

SET @sql := IF(
    @old_exists = 1 AND @new_exists = 0,
    'ALTER TABLE passages CHANGE COLUMN demi_journee demi_journee_absence INT NOT NULL DEFAULT 0',
    'DO 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
