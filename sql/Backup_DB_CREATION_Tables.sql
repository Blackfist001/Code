-- --------------------------------------------------------
-- Hôte:                         127.0.0.1
-- Version du serveur:           8.4.3 - MySQL Community Server - GPL
-- SE du serveur:                Win64
-- HeidiSQL Version:             12.8.0.6908
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Listage de la structure de la base pour sortie_ecole
CREATE DATABASE IF NOT EXISTS `sortie_ecole` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `sortie_ecole`;

-- Listage de la structure de table sortie_ecole. audit_db_changes
CREATE TABLE IF NOT EXISTS `audit_db_changes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user` varchar(100) NOT NULL,
  `ip` varchar(45) NOT NULL DEFAULT '0.0.0.0',
  `action` varchar(32) NOT NULL,
  `entity` varchar(128) NOT NULL,
  `old_data` json DEFAULT NULL,
  `new_data` json DEFAULT NULL,
  `meta` json DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_db_changes_created_at` (`created_at`),
  KEY `idx_audit_db_changes_entity_action_created_at` (`entity`,`action`,`created_at`),
  KEY `idx_audit_db_changes_user_created_at` (`user`,`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table sortie_ecole. audit_logins
CREATE TABLE IF NOT EXISTS `audit_logins` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user` varchar(100) NOT NULL,
  `ip` varchar(45) NOT NULL DEFAULT '0.0.0.0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_logins_created_at` (`created_at`),
  KEY `idx_audit_logins_user_created_at` (`user`,`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table sortie_ecole. classes
CREATE TABLE IF NOT EXISTS `classes` (
  `id_classe` int NOT NULL AUTO_INCREMENT,
  `classe` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`id_classe`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table sortie_ecole. creneau_horaire_debut
CREATE TABLE IF NOT EXISTS `creneau_horaire_debut` (
  `id_creneau_debut` int NOT NULL AUTO_INCREMENT,
  `creneau` time DEFAULT '00:00:00',
  PRIMARY KEY (`id_creneau_debut`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table sortie_ecole. creneau_horaire_fin
CREATE TABLE IF NOT EXISTS `creneau_horaire_fin` (
  `id_creneau_fin` int NOT NULL AUTO_INCREMENT,
  `creneau` time DEFAULT '00:00:00',
  PRIMARY KEY (`id_creneau_fin`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table sortie_ecole. etudiants
CREATE TABLE IF NOT EXISTS `etudiants` (
  `id_etudiant` int NOT NULL AUTO_INCREMENT,
  `sourcedId` varchar(100) DEFAULT NULL,
  `internnummer` varchar(20) DEFAULT NULL,
  `stamboeknummer` varchar(30) DEFAULT NULL,
  `referenceIdentifier` varchar(100) DEFAULT NULL,
  `gebruikersnaam` varchar(100) DEFAULT NULL,
  `geslacht` char(1) DEFAULT NULL,
  `emailadres` varchar(255) DEFAULT NULL,
  `nom` varchar(100) DEFAULT NULL,
  `prenom` varchar(100) DEFAULT NULL,
  `classe` int DEFAULT NULL,
  `photo` varchar(255) DEFAULT NULL,
  `date_naissance` date DEFAULT NULL,
  `autorisation_midi` tinyint(1) DEFAULT '0',
  `demi_journee_absence` int DEFAULT '0',
  PRIMARY KEY (`id_etudiant`),
  UNIQUE KEY `sourcedId` (`sourcedId`),
  KEY `classe_fk` (`classe`),
  CONSTRAINT `classe_fk` FOREIGN KEY (`classe`) REFERENCES `classes` (`id_classe`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table sortie_ecole. horaires_cours
CREATE TABLE IF NOT EXISTS `horaires_cours` (
  `id` int NOT NULL AUTO_INCREMENT,
  `jour_semaine` varchar(10) NOT NULL,
  `id_local` int DEFAULT NULL,
  `id_matiere` int DEFAULT NULL,
  `id_classe` int DEFAULT NULL,
  `id_creneau_debut` int DEFAULT NULL,
  `id_creneau_fin` int DEFAULT NULL,
  `id_professeur` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_horaires_classe` (`id_classe`),
  KEY `fk_horaires_matiere` (`id_matiere`),
  KEY `fk_horaires_creneau_debut` (`id_creneau_debut`),
  KEY `fk_horaires_professeur` (`id_professeur`),
  KEY `id_creneau_fins` (`id_creneau_fin`) USING BTREE,
  KEY `id_local` (`id_local`),
  CONSTRAINT `fk_horaires_classe` FOREIGN KEY (`id_classe`) REFERENCES `classes` (`id_classe`),
  CONSTRAINT `fk_horaires_creneau_debut` FOREIGN KEY (`id_creneau_debut`) REFERENCES `creneau_horaire_debut` (`id_creneau_debut`),
  CONSTRAINT `fk_horaires_creneau_fin` FOREIGN KEY (`id_creneau_fin`) REFERENCES `creneau_horaire_fin` (`id_creneau_fin`),
  CONSTRAINT `fk_horaires_local` FOREIGN KEY (`id_local`) REFERENCES `locaux` (`id_local`),
  CONSTRAINT `fk_horaires_matiere` FOREIGN KEY (`id_matiere`) REFERENCES `matieres` (`id_matiere`),
  CONSTRAINT `fk_horaires_professeur` FOREIGN KEY (`id_professeur`) REFERENCES `professeurs` (`id_professeur`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=235 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table sortie_ecole. locaux
CREATE TABLE IF NOT EXISTS `locaux` (
  `id_local` int NOT NULL AUTO_INCREMENT,
  `local` varchar(10) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id_local`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table sortie_ecole. logs_sync
CREATE TABLE IF NOT EXISTS `logs_sync` (
  `id_log` int NOT NULL AUTO_INCREMENT,
  `date_sync` datetime DEFAULT NULL,
  `source` varchar(100) DEFAULT NULL,
  `statut` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id_log`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de l'évènement sortie_ecole. mark_absence_afternoon_halfday
DELIMITER //
CREATE EVENT `mark_absence_afternoon_halfday` ON SCHEDULE EVERY 5 MINUTE STARTS '2026-05-11 09:46:26' ON COMPLETION NOT PRESERVE ENABLE DO BEGIN
    DECLARE jour_fr VARCHAR(16);
    SET jour_fr = CASE DAYOFWEEK(CURDATE())
        WHEN 1 THEN 'dimanche'
        WHEN 2 THEN 'lundi'
        WHEN 3 THEN 'mardi'
        WHEN 4 THEN 'mercredi'
        WHEN 5 THEN 'jeudi'
        WHEN 6 THEN 'vendredi'
        WHEN 7 THEN 'samedi'
    END;
    IF DAYOFWEEK(CURDATE()) BETWEEN 2 AND 6 THEN
        UPDATE passages p
        JOIN etudiants e ON e.id_etudiant = p.id_etudiant
        SET p.demi_journee_absence = 2
        WHERE p.date_passage = CURDATE()
          AND p.type_passage = 'Journée'
          AND p.statut = 'Absent'
          AND p.demi_journee_absence = 1
          AND EXISTS (
                SELECT 1
                FROM horaires_cours hc
                JOIN creneau_horaire ch ON ch.id_creneau = hc.id_creneau_debut
                WHERE hc.id_classe = e.classe
                  AND LOWER(hc.jour_semaine) = jour_fr
                  AND ch.creneau >= '12:00:00'
                ORDER BY ch.creneau
                LIMIT 1 OFFSET 2
          )
          AND TIME(NOW()) >= (
                SELECT ch.creneau
                FROM horaires_cours hc
                JOIN creneau_horaire ch ON ch.id_creneau = hc.id_creneau_debut
                WHERE hc.id_classe = e.classe
                  AND LOWER(hc.jour_semaine) = jour_fr
                  AND ch.creneau >= '12:00:00'
                ORDER BY ch.creneau
                LIMIT 1 OFFSET 2
          )
          AND NOT EXISTS (
                SELECT 1
                FROM passages px
                WHERE px.id_etudiant = p.id_etudiant
                  AND px.date_passage = CURDATE()
                  AND px.id_passage <> p.id_passage
                  AND px.statut NOT IN ('Absent', 'Absence justifiée')
          );
    END IF;
END//
DELIMITER ;

-- Listage de la structure de l'évènement sortie_ecole. mark_absence_morning_halfday
DELIMITER //
CREATE EVENT `mark_absence_morning_halfday` ON SCHEDULE EVERY 5 MINUTE STARTS '2026-05-11 09:46:26' ON COMPLETION NOT PRESERVE ENABLE DO BEGIN
    DECLARE jour_fr VARCHAR(16);
    SET jour_fr = CASE DAYOFWEEK(CURDATE())
        WHEN 1 THEN 'dimanche'
        WHEN 2 THEN 'lundi'
        WHEN 3 THEN 'mardi'
        WHEN 4 THEN 'mercredi'
        WHEN 5 THEN 'jeudi'
        WHEN 6 THEN 'vendredi'
        WHEN 7 THEN 'samedi'
    END;
    IF DAYOFWEEK(CURDATE()) BETWEEN 2 AND 6 THEN
        INSERT INTO passages (
            id_etudiant,
            date_passage,
            heure_passage,
            type_passage,
            statut,
            scan,
            manualEncoding,
            demi_journee_absence
        )
        SELECT
            e.id_etudiant,
            CURDATE(),
            (
                SELECT ch.creneau
                FROM horaires_cours hc
                JOIN creneau_horaire ch ON ch.id_creneau = hc.id_creneau_debut
                WHERE hc.id_classe = e.classe
                  AND LOWER(hc.jour_semaine) = jour_fr
                  AND ch.creneau < '12:00:00'
                ORDER BY ch.creneau
                LIMIT 1 OFFSET 2
            ) AS heure_3eme_matin,
            'Journée',
            'Absent',
            0,
            0,
            1
        FROM etudiants e
        WHERE EXISTS (
                SELECT 1
                FROM horaires_cours hc
                JOIN creneau_horaire ch ON ch.id_creneau = hc.id_creneau_debut
                WHERE hc.id_classe = e.classe
                  AND LOWER(hc.jour_semaine) = jour_fr
                  AND ch.creneau < '12:00:00'
                ORDER BY ch.creneau
                LIMIT 1 OFFSET 2
            )
          AND TIME(NOW()) >= (
                SELECT ch.creneau
                FROM horaires_cours hc
                JOIN creneau_horaire ch ON ch.id_creneau = hc.id_creneau_debut
                WHERE hc.id_classe = e.classe
                  AND LOWER(hc.jour_semaine) = jour_fr
                  AND ch.creneau < '12:00:00'
                ORDER BY ch.creneau
                LIMIT 1 OFFSET 2
            )
          AND NOT EXISTS (
                SELECT 1
                FROM passages p
                WHERE p.id_etudiant = e.id_etudiant
                  AND p.date_passage = CURDATE()
                  AND p.statut NOT IN ('Absent', 'Absence justifiée')
            )
          AND NOT EXISTS (
                SELECT 1
                FROM passages p
                WHERE p.id_etudiant = e.id_etudiant
                  AND p.date_passage = CURDATE()
                  AND p.type_passage = 'Journée'
            );
    END IF;
END//
DELIMITER ;

-- Listage de la structure de table sortie_ecole. matieres
CREATE TABLE IF NOT EXISTS `matieres` (
  `id_matiere` int NOT NULL AUTO_INCREMENT,
  `matiere` varchar(50) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_matiere`)
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table sortie_ecole. matieres_professeurs
CREATE TABLE IF NOT EXISTS `matieres_professeurs` (
  `id_matiere` int NOT NULL,
  `id_professeur` int NOT NULL,
  PRIMARY KEY (`id_matiere`,`id_professeur`),
  KEY `fk_mp_professeur` (`id_professeur`),
  CONSTRAINT `fk_mp_matiere` FOREIGN KEY (`id_matiere`) REFERENCES `matieres` (`id_matiere`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_mp_professeur` FOREIGN KEY (`id_professeur`) REFERENCES `professeurs` (`id_professeur`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table sortie_ecole. passages
CREATE TABLE IF NOT EXISTS `passages` (
  `id_passage` int NOT NULL AUTO_INCREMENT,
  `id_etudiant` int DEFAULT NULL,
  `date_passage` date DEFAULT NULL,
  `heure_passage` time DEFAULT NULL,
  `id_type_passage` int DEFAULT NULL,
  `id_statut_passage` int DEFAULT NULL,
  `id_raison_passage` int DEFAULT NULL,
  `scan` tinyint NOT NULL DEFAULT '0',
  `manualEncoding` tinyint NOT NULL DEFAULT '0',
  `demi_journee_absence` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id_passage`),
  KEY `id_etudiant` (`id_etudiant`),
  KEY `fk_passages_type_idx` (`id_type_passage`),
  KEY `fk_passages_statut_idx` (`id_statut_passage`),
  KEY `fk_passages_raison_idx` (`id_raison_passage`),
  CONSTRAINT `fk_passages_raison` FOREIGN KEY (`id_raison_passage`) REFERENCES `raisons_passage` (`id_raison_passage`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_passages_statut` FOREIGN KEY (`id_statut_passage`) REFERENCES `statuts_passage` (`id_statut_passage`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_passages_type` FOREIGN KEY (`id_type_passage`) REFERENCES `types_passage` (`id_type_passage`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `passages_ibfk_1` FOREIGN KEY (`id_etudiant`) REFERENCES `etudiants` (`id_etudiant`)
) ENGINE=InnoDB AUTO_INCREMENT=300 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table sortie_ecole. professeurs
CREATE TABLE IF NOT EXISTS `professeurs` (
  `id_professeur` int NOT NULL AUTO_INCREMENT,
  `sourcedId` varchar(100) NOT NULL,
  `internnummer` varchar(20) DEFAULT NULL,
  `stamboeknummer` varchar(30) DEFAULT NULL,
  `referenceIdentifier` varchar(100) DEFAULT NULL,
  `nom` varchar(100) DEFAULT NULL,
  `prenom` varchar(100) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `username` varchar(100) DEFAULT NULL,
  `enabled_user` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_professeur`),
  UNIQUE KEY `uq_professeurs_sourcedId` (`sourcedId`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table sortie_ecole. raisons_passage
CREATE TABLE IF NOT EXISTS `raisons_passage` (
  `id_raison_passage` int NOT NULL AUTO_INCREMENT,
  `code` varchar(64) NOT NULL,
  `legacy_value` varchar(100) DEFAULT NULL,
  `label` varchar(100) NOT NULL,
  `is_system` tinyint(1) NOT NULL DEFAULT '1',
  `sort_order` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id_raison_passage`),
  UNIQUE KEY `uq_raisons_passage_code` (`code`),
  UNIQUE KEY `uq_raisons_passage_legacy_value` (`legacy_value`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table sortie_ecole. statuts_passage
CREATE TABLE IF NOT EXISTS `statuts_passage` (
  `id_statut_passage` int NOT NULL AUTO_INCREMENT,
  `code` varchar(64) NOT NULL,
  `legacy_value` varchar(100) DEFAULT NULL,
  `label` varchar(100) NOT NULL,
  `is_system` tinyint(1) NOT NULL DEFAULT '1',
  `sort_order` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id_statut_passage`),
  UNIQUE KEY `uq_statuts_passage_code` (`code`),
  UNIQUE KEY `uq_statuts_passage_legacy_value` (`legacy_value`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table sortie_ecole. types_passage
CREATE TABLE IF NOT EXISTS `types_passage` (
  `id_type_passage` int NOT NULL AUTO_INCREMENT,
  `code` varchar(64) NOT NULL,
  `legacy_value` varchar(100) DEFAULT NULL,
  `label` varchar(100) NOT NULL,
  `is_system` tinyint(1) NOT NULL DEFAULT '1',
  `sort_order` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id_type_passage`),
  UNIQUE KEY `uq_types_passage_code` (`code`),
  UNIQUE KEY `uq_types_passage_legacy_value` (`legacy_value`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table sortie_ecole. utilisateurs
CREATE TABLE IF NOT EXISTS `utilisateurs` (
  `id_user` int NOT NULL AUTO_INCREMENT,
  `nom` varchar(100) DEFAULT NULL,
  `mot_de_passe` varchar(255) DEFAULT NULL,
  `role` enum('Surveillant','Gestionnaire','Administrateur') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  PRIMARY KEY (`id_user`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de déclencheur sortie_ecole. after_passage_insert_demi_journee
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';
DELIMITER //
CREATE TRIGGER `after_passage_insert_demi_journee` AFTER INSERT ON `passages` FOR EACH ROW BEGIN
    IF NEW.demi_journee_absence > 0 THEN
        UPDATE etudiants
        SET demi_journee_absence = demi_journee_absence + NEW.demi_journee_absence
        WHERE id_etudiant = NEW.id_etudiant;
    END IF;
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Listage de la structure de déclencheur sortie_ecole. after_passage_update_demi_journee
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';
DELIMITER //
CREATE TRIGGER `after_passage_update_demi_journee` AFTER UPDATE ON `passages` FOR EACH ROW BEGIN
    IF NEW.demi_journee_absence <> OLD.demi_journee_absence THEN
        UPDATE etudiants
        SET demi_journee_absence = demi_journee_absence + (NEW.demi_journee_absence - OLD.demi_journee_absence)
        WHERE id_etudiant = NEW.id_etudiant;
    END IF;
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
