CREATE EVENT insert_absences_journalieres
ON SCHEDULE EVERY 1 DAY
STARTS TIMESTAMP(CURRENT_DATE, '00:01:00')
DO
INSERT INTO passages (
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
);