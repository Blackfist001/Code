CREATE DATABASE sortie_ecole;
USE sortie_ecole;

CREATE TABLE etudiants (
    id_etudiant INT AUTO_INCREMENT PRIMARY KEY,
    sourcedId VARCHAR(100) UNIQUE,
    nom VARCHAR(100),
    prenom VARCHAR(100),
    classe VARCHAR(50),
    photo VARCHAR(255),
    date_naissance DATE,
    autorisation_midi BOOLEAN DEFAULT FALSE,
    demi_journee_absence INT DEFAULT 0
);

CREATE TABLE passages (
    id_passage INT AUTO_INCREMENT PRIMARY KEY,
    id_etudiant INT,
    date_passage DATE,
    heure_passage TIME,
    type_passage ENUM(
        'Aucun',
        'Entrée matin',
        'Sortie midi',
        'Rentrée midi',
        'Entrée après-midi',
        'Sortie autorisée',
        'Journée'
    ),
    statut ENUM(
        'Autorisé',
        'Refusé',
		'Absence justifiée',
		'Sortie justifiée',
		'Absent',
		'En retard',
		'Présent'
    ),
    scan BOOLEAN DEFAULT FALSE,
    manualEncoding BOOLEAN DEFAULT FALSE,
    demi_journee INT DEFAULT 0,
    FOREIGN KEY (id_etudiant)
    REFERENCES etudiants(id_etudiant)
);

CREATE TABLE utilisateurs (
    id_user INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100),
    mot_de_passe VARCHAR(255),
    role ENUM(
        'surveillant',
        'administration',
        'administrateur'
    )
);

CREATE TABLE matieres (
    id_matiere INT AUTO_INCREMENT PRIMARY KEY,
    matiere VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE creneau_horaire (
    id_creneau INT AUTO_INCREMENT PRIMARY KEY,
    creneau TIME DEFAULT '00:00:00'
);

CREATE TABLE horaires_cours (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_classe INT NOT NULL,
    id_matiere INT NOT NULL,
    jour_semaine VARCHAR(10) NOT NULL,
    id_creneau_debut INT NOT NULL,
    id_creneau_fin INT NOT NULL,
    salle VARCHAR(20),
    FOREIGN KEY (id_creneau_debut)
    REFERENCES creneau_horaire(id_creneau),
    FOREIGN KEY (id_creneau_fin)
    REFERENCES creneau_horaire(id_creneau),
    FOREIGN KEY (id_matiere)
    REFERENCES matieres(id_matiere)
);

CREATE TABLE logs_sync (
    id_log INT AUTO_INCREMENT PRIMARY KEY,
    date_sync DATETIME,
    source VARCHAR(100),
    statut VARCHAR(50)
);