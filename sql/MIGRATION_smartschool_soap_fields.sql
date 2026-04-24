-- ============================================================
-- Migration : champs Smartschool SOAP V3
-- Date      : 2026-04-24
-- Contexte  : Branchement de SmartschoolSync (SOAP V3) en
--             remplacement de OneRosterSync (OneRoster V1.1).
--             Les champs ajoutés correspondent aux valeurs
--             retournées par getAllAccountsExtended et getCourses.
-- ============================================================

-- ------------------------------------------------------------
-- Table etudiants
-- Nouveaux champs issus de getAllAccountsExtended (basisrol = 1)
-- ------------------------------------------------------------

-- internnummer  : numéro interne attribué par Smartschool
ALTER TABLE `etudiants`
    ADD COLUMN IF NOT EXISTS `internnummer` varchar(20) DEFAULT NULL
        COMMENT 'Numéro interne Smartschool (internnummer)'
        AFTER `sourcedId`;

-- stamboeknummer : numéro de registre scolaire (matricule élève)
ALTER TABLE `etudiants`
    ADD COLUMN IF NOT EXISTS `stamboeknummer` varchar(30) DEFAULT NULL
        COMMENT 'Numéro de registre scolaire (stamboeknummer)'
        AFTER `internnummer`;

-- referenceIdentifier : identifiant de référence externe Smartschool
--   format : "<schoolId>_<userId>_0"  ex: "7725_6_0"
ALTER TABLE `etudiants`
    ADD COLUMN IF NOT EXISTS `referenceIdentifier` varchar(100) DEFAULT NULL
        COMMENT 'Identifiant de référence externe Smartschool (referenceIdentifier)'
        AFTER `stamboeknummer`;

-- gebruikersnaam : identifiant de connexion Smartschool de l'élève
ALTER TABLE `etudiants`
    ADD COLUMN IF NOT EXISTS `gebruikersnaam` varchar(100) DEFAULT NULL
        COMMENT 'Nom d\'utilisateur Smartschool (gebruikersnaam)'
        AFTER `referenceIdentifier`;

-- geslacht : genre déclaré dans Smartschool ('m', 'v', 'x')
ALTER TABLE `etudiants`
    ADD COLUMN IF NOT EXISTS `geslacht` char(1) DEFAULT NULL
        COMMENT 'Genre (m/v/x) issu de Smartschool (geslacht)'
        AFTER `gebruikersnaam`;

-- emailadres : adresse e-mail de l'élève dans Smartschool
ALTER TABLE `etudiants`
    ADD COLUMN IF NOT EXISTS `emailadres` varchar(255) DEFAULT NULL
        COMMENT 'Adresse e-mail Smartschool (emailadres)'
        AFTER `geslacht`;

-- ------------------------------------------------------------
-- Table professeurs
-- Nouveaux champs issus de getAllAccountsExtended (groupe Enseignants)
-- ------------------------------------------------------------

-- internnummer : numéro interne attribué par Smartschool
ALTER TABLE `professeurs`
    ADD COLUMN IF NOT EXISTS `internnummer` varchar(20) DEFAULT NULL
        COMMENT 'Numéro interne Smartschool (internnummer)'
        AFTER `sourcedId`;

-- stamboeknummer : abréviation / code prof dans Smartschool
--   ex: "PF" pour Prof-Français, "PM" pour Prof-Math
ALTER TABLE `professeurs`
    ADD COLUMN IF NOT EXISTS `stamboeknummer` varchar(30) DEFAULT NULL
        COMMENT 'Abréviation / matricule enseignant dans Smartschool (stamboeknummer)'
        AFTER `internnummer`;

-- referenceIdentifier : identifiant de référence externe Smartschool
ALTER TABLE `professeurs`
    ADD COLUMN IF NOT EXISTS `referenceIdentifier` varchar(100) DEFAULT NULL
        COMMENT 'Identifiant de référence externe Smartschool (referenceIdentifier)'
        AFTER `stamboeknummer`;

-- ------------------------------------------------------------
-- Table matieres
-- Nouveaux champs issus de getCourses
-- ------------------------------------------------------------

-- description : description du cours dans Smartschool
ALTER TABLE `matieres`
    ADD COLUMN IF NOT EXISTS `description` varchar(255) DEFAULT NULL
        COMMENT 'Description du cours (getCourses.description)'
        AFTER `matiere`;

-- active : indique si le cours est actif dans Smartschool (0/1)
ALTER TABLE `matieres`
    ADD COLUMN IF NOT EXISTS `active` tinyint(1) NOT NULL DEFAULT 1
        COMMENT 'Cours actif dans Smartschool (getCourses.active)'
        AFTER `description`;
