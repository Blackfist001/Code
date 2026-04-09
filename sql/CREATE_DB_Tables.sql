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

-- Listage de la structure de table sortie_ecole. classes
CREATE TABLE IF NOT EXISTS `classes` (
  `id_classe` int NOT NULL AUTO_INCREMENT,
  `classe` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`id_classe`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table sortie_ecole. creneau_horaire
CREATE TABLE IF NOT EXISTS `creneau_horaire` (
  `id_creneau` int NOT NULL AUTO_INCREMENT,
  `creneau` time DEFAULT '00:00:00',
  PRIMARY KEY (`id_creneau`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table sortie_ecole. etudiants
CREATE TABLE IF NOT EXISTS `etudiants` (
  `id_etudiant` int NOT NULL AUTO_INCREMENT,
  `sourcedId` varchar(100) DEFAULT NULL,
  `nom` varchar(100) DEFAULT NULL,
  `prenom` varchar(100) DEFAULT NULL,
  `classe` int DEFAULT NULL,
  `photo` varchar(255) DEFAULT NULL,
  `date_naissance` date DEFAULT NULL,
  `autorisation_midi` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id_etudiant`),
  UNIQUE KEY `sourcedId` (`sourcedId`),
  KEY `classe_fk` (`classe`),
  CONSTRAINT `classe_fk` FOREIGN KEY (`classe`) REFERENCES `classes` (`id_classe`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table sortie_ecole. horaires_cours
CREATE TABLE IF NOT EXISTS `horaires_cours` (
  `id` int NOT NULL AUTO_INCREMENT,
  `jour_semaine` varchar(10) NOT NULL,
  `id_creneau_debut` int NOT NULL,
  `id_creneau_fin` int NOT NULL,
  `salle` varchar(20) DEFAULT NULL,
  `id_matiere` int NOT NULL,
  `id_classe` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_horaires_classe` (`id_classe`),
  KEY `fk_horaires_creneau_debut` (`id_creneau_debut`),
  KEY `fk_horaires_creneau_fin` (`id_creneau_fin`),
  KEY `fk_horaires_matiere` (`id_matiere`),
  CONSTRAINT `fk_horaires_classe` FOREIGN KEY (`id_classe`) REFERENCES `classes` (`id_classe`),
  CONSTRAINT `fk_horaires_creneau_debut` FOREIGN KEY (`id_creneau_debut`) REFERENCES `creneau_horaire` (`id_creneau`),
  CONSTRAINT `fk_horaires_creneau_fin` FOREIGN KEY (`id_creneau_fin`) REFERENCES `creneau_horaire` (`id_creneau`),
  CONSTRAINT `fk_horaires_matiere` FOREIGN KEY (`id_matiere`) REFERENCES `matieres` (`id_matiere`)
) ENGINE=InnoDB AUTO_INCREMENT=126 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de l'évènement sortie_ecole. insert_absences_journalieres
DELIMITER //
CREATE EVENT `insert_absences_journalieres` ON SCHEDULE EVERY 1 DAY STARTS '2026-03-23 00:01:00' ON COMPLETION NOT PRESERVE ENABLE DO INSERT INTO passages (
    id_etudiant,
    date_passage,
    heure_passage,
    type_passage,
    statut
)
SELECT 
    e.id_etudiant,
    CURDATE(),
    '00:01:00',
    'Journée',
    'Absent'
FROM etudiants e
WHERE DAYOFWEEK(CURDATE()) BETWEEN 2 AND 6
AND NOT EXISTS (
    SELECT 1 FROM passages p
    WHERE p.id_etudiant = e.id_etudiant
    AND p.date_passage = CURDATE()
    AND p.type_passage = 'Journée'
)//
DELIMITER ;

-- Listage de la structure de table sortie_ecole. logs_sync
CREATE TABLE IF NOT EXISTS `logs_sync` (
  `id_log` int NOT NULL AUTO_INCREMENT,
  `date_sync` datetime DEFAULT NULL,
  `source` varchar(100) DEFAULT NULL,
  `statut` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id_log`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table sortie_ecole. matieres
CREATE TABLE IF NOT EXISTS `matieres` (
  `id_matiere` int NOT NULL AUTO_INCREMENT,
  `matiere` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id_matiere`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table sortie_ecole. passages
CREATE TABLE IF NOT EXISTS `passages` (
  `id_passage` int NOT NULL AUTO_INCREMENT,
  `id_etudiant` int DEFAULT NULL,
  `date_passage` date DEFAULT NULL,
  `heure_passage` time DEFAULT NULL,
  `type_passage` enum('Aucun','Entrée matin','Sortie midi','Rentrée midi','Entrée après-midi','Sortie autorisée','Journée') DEFAULT NULL,
  `statut` enum('Autorisé','Refusé','Absence justifiée','Sortie justifiée','Absent','En retard','Présent') DEFAULT NULL,
  `scan` tinyint(1) NOT NULL DEFAULT '0',
  `manualEncoding` tinyint(1) NOT NULL DEFAULT '0',
  `demi_journee` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id_passage`),
  KEY `id_etudiant` (`id_etudiant`),
  CONSTRAINT `passages_ibfk_1` FOREIGN KEY (`id_etudiant`) REFERENCES `etudiants` (`id_etudiant`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table sortie_ecole. utilisateurs
CREATE TABLE IF NOT EXISTS `utilisateurs` (
  `id_user` int NOT NULL AUTO_INCREMENT,
  `nom` varchar(100) DEFAULT NULL,
  `mot_de_passe` varchar(255) DEFAULT NULL,
  `role` enum('surveillant','administration','administrateur') DEFAULT NULL,
  PRIMARY KEY (`id_user`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Les données exportées n'étaient pas sélectionnées.

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
