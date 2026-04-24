CREATE TABLE IF NOT EXISTS `professeurs` (
  `id_professeur` int NOT NULL AUTO_INCREMENT,
  `sourcedId` varchar(100) NOT NULL,
  `nom` varchar(100) DEFAULT NULL,
  `prenom` varchar(100) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `username` varchar(100) DEFAULT NULL,
  `enabled_user` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_professeur`),
  UNIQUE KEY `uq_professeurs_sourcedId` (`sourcedId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

ALTER TABLE `horaires_cours`
  ADD COLUMN IF NOT EXISTS `id_professeur` int DEFAULT NULL,
  ADD KEY `fk_horaires_professeur` (`id_professeur`),
  ADD CONSTRAINT `fk_horaires_professeur`
    FOREIGN KEY (`id_professeur`) REFERENCES `professeurs` (`id_professeur`)
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS `matieres_professeurs` (
  `id_matiere` int NOT NULL,
  `id_professeur` int NOT NULL,
  PRIMARY KEY (`id_matiere`,`id_professeur`),
  KEY `fk_mp_professeur` (`id_professeur`),
  CONSTRAINT `fk_mp_matiere` FOREIGN KEY (`id_matiere`) REFERENCES `matieres` (`id_matiere`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_mp_professeur` FOREIGN KEY (`id_professeur`) REFERENCES `professeurs` (`id_professeur`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET @has_col := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'matieres'
    AND COLUMN_NAME = 'id_professeur'
);

SET @sql := IF(
  @has_col > 0,
  'INSERT IGNORE INTO matieres_professeurs (id_matiere, id_professeur) SELECT id_matiere, id_professeur FROM matieres WHERE id_professeur IS NOT NULL',
  'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
