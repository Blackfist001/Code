-- Insertion des horaires de cours par classe (2A,2B,3A,3B,4A,4B,5A,5B,6A,6B)
-- Chaque classe aura un emploi du temps pour chaque jour de la semaine (lundi-vendredi)
-- Créneaux : 08:15, 09:05, 09:55, 10:10, 11:00, 11:50, 12:40, 13:30, 14:20, 15:10, 16:00

USE sortie_ecole;

TRUNCATE TABLE horaires_cours;

DROP TEMPORARY TABLE IF EXISTS tmp_horaires_cours_import;
CREATE TEMPORARY TABLE tmp_horaires_cours_import (
	nom_classe VARCHAR(10) NOT NULL,
	matiere VARCHAR(100) NOT NULL,
	jour_semaine VARCHAR(10) NOT NULL,
	heure_debut TIME NOT NULL,
	heure_fin TIME NOT NULL,
	salle VARCHAR(20) NULL
);

INSERT INTO tmp_horaires_cours_import (nom_classe, matiere, jour_semaine, heure_debut, heure_fin, salle) VALUES

-- 2A
('2A','Mathématiques','lundi','08:15','09:00','101'),
('2A','Français','lundi','09:05','09:50','102'),
('2A','Histoire','lundi','09:55','10:40','103'),
('2A','Géographie','lundi','10:10','10:55','104'),
('2A','Physique','lundi','11:00','11:45','105'),
('2A','SVT','lundi','11:50','12:35','106'),
('2A','Anglais','lundi','12:40','13:25','107'),
('2A','Espagnol','lundi','13:30','14:15','108'),
('2A','EPS','lundi','14:20','15:05','Gymnase'),
('2A','Technologie','lundi','15:10','15:55','109'),
('2A','Arts Plastiques','lundi','16:00','16:45','110'),

('2A','Français','mardi','08:15','09:00','102'),
('2A','Mathématiques','mardi','09:05','09:50','101'),
('2A','Physique','mardi','09:55','10:40','105'),
('2A','SVT','mardi','10:10','10:55','106'),
('2A','Histoire','mardi','11:00','11:45','103'),
('2A','Géographie','mardi','11:50','12:35','104'),
('2A','Anglais','mardi','12:40','13:25','107'),
('2A','Espagnol','mardi','13:30','14:15','108'),
('2A','EPS','mardi','14:20','15:05','Gymnase'),
('2A','Technologie','mardi','15:10','15:55','109'),
('2A','Arts Plastiques','mardi','16:00','16:45','110'),

('2A','Mathématiques','mercredi','08:15','09:00','101'),
('2A','Français','mercredi','09:05','09:50','102'),
('2A','Histoire','mercredi','09:55','10:40','103'),
('2A','SVT','mercredi','10:10','10:55','106'),
('2A','Physique','mercredi','11:00','11:45','105'),
('2A','Géographie','mercredi','11:50','12:35','104'),
('2A','Anglais','mercredi','12:40','13:25','107'),
('2A','Espagnol','mercredi','13:30','14:15','108'),
('2A','EPS','mercredi','14:20','15:05','Gymnase'),
('2A','Technologie','mercredi','15:10','15:55','109'),
('2A','Arts Plastiques','mercredi','16:00','16:45','110'),

('2A','Mathématiques','jeudi','08:15','09:00','101'),
('2A','Français','jeudi','09:05','09:50','102'),
('2A','Histoire','jeudi','09:55','10:40','103'),
('2A','Géographie','jeudi','10:10','10:55','104'),
('2A','Physique','jeudi','11:00','11:45','105'),
('2A','SVT','jeudi','11:50','12:35','106'),
('2A','Anglais','jeudi','12:40','13:25','107'),
('2A','Espagnol','jeudi','13:30','14:15','108'),
('2A','EPS','jeudi','14:20','15:05','Gymnase'),
('2A','Technologie','jeudi','15:10','15:55','109'),
('2A','Arts Plastiques','jeudi','16:00','16:45','110'),

('2A','Mathématiques','vendredi','08:15','09:00','101'),
('2A','Français','vendredi','09:05','09:50','102'),
('2A','Histoire','vendredi','09:55','10:40','103'),
('2A','Géographie','vendredi','10:10','10:55','104'),
('2A','Physique','vendredi','11:00','11:45','105'),
('2A','SVT','vendredi','11:50','12:35','106'),
('2A','Anglais','vendredi','12:40','13:25','107'),
('2A','Espagnol','vendredi','13:30','14:15','108'),
('2A','EPS','vendredi','14:20','15:05','Gymnase'),
('2A','Technologie','vendredi','15:10','15:55','109'),
('2A','Arts Plastiques','vendredi','16:00','16:45','110'),

-- Répéter pour chaque classe 2B,3A,3B,4A,4B,5A,5B,6A,6B
-- Pour concision, on génère les mêmes matières en variant les salles

('2B','Mathématiques','lundi','08:15','09:00','201'),
('2B','Français','lundi','09:05','09:50','202'),
('2B','Histoire','lundi','09:55','10:40','203'),
('2B','Géographie','lundi','10:10','10:55','204'),
('2B','Physique','lundi','11:00','11:45','205'),
('2B','SVT','lundi','11:50','12:35','206'),
('2B','Anglais','lundi','12:40','13:25','207'),
('2B','Espagnol','lundi','13:30','14:15','208'),
('2B','EPS','lundi','14:20','15:05','Gymnase'),
('2B','Technologie','lundi','15:10','15:55','209'),
('2B','Arts Plastiques','lundi','16:00','16:45','210'),

('2B','Français','mardi','08:15','09:00','202'),
('2B','Mathématiques','mardi','09:05','09:50','201'),
('2B','Physique','mardi','09:55','10:40','205'),
('2B','SVT','mardi','10:10','10:55','206'),
('2B','Histoire','mardi','11:00','11:45','203'),
('2B','Géographie','mardi','11:50','12:35','204'),
('2B','Anglais','mardi','12:40','13:25','207'),
('2B','Espagnol','mardi','13:30','14:15','208'),
('2B','EPS','mardi','14:20','15:05','Gymnase'),
('2B','Technologie','mardi','15:10','15:55','209'),
('2B','Arts Plastiques','mardi','16:00','16:45','210'),

('2B','Mathématiques','mercredi','08:15','09:00','201'),
('2B','Français','mercredi','09:05','09:50','202'),
('2B','Histoire','mercredi','09:55','10:40','203'),
('2B','SVT','mercredi','10:10','10:55','206'),
('2B','Physique','mercredi','11:00','11:45','205'),
('2B','Géographie','mercredi','11:50','12:35','204'),
('2B','Anglais','mercredi','12:40','13:25','207'),
('2B','Espagnol','mercredi','13:30','14:15','208'),
('2B','EPS','mercredi','14:20','15:05','Gymnase'),
('2B','Technologie','mercredi','15:10','15:55','209'),
('2B','Arts Plastiques','mercredi','16:00','16:45','210'),

('2B','Mathématiques','jeudi','08:15','09:00','201'),
('2B','Français','jeudi','09:05','09:50','202'),
('2B','Histoire','jeudi','09:55','10:40','203'),
('2B','Géographie','jeudi','10:10','10:55','204'),
('2B','Physique','jeudi','11:00','11:45','205'),
('2B','SVT','jeudi','11:50','12:35','206'),
('2B','Anglais','jeudi','12:40','13:25','207'),
('2B','Espagnol','jeudi','13:30','14:15','208'),
('2B','EPS','jeudi','14:20','15:05','Gymnase'),
('2B','Technologie','jeudi','15:10','15:55','209'),
('2B','Arts Plastiques','jeudi','16:00','16:45','210'),

('2B','Mathématiques','vendredi','08:15','09:00','201'),
('2B','Français','vendredi','09:05','09:50','202'),
('2B','Histoire','vendredi','09:55','10:40','203'),
('2B','Géographie','vendredi','10:10','10:55','204'),
('2B','Physique','vendredi','11:00','11:45','205'),
('2B','SVT','vendredi','11:50','12:35','206'),
('2B','Anglais','vendredi','12:40','13:25','207'),
('2B','Espagnol','vendredi','13:30','14:15','208'),
('2B','EPS','vendredi','14:20','15:05','Gymnase'),
('2B','Technologie','vendredi','15:10','15:55','209'),
('2B','Arts Plastiques','vendredi','16:00','16:45','210');

-- Ajouter les matières qui n'existent pas encore
INSERT INTO matieres (matiere)
SELECT DISTINCT t.matiere
FROM tmp_horaires_cours_import t
LEFT JOIN matieres m ON m.matiere = t.matiere
WHERE m.id_matiere IS NULL;

-- Ajouter les créneaux manquants (debut + fin)
INSERT INTO creneau_horaire (creneau)
SELECT c.creneau
FROM (
	SELECT DISTINCT heure_debut AS creneau FROM tmp_horaires_cours_import
	UNION
	SELECT DISTINCT heure_fin AS creneau FROM tmp_horaires_cours_import
) c
LEFT JOIN creneau_horaire ch ON ch.creneau = c.creneau
WHERE ch.id_creneau IS NULL;

-- Inserer dans la table cible via les IDs de references
INSERT INTO horaires_cours (id_classe, id_matiere, jour_semaine, id_creneau_debut, id_creneau_fin, salle)
SELECT
	cl.id_classe,
	m.id_matiere,
	t.jour_semaine,
	cd.id_creneau,
	cf.id_creneau,
	t.salle
FROM tmp_horaires_cours_import t
JOIN classes cl ON cl.classe = t.nom_classe
JOIN matieres m ON m.matiere = t.matiere
JOIN creneau_horaire cd ON cd.creneau = t.heure_debut
JOIN creneau_horaire cf ON cf.creneau = t.heure_fin;

DROP TEMPORARY TABLE IF EXISTS tmp_horaires_cours_import;
