USE sortie_ecole;

-- Migration: horaires_cours.local (texte) -> horaires_cours.id_local (FK vers locaux.id_local)
-- Important: faire une sauvegarde avant execution en production.

START TRANSACTION;

-- 1) Ajouter la nouvelle colonne id_local si absente.
SET @has_id_local := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'horaires_cours'
      AND COLUMN_NAME = 'id_local'
);

SET @sql := IF(
    @has_id_local = 0,
    'ALTER TABLE horaires_cours ADD COLUMN id_local INT NULL',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2) Creer les locaux manquants a partir des valeurs texte existantes.
INSERT INTO locaux (local)
SELECT DISTINCT TRIM(hc.local)
FROM horaires_cours hc
LEFT JOIN locaux l ON l.local = TRIM(hc.local)
WHERE hc.local IS NOT NULL
  AND TRIM(hc.local) <> ''
  AND l.id_local IS NULL;

-- 3) Mapper les anciennes valeurs texte vers id_local.
UPDATE horaires_cours hc
LEFT JOIN locaux l ON l.local = TRIM(hc.local)
SET hc.id_local = l.id_local
WHERE hc.local IS NOT NULL
  AND TRIM(hc.local) <> '';

-- 4) Verifier s'il reste des lignes non mappees.
--    Si cette requete retourne des lignes, corriger les valeurs locales avant de continuer.
SELECT hc.id, hc.local
FROM horaires_cours hc
WHERE hc.local IS NOT NULL
  AND TRIM(hc.local) <> ''
  AND hc.id_local IS NULL;

-- 5) Ajouter l'index sur id_local si absent.
SET @has_idx_id_local := (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'horaires_cours'
      AND INDEX_NAME = 'idx_horaires_id_local'
);

SET @sql := IF(
    @has_idx_id_local = 0,
    'ALTER TABLE horaires_cours ADD INDEX idx_horaires_id_local (id_local)',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 6) Ajouter la contrainte FK si absente.
SET @has_fk_id_local := (
    SELECT COUNT(*)
    FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'horaires_cours'
      AND CONSTRAINT_NAME = 'fk_horaires_id_local'
);

SET @sql := IF(
    @has_fk_id_local = 0,
    'ALTER TABLE horaires_cours ADD CONSTRAINT fk_horaires_id_local FOREIGN KEY (id_local) REFERENCES locaux(id_local) ON UPDATE CASCADE ON DELETE SET NULL',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 7) Supprimer l'ancienne colonne texte local si elle existe.
SET @has_col_local := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'horaires_cours'
      AND COLUMN_NAME = 'local'
);

SET @sql := IF(
    @has_col_local = 1,
    'ALTER TABLE horaires_cours DROP COLUMN local',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

COMMIT;
