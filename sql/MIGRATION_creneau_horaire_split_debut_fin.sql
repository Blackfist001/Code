USE sortie_ecole;

START TRANSACTION;

-- 1) Renommer l'ancienne table en table de debut si elle existe encore.
SET @has_old := (
    SELECT COUNT(*)
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'creneau_horaire'
);
SET @sql := IF(
    @has_old > 0,
    'RENAME TABLE creneau_horaire TO creneau_horaire_debut',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2) Creer la table de debut si absente.
CREATE TABLE IF NOT EXISTS creneau_horaire_debut (
    id_creneau_debut INT NOT NULL AUTO_INCREMENT,
    creneau TIME DEFAULT '00:00:00',
    PRIMARY KEY (id_creneau_debut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3) Creer la table de fin si absente.
CREATE TABLE IF NOT EXISTS creneau_horaire_fin (
    id_creneau_fin INT NOT NULL AUTO_INCREMENT,
    creneau TIME DEFAULT '00:00:00',
    PRIMARY KEY (id_creneau_fin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4) Initialiser creneau_horaire_fin a partir de creneau_horaire_debut si vide.
INSERT INTO creneau_horaire_fin (id_creneau_fin, creneau)
SELECT d.id_creneau_debut, d.creneau
FROM creneau_horaire_debut d
LEFT JOIN creneau_horaire_fin f ON f.id_creneau_fin = d.id_creneau_debut
WHERE f.id_creneau_fin IS NULL;

-- 5) Rebaser l'AUTO_INCREMENT de la table fin.
SET @next_ai := (SELECT COALESCE(MAX(id_creneau_fin), 0) + 1 FROM creneau_horaire_fin);
SET @sql := CONCAT('ALTER TABLE creneau_horaire_fin AUTO_INCREMENT = ', @next_ai);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 6) Recreer les contraintes FK de horaires_cours vers debut/fin.
SET @has_fk_debut := (
    SELECT COUNT(*)
    FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND CONSTRAINT_NAME = 'fk_horaires_creneau_debut'
);
SET @sql := IF(
    @has_fk_debut > 0,
    'ALTER TABLE horaires_cours DROP FOREIGN KEY fk_horaires_creneau_debut',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_fk_fin := (
    SELECT COUNT(*)
    FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND CONSTRAINT_NAME = 'fk_horaires_creneau_fin'
);
SET @sql := IF(
    @has_fk_fin > 0,
    'ALTER TABLE horaires_cours DROP FOREIGN KEY fk_horaires_creneau_fin',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE horaires_cours
    ADD CONSTRAINT fk_horaires_creneau_debut FOREIGN KEY (id_creneau_debut) REFERENCES creneau_horaire_debut(id_creneau_debut),
    ADD CONSTRAINT fk_horaires_creneau_fin FOREIGN KEY (id_creneau_fin) REFERENCES creneau_horaire_fin(id_creneau_fin);

COMMIT;
