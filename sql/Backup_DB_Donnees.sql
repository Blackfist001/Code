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

-- Listage des données de la table sortie_ecole.classes : ~26 rows (environ)
INSERT INTO `classes` (`id_classe`, `classe`) VALUES
	(1, 'CP1'),
	(2, 'CP2'),
	(3, 'CP3'),
	(4, 'CP4'),
	(5, 'CP5'),
	(6, 'CP6'),
	(7, 'CP7'),
	(8, 'CP8'),
	(9, '3PH'),
	(10, '4PH'),
	(11, '5PH'),
	(12, '6PH'),
	(13, '7PH'),
	(14, '4TQ1'),
	(15, '4TQ2'),
	(16, '5TQ'),
	(17, '6TQ'),
	(18, '3PTB1'),
	(19, '3PTB2'),
	(20, '3PTB3'),
	(21, '3PTB4'),
	(22, '4PCA1'),
	(23, '4PCA2'),
	(24, '5PCA'),
	(25, '6PCA'),
	(26, '7PCA');

-- Listage de la structure de table sortie_ecole. creneau_horaire_debut
CREATE TABLE IF NOT EXISTS `creneau_horaire_debut` (
  `id_creneau_debut` int NOT NULL AUTO_INCREMENT,
  `creneau` time DEFAULT '00:00:00',
  PRIMARY KEY (`id_creneau_debut`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Listage des données de la table sortie_ecole.creneau_horaire_debut : ~10 rows (environ)
INSERT INTO `creneau_horaire_debut` (`id_creneau_debut`, `creneau`) VALUES
	(1, '08:15:00'),
	(2, '09:05:00'),
	(3, '10:10:00'),
	(4, '11:00:00'),
	(5, '11:50:00'),
	(6, '12:40:00'),
	(7, '13:30:00'),
	(8, '14:20:00'),
	(9, '15:10:00'),
	(10, '16:00:00');

-- Listage de la structure de table sortie_ecole. creneau_horaire_fin
CREATE TABLE IF NOT EXISTS `creneau_horaire_fin` (
  `id_creneau_fin` int NOT NULL AUTO_INCREMENT,
  `creneau` time DEFAULT '00:00:00',
  PRIMARY KEY (`id_creneau_fin`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Listage des données de la table sortie_ecole.creneau_horaire_fin : ~10 rows (environ)
INSERT INTO `creneau_horaire_fin` (`id_creneau_fin`, `creneau`) VALUES
	(1, '09:05:00'),
	(2, '09:55:00'),
	(3, '11:00:00'),
	(4, '11:50:00'),
	(5, '12:40:00'),
	(6, '13:30:00'),
	(7, '14:20:00'),
	(8, '15:10:00'),
	(9, '16:00:00'),
	(10, '16:50:00');

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

-- Listage des données de la table sortie_ecole.etudiants : ~24 rows (environ)
INSERT INTO `etudiants` (`id_etudiant`, `sourcedId`, `internnummer`, `stamboeknummer`, `referenceIdentifier`, `gebruikersnaam`, `geslacht`, `emailadres`, `nom`, `prenom`, `classe`, `photo`, `date_naissance`, `autorisation_midi`, `demi_journee_absence`) VALUES
	(2, '1002', NULL, NULL, NULL, NULL, NULL, NULL, 'Martin', 'Emma', 1, 'photo2.jpg', NULL, 0, 0),
	(3, '1003', NULL, NULL, NULL, NULL, NULL, NULL, 'Bernard', 'Hugo', 5, 'photo3.jpg', NULL, 1, 0),
	(4, '1004', NULL, NULL, NULL, NULL, NULL, NULL, 'Petit', 'Léa', 7, 'photo4.jpg', NULL, 1, 0),
	(5, '1005', NULL, NULL, NULL, NULL, NULL, NULL, 'Robert', 'Nathan', 4, 'photo5.jpg', NULL, 0, 0),
	(6, '1006', NULL, NULL, NULL, NULL, NULL, NULL, 'Richard', 'Chloé', 3, 'photo6.jpg', NULL, 1, 0),
	(7, '1007', NULL, NULL, NULL, NULL, NULL, NULL, 'Durand', 'Enzo', 3, 'photo7.jpg', NULL, 0, 0),
	(8, '1008', NULL, NULL, NULL, NULL, NULL, NULL, 'Moreau', 'Manon', 3, 'photo8.jpg', NULL, 1, 0),
	(9, '1009', NULL, NULL, NULL, NULL, NULL, NULL, 'Simon', 'Tom', 14, 'photo9.jpg', NULL, 1, 0),
	(10, '1010', NULL, NULL, NULL, NULL, NULL, NULL, 'Laurent', 'Jade', 14, 'photo10.jpg', NULL, 0, 9),
	(11, '1011', NULL, NULL, NULL, NULL, NULL, NULL, 'Lefebvre', 'Noah', 21, 'photo11.jpg', NULL, 1, 0),
	(12, '1012', NULL, NULL, NULL, NULL, NULL, NULL, 'Michel', 'Camille', 21, 'photo12.jpg', NULL, 0, 0),
	(13, '1013', NULL, NULL, NULL, NULL, NULL, NULL, 'Garcia', 'Louis', 25, 'photo13.jpg', NULL, 1, 0),
	(14, '1014', NULL, NULL, NULL, NULL, NULL, NULL, 'David', 'Sarah', 25, 'photo14.jpg', NULL, 1, 0),
	(15, '1015', NULL, NULL, NULL, NULL, NULL, NULL, 'Bertrand', 'Gabriel', 15, 'photo15.jpg', NULL, 0, 0),
	(16, '1016', NULL, NULL, NULL, NULL, NULL, NULL, 'Roux', 'Inès', 15, 'photo16.jpg', NULL, 1, 10),
	(17, '1017', NULL, NULL, NULL, NULL, NULL, NULL, 'Vincent', 'Arthur', 15, 'photo17.jpg', NULL, 0, 0),
	(18, '1018', NULL, NULL, NULL, NULL, NULL, NULL, 'Fournier', 'Lina', 4, 'photo18.jpg', NULL, 1, 0),
	(19, '1019', NULL, NULL, NULL, NULL, NULL, NULL, 'Morel', 'Ethan', 5, 'photo19.jpg', NULL, 1, 0),
	(20, '1020', NULL, NULL, NULL, NULL, NULL, NULL, 'Girard', 'Zoé', 6, 'photo20.jpg', NULL, 0, 0),
	(27, '52260fb7-ab9f-5bb9-88c5-646604dc45f2', '111', '202601', '7725_6_0', 'E1', 'm', NULL, 'Eleve1', 'Elève1', 3, NULL, '2007-01-01', 0, 11),
	(28, '8adbb0f1-421b-5d13-b9c3-ede3d513f0b2', '222', '202602', '7725_8_0', 'E2', 'm', NULL, 'Elève2', 'Elève2', 3, NULL, '2010-04-01', 0, 0),
	(29, '5db8c2fe-687f-550f-bfbf-2e3ee2c04e66', '333', '202603', '7725_16_0', 'E3', 'm', NULL, 'Elève3', 'Elève3', 3, NULL, '2013-02-28', 0, 0);

-- Listage de la structure de table sortie_ecole. horaires_cours
CREATE TABLE IF NOT EXISTS `horaires_cours` (
  `id` int NOT NULL AUTO_INCREMENT,
  `jour_semaine` varchar(10) NOT NULL,
  `id_local` int DEFAULT NULL,
  `id_matiere` int NOT NULL,
  `id_classe` int NOT NULL,
  `id_creneau_debut` int NOT NULL,
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
) ENGINE=InnoDB AUTO_INCREMENT=139 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Listage des données de la table sortie_ecole.horaires_cours : ~125 rows (environ)
INSERT INTO `horaires_cours` (`id`, `jour_semaine`, `id_local`, `id_matiere`, `id_classe`, `id_creneau_debut`, `id_creneau_fin`, `id_professeur`) VALUES
	(1, 'Lundi', NULL, 1, 1, 1, 1, NULL),
	(2, 'Lundi', NULL, 1, 1, 2, 2, NULL),
	(3, 'Lundi', NULL, 2, 1, 3, 3, NULL),
	(4, 'Lundi', NULL, 2, 1, 4, 4, NULL),
	(5, 'Lundi', NULL, 3, 1, 5, 5, NULL),
	(6, 'Lundi', NULL, 3, 1, 7, 7, NULL),
	(7, 'Lundi', NULL, 4, 1, 8, 8, NULL),
	(8, 'Lundi', NULL, 4, 1, 9, 9, NULL),
	(9, 'Lundi', NULL, 4, 1, 10, 10, NULL),
	(10, 'Mardi', NULL, 4, 1, 1, 1, NULL),
	(11, 'Mardi', NULL, 4, 1, 2, 2, NULL),
	(12, 'Mardi', NULL, 4, 1, 3, 3, NULL),
	(13, 'Mardi', NULL, 5, 1, 4, 4, NULL),
	(14, 'Mardi', NULL, 5, 1, 5, 5, NULL),
	(15, 'Mardi', NULL, 5, 1, 6, 6, NULL),
	(16, 'lundi', NULL, 16, 3, 1, 1, NULL),
	(17, 'lundi', NULL, 16, 3, 2, 2, NULL),
	(19, 'lundi', NULL, 1, 3, 3, 3, NULL),
	(20, 'lundi', NULL, 1, 3, 4, 4, NULL),
	(21, 'lundi', NULL, 2, 3, 5, 5, NULL),
	(22, 'lundi', NULL, 2, 3, 6, 6, NULL),
	(23, 'lundi', NULL, 3, 3, 7, 7, NULL),
	(24, 'lundi', NULL, 3, 3, 8, 8, NULL),
	(25, 'lundi', NULL, 4, 3, 9, 9, NULL),
	(26, 'lundi', NULL, 4, 3, 10, 10, NULL),
	(27, 'mardi', NULL, 4, 3, 1, 1, NULL),
	(28, 'mardi', NULL, 4, 3, 2, 2, NULL),
	(30, 'mardi', NULL, 4, 3, 3, 3, NULL),
	(31, 'mardi', NULL, 5, 3, 4, 4, NULL),
	(32, 'mardi', NULL, 5, 3, 5, 5, NULL),
	(33, 'mardi', NULL, 5, 3, 6, 6, NULL),
	(34, 'mardi', NULL, 5, 3, 7, 7, NULL),
	(35, 'mardi', NULL, 6, 3, 8, 8, NULL),
	(36, 'mardi', NULL, 6, 3, 9, 9, NULL),
	(37, 'mardi', NULL, 6, 3, 10, 10, NULL),
	(38, 'mercredi', NULL, 6, 3, 1, 1, NULL),
	(39, 'mercredi', NULL, 3, 3, 2, 2, NULL),
	(41, 'mercredi', NULL, 16, 3, 3, 3, NULL),
	(42, 'mercredi', NULL, 16, 3, 4, 4, NULL),
	(43, 'mercredi', NULL, 16, 3, 5, 5, NULL),
	(44, 'mercredi', NULL, 16, 3, 6, 6, NULL),
	(45, 'mercredi', NULL, 16, 3, 7, 7, NULL),
	(46, 'mercredi', NULL, 16, 3, 8, 8, NULL),
	(47, 'mercredi', NULL, 16, 3, 9, 9, NULL),
	(48, 'mercredi', NULL, 16, 3, 10, 10, NULL),
	(49, 'jeudi', NULL, 16, 3, 1, 1, NULL),
	(50, 'jeudi', NULL, 16, 3, 2, 2, NULL),
	(52, 'jeudi', NULL, 16, 3, 3, 3, NULL),
	(53, 'jeudi', NULL, 16, 3, 4, 4, NULL),
	(54, 'jeudi', NULL, 16, 3, 5, 5, NULL),
	(55, 'jeudi', NULL, 16, 3, 6, 6, NULL),
	(56, 'jeudi', NULL, 16, 3, 7, 7, NULL),
	(57, 'jeudi', NULL, 16, 3, 8, 8, NULL),
	(58, 'jeudi', NULL, 16, 3, 9, 9, NULL),
	(59, 'jeudi', NULL, 16, 3, 10, 10, NULL),
	(60, 'vendredi', NULL, 16, 3, 1, 1, NULL),
	(61, 'vendredi', NULL, 16, 3, 2, 2, NULL),
	(63, 'vendredi', NULL, 16, 3, 3, 3, NULL),
	(64, 'vendredi', NULL, 16, 3, 4, 4, NULL),
	(65, 'vendredi', NULL, 16, 3, 5, 5, NULL),
	(66, 'vendredi', NULL, 16, 3, 6, 6, NULL),
	(67, 'vendredi', NULL, 16, 3, 7, 7, NULL),
	(68, 'vendredi', NULL, 16, 3, 8, 8, NULL),
	(69, 'vendredi', NULL, 16, 3, 9, 9, NULL),
	(70, 'vendredi', NULL, 16, 3, 10, 10, NULL),
	(71, 'lundi', NULL, 1, 5, 1, 1, NULL),
	(72, 'lundi', NULL, 1, 5, 2, 2, NULL),
	(74, 'lundi', NULL, 2, 5, 3, 3, NULL),
	(75, 'lundi', NULL, 3, 5, 4, 4, NULL),
	(76, 'lundi', NULL, 3, 5, 5, 5, NULL),
	(77, 'lundi', NULL, 4, 5, 6, 6, NULL),
	(78, 'lundi', NULL, 4, 5, 7, 7, NULL),
	(79, 'lundi', NULL, 4, 5, 8, 8, NULL),
	(80, 'lundi', NULL, 4, 5, 9, 9, NULL),
	(81, 'lundi', NULL, 4, 5, 10, 10, NULL),
	(82, 'mardi', NULL, 4, 5, 1, 1, NULL),
	(83, 'mardi', NULL, 5, 5, 2, 2, NULL),
	(85, 'mardi', NULL, 5, 5, 3, 3, NULL),
	(86, 'mardi', NULL, 5, 5, 4, 4, NULL),
	(87, 'mardi', NULL, 6, 5, 5, 5, NULL),
	(88, 'mardi', NULL, 6, 5, 6, 6, NULL),
	(89, 'mardi', NULL, 6, 5, 7, 7, NULL),
	(90, 'mardi', NULL, 6, 5, 8, 8, NULL),
	(91, 'mardi', NULL, 16, 5, 9, 9, NULL),
	(92, 'mardi', NULL, 16, 5, 10, 10, NULL),
	(93, 'mercredi', NULL, 16, 5, 1, 1, NULL),
	(94, 'mercredi', NULL, 16, 5, 2, 2, NULL),
	(96, 'mercredi', NULL, 16, 5, 3, 3, NULL),
	(97, 'mercredi', NULL, 16, 5, 4, 4, NULL),
	(98, 'mercredi', NULL, 16, 5, 5, 5, NULL),
	(99, 'mercredi', NULL, 16, 5, 6, 6, NULL),
	(100, 'mercredi', NULL, 16, 5, 7, 7, NULL),
	(101, 'mercredi', NULL, 16, 5, 8, 8, NULL),
	(102, 'mercredi', NULL, 16, 5, 9, 9, NULL),
	(103, 'mercredi', NULL, 16, 5, 10, 10, NULL),
	(104, 'jeudi', NULL, 16, 5, 1, 1, NULL),
	(105, 'jeudi', NULL, 16, 5, 2, 2, NULL),
	(107, 'jeudi', NULL, 16, 5, 3, 3, NULL),
	(108, 'jeudi', NULL, 16, 5, 4, 4, NULL),
	(109, 'jeudi', NULL, 16, 5, 5, 5, NULL),
	(110, 'jeudi', NULL, 16, 5, 6, 6, NULL),
	(111, 'jeudi', NULL, 16, 5, 7, 7, NULL),
	(112, 'jeudi', NULL, 16, 5, 8, 8, NULL),
	(113, 'jeudi', NULL, 16, 5, 9, 9, NULL),
	(114, 'jeudi', NULL, 16, 5, 10, 10, NULL),
	(115, 'vendredi', NULL, 16, 5, 1, 1, NULL),
	(116, 'vendredi', NULL, 16, 5, 2, 2, NULL),
	(118, 'vendredi', NULL, 16, 5, 3, 3, NULL),
	(119, 'vendredi', NULL, 16, 5, 4, 4, NULL),
	(120, 'vendredi', NULL, 16, 5, 5, 5, NULL),
	(121, 'vendredi', NULL, 16, 5, 6, 6, NULL),
	(122, 'vendredi', NULL, 16, 5, 7, 7, NULL),
	(123, 'vendredi', NULL, 16, 5, 8, 8, NULL),
	(124, 'vendredi', NULL, 16, 5, 9, 9, NULL),
	(125, 'vendredi', NULL, 16, 5, 10, 10, NULL),
	(129, 'lundi', NULL, 2, 25, 5, 5, NULL),
	(130, 'mardi', NULL, 33, 25, 5, 5, NULL),
	(131, 'vendredi', NULL, 2, 25, 5, 5, NULL),
	(132, 'mercredi', NULL, 19, 25, 6, 6, NULL),
	(133, 'jeudi', NULL, 25, 25, 6, 6, NULL),
	(134, 'vendredi', NULL, 21, 26, 2, 2, NULL),
	(135, 'mardi', NULL, 31, 26, 3, 3, NULL),
	(136, 'lundi', NULL, 19, 26, 4, 4, NULL),
	(137, 'mercredi', NULL, 35, 26, 4, 4, NULL),
	(138, 'jeudi', NULL, 32, 26, 6, 6, NULL);

-- Listage de la structure de table sortie_ecole. locaux
CREATE TABLE IF NOT EXISTS `locaux` (
  `id_local` int NOT NULL AUTO_INCREMENT,
  `local` varchar(10) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id_local`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Listage des données de la table sortie_ecole.locaux : ~2 rows (environ)
INSERT INTO `locaux` (`id_local`, `local`) VALUES
	(1, 'A21'),
	(2, 'Aucun');

-- Listage de la structure de table sortie_ecole. logs_sync
CREATE TABLE IF NOT EXISTS `logs_sync` (
  `id_log` int NOT NULL AUTO_INCREMENT,
  `date_sync` datetime DEFAULT NULL,
  `source` varchar(100) DEFAULT NULL,
  `statut` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id_log`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Listage des données de la table sortie_ecole.logs_sync : ~0 rows (environ)

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

-- Listage des données de la table sortie_ecole.matieres : ~32 rows (environ)
INSERT INTO `matieres` (`id_matiere`, `matiere`, `description`, `active`) VALUES
	(1, 'Mathématiques', NULL, 1),
	(2, 'Français', NULL, 1),
	(3, 'Langue', NULL, 1),
	(4, 'Histoire/Géographie', NULL, 1),
	(5, 'Gymnastique', NULL, 1),
	(6, 'Philosophie', NULL, 1),
	(8, 'Géographie', NULL, 1),
	(16, 'Matiere inconnue', NULL, 1),
	(17, 'MIDI', NULL, 1),
	(18, 'Sciences', NULL, 1),
	(19, 'Education physique', NULL, 1),
	(20, 'Habillement', NULL, 1),
	(21, 'Bureautique', NULL, 1),
	(22, 'CPC', NULL, 1),
	(23, 'CCX', NULL, 1),
	(24, 'Sec-bureautique', NULL, 1),
	(25, 'Communication', NULL, 1),
	(26, 'Informatique', NULL, 1),
	(27, 'RI', NULL, 1),
	(28, 'EES', NULL, 1),
	(29, 'Anglais', NULL, 1),
	(30, 'Confection', NULL, 1),
	(31, 'CPC2', NULL, 1),
	(32, 'Education artistique', NULL, 1),
	(33, 'Exemple cours de maths', NULL, 1),
	(34, 'Exemple d\'un cours', 'Smartschool', 1),
	(35, 'Exemple Salle des profs numérique', NULL, 1),
	(36, 'Histoire', NULL, 1),
	(37, 'Le coin des admins', NULL, 1),
	(38, 'Néerlandais', NULL, 1),
	(39, 'Religion Islamique', NULL, 1),
	(40, 'Test - Economie', NULL, 1);

-- Listage de la structure de table sortie_ecole. matieres_professeurs
CREATE TABLE IF NOT EXISTS `matieres_professeurs` (
  `id_matiere` int NOT NULL,
  `id_professeur` int NOT NULL,
  PRIMARY KEY (`id_matiere`,`id_professeur`),
  KEY `fk_mp_professeur` (`id_professeur`),
  CONSTRAINT `fk_mp_matiere` FOREIGN KEY (`id_matiere`) REFERENCES `matieres` (`id_matiere`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_mp_professeur` FOREIGN KEY (`id_professeur`) REFERENCES `professeurs` (`id_professeur`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Listage des données de la table sortie_ecole.matieres_professeurs : ~14 rows (environ)
INSERT INTO `matieres_professeurs` (`id_matiere`, `id_professeur`) VALUES
	(2, 1),
	(1, 2),
	(29, 3),
	(8, 4),
	(36, 5),
	(19, 6),
	(18, 7),
	(24, 8),
	(22, 9),
	(31, 9),
	(39, 10),
	(30, 11),
	(32, 12),
	(23, 13);

-- Listage de la structure de table sortie_ecole. passages
CREATE TABLE IF NOT EXISTS `passages` (
  `id_passage` int NOT NULL AUTO_INCREMENT,
  `id_etudiant` int DEFAULT NULL,
  `date_passage` date DEFAULT NULL,
  `heure_passage` time DEFAULT NULL,
  `type_passage` enum('Aucun','Entrée matin','Sortie midi','Rentrée midi','Entrée après-midi','Sortie autorisée','Journée') DEFAULT NULL,
  `statut` enum('Autorisé','Refusé','Absence justifiée','Sortie justifiée','Absent','En retard','Présent') DEFAULT NULL,
  `raison` enum('Certificat médical','Autorisation  des parents','Autre') DEFAULT NULL,
  `scan` tinyint NOT NULL DEFAULT '0',
  `manualEncoding` tinyint NOT NULL DEFAULT '0',
  `demi_journee_absence` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id_passage`),
  KEY `id_etudiant` (`id_etudiant`),
  CONSTRAINT `passages_ibfk_1` FOREIGN KEY (`id_etudiant`) REFERENCES `etudiants` (`id_etudiant`)
) ENGINE=InnoDB AUTO_INCREMENT=293 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Listage des données de la table sortie_ecole.passages : ~62 rows (environ)
INSERT INTO `passages` (`id_passage`, `id_etudiant`, `date_passage`, `heure_passage`, `type_passage`, `statut`, `raison`, `scan`, `manualEncoding`, `demi_journee_absence`) VALUES
	(1, 15, '2026-03-30', '14:02:34', 'Sortie midi', 'Refusé', NULL, 0, 0, 0),
	(2, 6, '2026-03-30', '14:05:03', 'Sortie midi', 'Autorisé', NULL, 0, 0, 0),
	(3, 10, '2026-03-30', '14:06:25', 'Entrée matin', 'En retard', NULL, 0, 0, 0),
	(4, 2, '2026-04-03', '08:12:21', 'Entrée matin', 'Présent', NULL, 0, 0, 0),
	(5, 4, '2026-04-03', '08:11:20', 'Entrée matin', 'Présent', NULL, 0, 0, 0),
	(6, 4, '2026-04-03', '08:07:27', 'Entrée matin', 'Présent', NULL, 0, 0, 0),
	(7, 4, '2026-04-03', '08:05:22', 'Entrée matin', 'Présent', NULL, 0, 0, 0),
	(8, 11, '2026-04-09', '08:30:00', 'Entrée matin', 'En retard', NULL, 0, 1, 0),
	(9, 2, '2026-04-09', '08:13:00', 'Entrée matin', 'Présent', NULL, 0, 1, 0),
	(10, 10, '2026-04-09', '11:02:57', 'Entrée matin', 'En retard', NULL, 1, 0, 0),
	(11, 3, '2026-04-09', '11:12:10', 'Entrée matin', 'En retard', NULL, 1, 0, 0),
	(12, 19, '2026-04-09', '11:14:34', 'Entrée matin', 'En retard', NULL, 1, 0, 0),
	(13, 11, '2026-04-09', '11:15:36', 'Entrée matin', 'En retard', NULL, 1, 0, 0),
	(14, 19, '2026-04-09', '11:15:48', 'Entrée matin', 'En retard', NULL, 1, 0, 0),
	(15, 19, '2026-04-09', '11:22:17', 'Entrée matin', 'En retard', NULL, 1, 0, 0),
	(16, 6, '2026-04-09', '10:10:00', 'Journée', 'Absent', NULL, 0, 0, 1),
	(17, 7, '2026-04-09', '10:10:00', 'Journée', 'Absent', NULL, 0, 0, 1),
	(18, 8, '2026-04-09', '10:10:00', 'Journée', 'Absent', NULL, 0, 0, 1),
	(19, 2, '2026-04-09', '13:32:32', 'Entrée matin', 'Présent', NULL, 1, 0, 0),
	(20, 19, '2026-04-09', '13:42:46', 'Entrée matin', 'En retard', NULL, 1, 0, 0),
	(21, 12, '2026-04-01', '08:10:00', 'Entrée matin', 'Présent', NULL, 0, 1, 0),
	(22, 6, '2026-04-09', '13:30:00', 'Entrée matin', 'Présent', NULL, 0, 1, 0),
	(23, 6, '2026-04-09', '13:35:00', 'Entrée après-midi', 'Présent', NULL, 0, 1, 0),
	(24, 6, '2026-04-10', '10:10:00', 'Journée', 'Absent', NULL, 0, 0, 1),
	(25, 7, '2026-04-10', '10:10:00', 'Journée', 'Absent', NULL, 0, 0, 1),
	(26, 8, '2026-04-10', '10:10:00', 'Journée', 'Absent', NULL, 0, 0, 1),
	(27, 3, '2026-04-10', '10:10:00', 'Journée', 'Absent', NULL, 0, 0, 1),
	(28, 19, '2026-04-10', '10:10:00', 'Journée', 'Absent', NULL, 0, 0, 1),
	(31, 3, '2026-04-10', '08:15:06', 'Journée', 'Absent', NULL, 0, 0, 0),
	(32, 19, '2026-04-10', '09:05:36', 'Entrée matin', 'En retard', NULL, 1, 0, 0),
	(33, 3, '2026-04-10', '12:32:36', 'Entrée matin', 'En retard', NULL, 1, 0, 0),
	(126, 19, '2026-04-23', '10:01:36', 'Entrée matin', 'En retard', NULL, 1, 0, 0),
	(127, 18, '2026-04-23', '10:02:02', 'Entrée matin', 'Présent', NULL, 1, 0, 0),
	(128, 17, '2026-04-23', '10:02:20', 'Entrée matin', 'Présent', NULL, 1, 0, 0),
	(139, 2, '2026-04-23', '12:49:00', 'Journée', 'Présent', NULL, 0, 1, 0),
	(142, 4, '2026-04-23', '11:00:59', 'Entrée matin', 'Présent', NULL, 1, 0, 0),
	(143, 6, '2026-04-23', '11:01:51', 'Entrée matin', 'En retard', NULL, 1, 0, 0),
	(144, 2, '2026-04-23', '11:02:03', 'Entrée matin', 'Présent', NULL, 1, 0, 0),
	(146, 7, '2026-04-23', '11:09:00', 'Entrée matin', 'En retard', NULL, 1, 0, 0),
	(148, 4, '2026-04-23', '11:09:51', 'Entrée matin', 'Présent', NULL, 1, 0, 0),
	(149, 3, '2026-04-23', '11:10:32', 'Entrée matin', 'En retard', NULL, 1, 0, 0),
	(151, 4, '2026-04-23', '11:16:21', 'Entrée matin', 'Présent', NULL, 1, 0, 0),
	(152, 4, '2026-04-23', '11:19:02', 'Entrée matin', 'Présent', NULL, 1, 0, 0),
	(153, 4, '2026-04-23', '11:19:23', 'Entrée matin', 'Présent', NULL, 1, 0, 0),
	(155, 4, '2026-04-23', '11:21:32', 'Entrée matin', 'Présent', NULL, 1, 0, 0),
	(156, 4, '2026-04-23', '11:21:49', 'Entrée matin', 'Présent', NULL, 1, 0, 0),
	(158, 4, '2026-04-23', '11:26:33', 'Entrée matin', 'Présent', NULL, 1, 0, 0),
	(160, 4, '2026-04-23', '11:31:28', 'Entrée matin', 'Présent', NULL, 1, 0, 0),
	(161, 6, '2026-04-23', '11:31:46', 'Entrée matin', 'En retard', NULL, 1, 0, 0),
	(162, 4, '2026-04-23', '11:33:38', 'Entrée matin', 'Présent', NULL, 1, 0, 0),
	(163, 6, '2026-04-23', '11:33:46', 'Entrée matin', 'En retard', NULL, 1, 0, 0),
	(165, 4, '2026-04-23', '11:35:20', 'Entrée matin', 'Présent', NULL, 1, 0, 0),
	(166, 6, '2026-04-23', '11:35:28', 'Entrée matin', 'En retard', NULL, 1, 0, 0),
	(167, 4, '2026-04-23', '11:35:43', 'Entrée matin', 'Présent', NULL, 1, 0, 0),
	(168, 6, '2026-04-23', '11:35:52', 'Entrée matin', 'En retard', NULL, 1, 0, 0),
	(169, 4, '2026-04-23', '11:37:03', 'Entrée matin', 'Présent', NULL, 1, 0, 0),
	(170, 2, '2026-04-23', '13:37:00', 'Entrée matin', 'Présent', NULL, 0, 1, 0),
	(179, 14, '2026-04-23', '13:56:00', 'Sortie autorisée', 'Autorisé', NULL, 0, 1, 0),
	(181, 11, '2026-04-23', '14:19:00', 'Journée', 'Absence justifiée', 'Autorisation  des parents', 0, 1, 0),
	(254, 27, '2026-04-24', '12:20:42', 'Entrée matin', 'En retard', NULL, 1, 0, 0),
	(270, 27, '2026-04-24', '13:35:17', 'Entrée matin', 'En retard', NULL, 1, 0, 0);

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
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Listage des données de la table sortie_ecole.professeurs : ~13 rows (environ)
INSERT INTO `professeurs` (`id_professeur`, `sourcedId`, `internnummer`, `stamboeknummer`, `referenceIdentifier`, `nom`, `prenom`, `email`, `username`, `enabled_user`) VALUES
	(1, 'fd0ec3a5-6ded-5314-b327-d1753012d655', '1111', 'PF', '7725_22_0', 'Prof-Français', 'Test', NULL, 'PF', 1),
	(2, 'ba7eeb18-d5c5-52ef-aebf-c681887b9f4f', '2222', 'PM', '7725_24_0', 'Prof-Math', 'Test', NULL, 'PM', 1),
	(3, '732c5517-9d77-54a5-9941-7961c8dac8d0', '3333', 'PA', '7725_26_0', 'Prof-Anglais', 'Test', NULL, 'PA', 1),
	(4, '48f99e4e-8f5f-5566-9562-64a28d09060e', '4444', 'PG', '7725_28_0', 'Prof-Geographie', 'Test', NULL, 'PG', 1),
	(5, '0192548d-fbad-5b90-a481-ad83cd960e80', '5555', 'PH', '7725_30_0', 'Prof-Histoire', 'Test', NULL, 'PH', 1),
	(6, '86b372e4-c148-5854-aaa2-3500a2a4ce23', '6666', 'PE', '7725_32_0', 'Prof-EP', 'Test', NULL, 'PE', 1),
	(7, '3d49b483-a397-5618-a305-c3fede0fae72', '10101010', 'PS', '7725_38_0', 'Prof-Sciences', 'Test', NULL, 'PS', 1),
	(8, '182f7497-f541-53d7-a37f-b51a7c404c6c', '11111111', 'PB', '7725_40_0', 'Prof-Bureautique', 'Test', NULL, 'PB', 1),
	(9, '67629a0a-2a1b-58bb-b134-55720dfde662', '12121212', 'PCPC', '7725_42_0', 'Prof-CPC', 'Test', NULL, 'PCPC', 1),
	(10, '22ab650b-dbe2-5076-8ccc-b7e0fb0ffe80', '13131313', 'PR', '7725_44_0', 'Prof-Religion', 'Test', NULL, 'PR', 1),
	(11, '6613c490-0146-5f6c-9932-c4602fa4c25b', '14141414', 'PC', '7725_46_0', 'Prof-Confection', 'Test', NULL, 'PC', 1),
	(12, 'a73cc814-7b10-5a35-b020-dfcb81c4c83f', '15151515', 'PART', '7725_48_0', 'Prof-Art', 'Test', NULL, 'PART', 1),
	(13, '59bad507-f122-5852-be6b-1a6b43b18c9b', '16161616', 'PCCX', '7725_50_0', 'Prof-CCX', 'Test', NULL, 'PCCX', 1);

-- Listage de la structure de table sortie_ecole. utilisateurs
CREATE TABLE IF NOT EXISTS `utilisateurs` (
  `id_user` int NOT NULL AUTO_INCREMENT,
  `nom` varchar(100) DEFAULT NULL,
  `mot_de_passe` varchar(255) DEFAULT NULL,
  `role` enum('Surveillant','Gestionnaire','Administrateur') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  PRIMARY KEY (`id_user`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Listage des données de la table sortie_ecole.utilisateurs : ~3 rows (environ)
INSERT INTO `utilisateurs` (`id_user`, `nom`, `mot_de_passe`, `role`) VALUES
	(2, 'gestion', '$2y$10$5HFwa02tiWIsH6WfJFl/TeM6eq4nAsIINuo3JrItdhL31exI5h9.W', 'Gestionnaire'),
	(3, 'edu', '$2y$10$Px/TqMu.kdwbgoBsLB8WIu91hnOEbMEhdthwVeoqdeRttkrvSeva6', 'Surveillant'),
	(4, 'admin', '$2y$10$e4UiiHix2Iaav5FjBC/67.f.bxppW/RPYS21EX.3iXibloztr7DcS', 'Administrateur');

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
