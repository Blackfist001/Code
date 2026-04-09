-- Ajoute les colonnes scan/manualEncoding à la table passages
-- Compatible MySQL 8+

ALTER TABLE passages
    ADD COLUMN IF NOT EXISTS scan TINYINT(1) NOT NULL DEFAULT 0 AFTER statut,
    ADD COLUMN IF NOT EXISTS manualEncoding TINYINT(1) NOT NULL DEFAULT 0 AFTER scan;
