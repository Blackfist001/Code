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

-- Listage de la structure de table sortie_ecole. creneau_horaire
CREATE TABLE IF NOT EXISTS `creneau_horaire` (
  `id_creneau` int NOT NULL AUTO_INCREMENT,
  `creneau` time DEFAULT '00:00:00',
  PRIMARY KEY (`id_creneau`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Listage des données de la table sortie_ecole.creneau_horaire : ~0 rows (environ)
INSERT INTO `creneau_horaire` (`id_creneau`, `creneau`) VALUES
	(1, '08:15:00'),
	(2, '09:05:00'),
	(3, '09:55:00'),
	(4, '10:10:00'),
	(5, '11:00:00'),
	(6, '11:50:00'),
	(7, '12:40:00'),
	(8, '13:30:00'),
	(9, '14:20:00'),
	(10, '15:10:00'),
	(11, '16:00:00'),
	(12, '16:50:00');

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
  `demi_journee_absence` int DEFAULT 0,
  PRIMARY KEY (`id_etudiant`),
  UNIQUE KEY `sourcedId` (`sourcedId`),
  KEY `classe_fk` (`classe`),
  CONSTRAINT `classe_fk` FOREIGN KEY (`classe`) REFERENCES `classes` (`id_classe`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Listage des données de la table sortie_ecole.etudiants : ~19 rows (environ)
INSERT INTO `etudiants` (`id_etudiant`, `sourcedId`, `nom`, `prenom`, `classe`, `photo`, `date_naissance`, `autorisation_midi`, `demi_journee_absence`) VALUES
	(2, '1002', 'Martin', 'Emma', 1, 'photo2.jpg', NULL, 0, 0),
	(3, '1003', 'Bernard', 'Hugo', 5, 'photo3.jpg', NULL, 1, 0),
	(4, '1004', 'Petit', 'Léa', 7, 'photo4.jpg', NULL, 1, 0),
	(5, '1005', 'Robert', 'Nathan', 4, 'photo5.jpg', NULL, 0, 0),
	(6, '1006', 'Richard', 'Chloé', 3, 'photo6.jpg', NULL, 1, 0),
	(7, '1007', 'Durand', 'Enzo', 3, 'photo7.jpg', NULL, 0, 0),
	(8, '1008', 'Moreau', 'Manon', 3, 'photo8.jpg', NULL, 1, 0),
	(9, '1009', 'Simon', 'Tom', 14, 'photo9.jpg', NULL, 1, 0),
	(10, '1010', 'Laurent', 'Jade', 14, 'photo10.jpg', NULL, 0, 0),
	(11, '1011', 'Lefebvre', 'Noah', 21, 'photo11.jpg', NULL, 1, 0),
	(12, '1012', 'Michel', 'Camille', 21, 'photo12.jpg', NULL, 0, 0),
	(13, '1013', 'Garcia', 'Louis', 25, 'photo13.jpg', NULL, 1, 0),
	(14, '1014', 'David', 'Sarah', 25, 'photo14.jpg', NULL, 1, 0),
	(15, '1015', 'Bertrand', 'Gabriel', 15, 'photo15.jpg', NULL, 0, 0),
	(16, '1016', 'Roux', 'Inès', 15, 'photo16.jpg', NULL, 1, 0),
	(17, '1017', 'Vincent', 'Arthur', 15, 'photo17.jpg', NULL, 0, 0),
	(18, '1018', 'Fournier', 'Lina', 4, 'photo18.jpg', NULL, 1, 0),
	(19, '1019', 'Morel', 'Ethan', 5, 'photo19.jpg', NULL, 1, 0),
	(20, '1020', 'Girard', 'Zoé', 6, 'photo20.jpg', NULL, 0, 0);

-- Listage de la structure de table sortie_ecole. horaires_cours
CREATE TABLE IF NOT EXISTS `horaires_cours` (
  `id` int NOT NULL AUTO_INCREMENT,
  `jour_semaine` varchar(10) NOT NULL,
  `salle` varchar(20) DEFAULT NULL,
  `id_matiere` int NOT NULL,
  `id_classe` int NOT NULL,
  `id_creneau_debut` int NOT NULL,
  `id_creneau_fin` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_horaires_classe` (`id_classe`),
  KEY `fk_horaires_matiere` (`id_matiere`),
  KEY `fk_horaires_creneau_debut` (`id_creneau_debut`),
  KEY `fk_horaires_creneau_fin` (`id_creneau_fin`),
  CONSTRAINT `fk_horaires_classe` FOREIGN KEY (`id_classe`) REFERENCES `classes` (`id_classe`),
  CONSTRAINT `fk_horaires_creneau_debut` FOREIGN KEY (`id_creneau_debut`) REFERENCES `creneau_horaire` (`id_creneau`),
  CONSTRAINT `fk_horaires_creneau_fin` FOREIGN KEY (`id_creneau_fin`) REFERENCES `creneau_horaire` (`id_creneau`),
  CONSTRAINT `fk_horaires_matiere` FOREIGN KEY (`id_matiere`) REFERENCES `matieres` (`id_matiere`)
) ENGINE=InnoDB AUTO_INCREMENT=126 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Listage des données de la table sortie_ecole.horaires_cours : ~125 rows (environ)
INSERT INTO `horaires_cours` (`id`, `jour_semaine`, `salle`, `id_matiere`, `id_classe`, `id_creneau_debut`, `id_creneau_fin`) VALUES
	(1, 'Lundi', 'Salle 102', 1, 1, 1, 2),
	(2, 'Lundi', 'Salle 102', 1, 1, 2, 3),
	(3, 'Lundi', 'Salle 205', 2, 1, 4, 5),
	(4, 'Lundi', 'Salle 205', 2, 1, 5, 6),
	(5, 'Lundi', 'Salle 102', 3, 1, 6, 7),
	(6, 'Lundi', 'Salle 301', 3, 1, 8, 9),
	(7, 'Lundi', 'Salle 301', 4, 1, 9, 10),
	(8, 'Lundi', 'Salle 102', 4, 1, 10, 11),
	(9, 'Lundi', 'Salle 102', 4, 1, 11, 12),
	(10, 'Mardi', 'Salle 201', 4, 1, 1, 2),
	(11, 'Mardi', 'Salle 201', 4, 1, 2, 3),
	(12, 'Mardi', 'Salle 201', 4, 1, 4, 5),
	(13, 'Mardi', 'Salle 302', 5, 1, 5, 6),
	(14, 'Mardi', 'Salle 105', 5, 1, 6, 7),
	(15, 'Mardi', 'Labo 2', 5, 1, 8, 9),
	(16, 'lundi', '101', 16, 3, 1, 2),
	(17, 'lundi', '102', 16, 3, 2, 3),
	(19, 'lundi', '104', 1, 3, 4, 5),
	(20, 'lundi', '105', 1, 3, 5, 6),
	(21, 'lundi', '106', 2, 3, 6, 7),
	(22, 'lundi', '107', 2, 3, 7, 8),
	(23, 'lundi', '108', 3, 3, 8, 9),
	(24, 'lundi', 'Gymnase', 3, 3, 9, 10),
	(25, 'lundi', '109', 4, 3, 10, 11),
	(26, 'lundi', '110', 4, 3, 11, 12),
	(27, 'mardi', '102', 4, 3, 1, 2),
	(28, 'mardi', '101', 4, 3, 2, 3),
	(30, 'mardi', '106', 4, 3, 4, 5),
	(31, 'mardi', '103', 5, 3, 5, 6),
	(32, 'mardi', '104', 5, 3, 6, 7),
	(33, 'mardi', '107', 5, 3, 7, 8),
	(34, 'mardi', '108', 5, 3, 8, 9),
	(35, 'mardi', 'Gymnase', 6, 3, 9, 10),
	(36, 'mardi', '109', 6, 3, 10, 11),
	(37, 'mardi', '110', 6, 3, 11, 12),
	(38, 'mercredi', '101', 6, 3, 1, 2),
	(39, 'mercredi', '102', 16, 3, 2, 3),
	(41, 'mercredi', '106', 16, 3, 4, 5),
	(42, 'mercredi', '105', 16, 3, 5, 6),
	(43, 'mercredi', '104', 16, 3, 6, 7),
	(44, 'mercredi', '107', 16, 3, 7, 8),
	(45, 'mercredi', '108', 16, 3, 8, 9),
	(46, 'mercredi', 'Gymnase', 16, 3, 9, 10),
	(47, 'mercredi', '109', 16, 3, 10, 11),
	(48, 'mercredi', '110', 16, 3, 11, 12),
	(49, 'jeudi', '101', 16, 3, 1, 2),
	(50, 'jeudi', '102', 16, 3, 2, 3),
	(52, 'jeudi', '104', 16, 3, 4, 5),
	(53, 'jeudi', '105', 16, 3, 5, 6),
	(54, 'jeudi', '106', 16, 3, 6, 7),
	(55, 'jeudi', '107', 16, 3, 7, 8),
	(56, 'jeudi', '108', 16, 3, 8, 9),
	(57, 'jeudi', 'Gymnase', 16, 3, 9, 10),
	(58, 'jeudi', '109', 16, 3, 10, 11),
	(59, 'jeudi', '110', 16, 3, 11, 12),
	(60, 'vendredi', '101', 16, 3, 1, 2),
	(61, 'vendredi', '102', 16, 3, 2, 3),
	(63, 'vendredi', '104', 16, 3, 4, 5),
	(64, 'vendredi', '105', 16, 3, 5, 6),
	(65, 'vendredi', '106', 16, 3, 6, 7),
	(66, 'vendredi', '107', 16, 3, 7, 8),
	(67, 'vendredi', '108', 16, 3, 8, 9),
	(68, 'vendredi', 'Gymnase', 16, 3, 9, 10),
	(69, 'vendredi', '109', 16, 3, 10, 11),
	(70, 'vendredi', '110', 16, 3, 11, 12),
	(71, 'lundi', '201', 1, 5, 1, 2),
	(72, 'lundi', '202', 1, 5, 2, 3),
	(74, 'lundi', '204', 2, 5, 4, 5),
	(75, 'lundi', '205', 3, 5, 5, 6),
	(76, 'lundi', '206', 3, 5, 6, 7),
	(77, 'lundi', '207', 4, 5, 7, 8),
	(78, 'lundi', '208', 4, 5, 8, 9),
	(79, 'lundi', 'Gymnase', 4, 5, 9, 10),
	(80, 'lundi', '209', 4, 5, 10, 11),
	(81, 'lundi', '210', 4, 5, 11, 12),
	(82, 'mardi', '202', 4, 5, 1, 2),
	(83, 'mardi', '201', 5, 5, 2, 3),
	(85, 'mardi', '206', 5, 5, 4, 5),
	(86, 'mardi', '203', 5, 5, 5, 6),
	(87, 'mardi', '204', 6, 5, 6, 7),
	(88, 'mardi', '207', 6, 5, 7, 8),
	(89, 'mardi', '208', 6, 5, 8, 9),
	(90, 'mardi', 'Gymnase', 6, 5, 9, 10),
	(91, 'mardi', '209', 16, 5, 10, 11),
	(92, 'mardi', '210', 16, 5, 11, 12),
	(93, 'mercredi', '201', 16, 5, 1, 2),
	(94, 'mercredi', '202', 16, 5, 2, 3),
	(96, 'mercredi', '206', 16, 5, 4, 5),
	(97, 'mercredi', '205', 16, 5, 5, 6),
	(98, 'mercredi', '204', 16, 5, 6, 7),
	(99, 'mercredi', '207', 16, 5, 7, 8),
	(100, 'mercredi', '208', 16, 5, 8, 9),
	(101, 'mercredi', 'Gymnase', 16, 5, 9, 10),
	(102, 'mercredi', '209', 16, 5, 10, 11),
	(103, 'mercredi', '210', 16, 5, 11, 12),
	(104, 'jeudi', '201', 16, 5, 1, 2),
	(105, 'jeudi', '202', 16, 5, 2, 3),
	(107, 'jeudi', '204', 16, 5, 4, 5),
	(108, 'jeudi', '205', 16, 5, 5, 6),
	(109, 'jeudi', '206', 16, 5, 6, 7),
	(110, 'jeudi', '207', 16, 5, 7, 8),
	(111, 'jeudi', '208', 16, 5, 8, 9),
	(112, 'jeudi', 'Gymnase', 16, 5, 9, 10),
	(113, 'jeudi', '209', 16, 5, 10, 11),
	(114, 'jeudi', '210', 16, 5, 11, 12),
	(115, 'vendredi', '201', 16, 5, 1, 2),
	(116, 'vendredi', '202', 16, 5, 2, 3),
	(118, 'vendredi', '204', 16, 5, 4, 5),
	(119, 'vendredi', '205', 16, 5, 5, 6),
	(120, 'vendredi', '206', 16, 5, 6, 7),
	(121, 'vendredi', '207', 16, 5, 7, 8),
	(122, 'vendredi', '208', 16, 5, 8, 9),
	(123, 'vendredi', 'Gymnase', 16, 5, 9, 10),
	(124, 'vendredi', '209', 16, 5, 10, 11),
	(125, 'vendredi', '210', 16, 5, 11, 12);

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
    'entree_matin',
    'absent'
FROM etudiants e
WHERE DAYOFWEEK(CURDATE()) BETWEEN 2 AND 6
AND NOT EXISTS (
    SELECT 1 FROM passages p
    WHERE p.id_etudiant = e.id_etudiant
    AND p.date_passage = CURDATE()
    AND p.type_passage = 'entree_matin'
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

-- Listage des données de la table sortie_ecole.logs_sync : ~0 rows (environ)

-- Listage de la structure de table sortie_ecole. matieres
CREATE TABLE IF NOT EXISTS `matieres` (
  `id_matiere` int NOT NULL AUTO_INCREMENT,
  `matiere` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id_matiere`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Listage des données de la table sortie_ecole.matieres : ~9 rows (environ)
INSERT INTO `matieres` (`id_matiere`, `matiere`) VALUES
	(1, 'Mathématiques'),
	(2, 'Français'),
	(3, 'Anglais'),
	(4, 'Histoire'),
	(5, 'Gymnastique'),
	(6, 'Philosophie'),
	(7, 'SVT'),
	(8, 'Géographie'),
	(16, 'Matiere inconnue'),
	(17, 'MIDI');

-- Listage de la structure de table sortie_ecole. passages
CREATE TABLE IF NOT EXISTS `passages` (
  `id_passage` int NOT NULL AUTO_INCREMENT,
  `id_etudiant` int DEFAULT NULL,
  `date_passage` date DEFAULT NULL,
  `heure_passage` time DEFAULT NULL,
  `type_passage` enum('Aucun','Entrée matin','Sortie midi','Rentrée midi','Entrée après-midi','Sortie autorisée','Journée') DEFAULT NULL,
  `statut` enum('Autorisé','Refusé','Absence justifiée','Sortie justifiée','Absent','En retard','Présent') DEFAULT NULL,
  `scan` tinyint NOT NULL DEFAULT '0',
  `manualEncoding` tinyint NOT NULL DEFAULT '0',
  `demi_journee` int DEFAULT '0',
  PRIMARY KEY (`id_passage`),
  KEY `id_etudiant` (`id_etudiant`),
  CONSTRAINT `passages_ibfk_1` FOREIGN KEY (`id_etudiant`) REFERENCES `etudiants` (`id_etudiant`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Listage des données de la table sortie_ecole.passages : ~7 rows (environ)
INSERT INTO `passages` (`id_passage`, `id_etudiant`, `date_passage`, `heure_passage`, `type_passage`, `statut`, `scan`, `manualEncoding`, `demi_journee`) VALUES
	(1, 15, '2026-03-30', '14:02:34', 'Sortie midi', 'Refusé', 0, 0, 0),
	(2, 6, '2026-03-30', '14:05:03', 'Sortie midi', 'Autorisé', 0, 0, 0),
	(3, 10, '2026-03-30', '14:06:25', 'Entrée matin', 'En retard', 0, 0, 0),
	(4, 2, '2026-04-03', '08:12:21', 'Entrée matin', 'Présent', 0, 0, 0),
	(5, 4, '2026-04-03', '08:11:20', 'Entrée matin', 'Présent', 0, 0, 0),
	(6, 4, '2026-04-03', '08:07:27', 'Entrée matin', 'Présent', 0, 0, 0),
	(7, 4, '2026-04-03', '08:05:22', 'Entrée matin', 'Présent', 0, 0, 0),
	(8, 11, '2026-04-09', '08:30:00', 'Entrée matin', 'En retard', 0, 1, 0),
	(9, 2, '2026-04-09', '08:13:00', 'Entrée matin', 'Présent', 0, 1, 0),
	(10, 10, '2026-04-09', '11:02:57', 'Entrée matin', 'En retard', 1, 0, 0),
	(11, 3, '2026-04-09', '11:12:10', 'Entrée matin', 'En retard', 1, 0, 0),
	(12, 19, '2026-04-09', '11:14:34', 'Entrée matin', 'En retard', 1, 0, 0),
	(13, 11, '2026-04-09', '11:15:36', 'Entrée matin', 'En retard', 1, 0, 0),
	(14, 19, '2026-04-09', '11:15:48', 'Entrée matin', 'En retard', 1, 0, 0),
	(15, 19, '2026-04-09', '11:22:17', 'Entrée matin', 'En retard', 1, 0, 0),
	(16, 6, '2026-04-09', '10:10:00', 'Journée', 'Absent', 0, 0, 1),
	(17, 7, '2026-04-09', '10:10:00', 'Journée', 'Absent', 0, 0, 1),
	(18, 8, '2026-04-09', '10:10:00', 'Journée', 'Absent', 0, 0, 1);

-- Listage de la structure de table sortie_ecole. utilisateurs
CREATE TABLE IF NOT EXISTS `utilisateurs` (
  `id_user` int NOT NULL AUTO_INCREMENT,
  `nom` varchar(100) DEFAULT NULL,
  `mot_de_passe` varchar(255) DEFAULT NULL,
	`role` enum('Surveillant','Gestionnaire','Administrateur') DEFAULT NULL,
  PRIMARY KEY (`id_user`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Listage des données de la table sortie_ecole.utilisateurs : ~3 rows (environ)
INSERT INTO `utilisateurs` (`id_user`, `nom`, `mot_de_passe`, `role`) VALUES
	(2, 'gestion', '$2y$10$5HFwa02tiWIsH6WfJFl/TeM6eq4nAsIINuo3JrItdhL31exI5h9.W', 'Gestionnaire'),
	(3, 'edu', '$2y$10$Px/TqMu.kdwbgoBsLB8WIu91hnOEbMEhdthwVeoqdeRttkrvSeva6', 'Surveillant'),
	(4, 'admin', '$2y$10$e4UiiHix2Iaav5FjBC/67.f.bxppW/RPYS21EX.3iXibloztr7DcS', 'Administrateur');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
