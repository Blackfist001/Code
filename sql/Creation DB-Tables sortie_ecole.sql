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
    autorisation_midi BOOLEAN DEFAULT FALSE
);

CREATE TABLE passages (
    id_passage INT AUTO_INCREMENT PRIMARY KEY,
    id_etudiant INT,
    date_passage DATE,
    heure_passage TIME,
    type_passage ENUM(
        'entree_matin',
        'sortie_midi',
        'retour_midi',
        'sortie_autorisee'
    ),
    statut ENUM(
        'autorise',
        'refuse',
		'absence_justifie',
		'sortie_justifie',
		'absent',
		'en_retard'
    ),
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

CREATE TABLE horaires_cours (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom_classe VARCHAR(50) NOT NULL,
    matiere VARCHAR(100) NOT NULL,
    jour_semaine VARCHAR(10) NOT NULL,
    heure_debut TIME NOT NULL,
    heure_fin TIME NOT NULL,
    salle VARCHAR(20)                   
);

CREATE TABLE logs_sync (
    id_log INT AUTO_INCREMENT PRIMARY KEY,
    date_sync DATETIME,
    source VARCHAR(100),
    statut VARCHAR(50)
);