-- Ajoute les colonnes scan/manual à la table passages
-- Compatible MySQL 8+

ALTER TABLE passages
    ADD COLUMN IF NOT EXISTS scan TINYINT(1) NOT NULL DEFAULT 0 AFTER statut,
    ADD COLUMN IF NOT EXISTS manual TINYINT(1) NOT NULL DEFAULT 0 AFTER scan;
