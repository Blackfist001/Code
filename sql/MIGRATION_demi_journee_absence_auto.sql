-- Migration: demi-journee d'absence automatique a la 3eme heure (matin et apres-midi)
-- Prerequis:
--   - event_scheduler active (SET GLOBAL event_scheduler = ON;)
--   - table passages avec colonnes scan/manual

ALTER TABLE passages
    ADD COLUMN IF NOT EXISTS demi_journee INT NOT NULL DEFAULT 0 AFTER manual;

ALTER TABLE passages
    MODIFY COLUMN type_passage ENUM(
        'Aucun',
        'Entrée matin',
        'Sortie midi',
        'Rentrée midi',
        'Entrée après-midi',
        'Sortie autorisée',
        'Journée'
    ) DEFAULT NULL;

DROP EVENT IF EXISTS mark_absence_morning_halfday;
DROP EVENT IF EXISTS mark_absence_afternoon_halfday;

DELIMITER //
CREATE EVENT mark_absence_morning_halfday
ON SCHEDULE EVERY 5 MINUTE
DO
BEGIN
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
            manual,
            demi_journee
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

DELIMITER //
CREATE EVENT mark_absence_afternoon_halfday
ON SCHEDULE EVERY 5 MINUTE
DO
BEGIN
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
        SET p.demi_journee = 2
        WHERE p.date_passage = CURDATE()
          AND p.type_passage = 'Journée'
          AND p.statut = 'Absent'
          AND p.demi_journee = 1
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
