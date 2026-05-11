USE sortie_ecole;

START TRANSACTION;

-- 1) Ajouter les colonnes FK (temporairement NULL pour permettre la migration)
ALTER TABLE horaires_cours
    ADD COLUMN id_creneau_debut INT NULL,
    ADD COLUMN id_creneau_fin INT NULL;

-- 2) Mapper les anciennes heures vers les IDs de creneaux
UPDATE horaires_cours hc
JOIN creneau_horaire_debut cd ON cd.creneau = hc.heure_debut
JOIN creneau_horaire_fin cf ON cf.creneau = hc.heure_fin
SET hc.id_creneau_debut = cd.id_creneau_debut,
    hc.id_creneau_fin = cf.id_creneau_fin;

-- 3) Verifier qu'il ne reste aucune ligne non mappee
--    Si cette requete retourne des lignes, il faut d'abord ajouter les creneaux manquants.
SELECT id, heure_debut, heure_fin
FROM horaires_cours
WHERE id_creneau_debut IS NULL OR id_creneau_fin IS NULL;

-- 4) Rendre les nouvelles colonnes obligatoires
ALTER TABLE horaires_cours
    MODIFY id_creneau_debut INT NOT NULL,
    MODIFY id_creneau_fin INT NOT NULL;

-- 5) Ajouter index + contraintes FK
ALTER TABLE horaires_cours
    ADD KEY fk_horaires_creneau_debut (id_creneau_debut),
    ADD KEY fk_horaires_creneau_fin (id_creneau_fin),
    ADD CONSTRAINT fk_horaires_creneau_debut FOREIGN KEY (id_creneau_debut) REFERENCES creneau_horaire_debut(id_creneau_debut),
    ADD CONSTRAINT fk_horaires_creneau_fin FOREIGN KEY (id_creneau_fin) REFERENCES creneau_horaire_fin(id_creneau_fin);

-- 6) Supprimer les anciennes colonnes horaires
ALTER TABLE horaires_cours
    DROP COLUMN heure_debut,
    DROP COLUMN heure_fin;

COMMIT;
