-- Migration: comptabilisation cumulative des demi-journées sur etudiants.demi_journee
-- via triggers sur la table passages.
--
-- Principe :
--   - AFTER INSERT : si passages.demi_journee > 0, incrémenter etudiants.demi_journee du même montant.
--   - AFTER UPDATE : si passages.demi_journee a changé, incrémenter etudiants.demi_journee
--                    de la différence (ex: 1→2 ajoute +1).
--
-- Cela couvre :
--   - Les absences manuelles PHP (markAbsent / markJustifiedAbsent) → demi_journee=2 à l'INSERT
--   - L'événement MySQL matin (INSERT demi_journee=1)              → +1 via trigger INSERT
--   - L'événement MySQL après-midi (UPDATE demi_journee 1→2)       → +1 via trigger UPDATE
--
-- Prérequis :
--   - Colonne etudiants.demi_journee INT DEFAULT 0 (déjà en place)
--   - Colonne passages.demi_journee  INT DEFAULT 0 (déjà en place)

DROP TRIGGER IF EXISTS after_passage_insert_demi_journee;
DROP TRIGGER IF EXISTS after_passage_update_demi_journee;

DELIMITER //

CREATE TRIGGER after_passage_insert_demi_journee
AFTER INSERT ON passages
FOR EACH ROW
BEGIN
    IF NEW.demi_journee > 0 THEN
        UPDATE etudiants
        SET demi_journee = demi_journee + NEW.demi_journee
        WHERE id_etudiant = NEW.id_etudiant;
    END IF;
END//

CREATE TRIGGER after_passage_update_demi_journee
AFTER UPDATE ON passages
FOR EACH ROW
BEGIN
    IF NEW.demi_journee <> OLD.demi_journee THEN
        UPDATE etudiants
        SET demi_journee = demi_journee + (NEW.demi_journee - OLD.demi_journee)
        WHERE id_etudiant = NEW.id_etudiant;
    END IF;
END//

DELIMITER ;
