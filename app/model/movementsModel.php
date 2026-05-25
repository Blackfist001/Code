<?php
namespace App\Model;

use App\Core\DataBase;
use PDO;
use PDOException;

class MovementsModel {
    private DataBase $db;
    private ClassesModel $classesModel;
    private array $passageLookupCache = [];

    public function __construct() {
        $this->db = new DataBase();
        $this->classesModel = new ClassesModel();
    }

    /**
     * Construit un tableau id_classe => nom_classe à partir de ClassesModel.
     *
     * @return array<int, string>
     */
    private function getClassMapById(): array {
        $map = [];
        foreach ($this->classesModel->getAllClasses() as $class) {
            $map[(int)$class['id_classe']] = $class['classe'];
        }
        return $map;
    }

    /**
     * Résout une valeur (id ou nom) en identifiant de classe.
     *
     * @param mixed $classeValue ID numérique ou nom de la classe
     * @return int|null ID de la classe, ou null si introuvable
     */
    private function resolveClassId($classeValue): ?int {
        if ($classeValue === null || $classeValue === '') {
            return null;
        }

        if (is_numeric($classeValue)) {
            $class = $this->classesModel->getClassById((int)$classeValue);
            return $class ? (int)$class['id_classe'] : null;
        }

        $class = $this->classesModel->getClassByName((string)$classeValue);
        return $class ? (int)$class['id_classe'] : null;
    }

    /**
     * Enrichit chaque mouvement avec le nom lisible de la classe.
     *
     * @param array $movements Lignes passages issues de la BDD
     * @return array Lignes avec 'classe' résolu en nom
     */
    private function addClassNamesToMovements(array $movements): array {
        if (empty($movements)) {
            return $movements;
        }

        $classMap = $this->getClassMapById();
        foreach ($movements as &$movement) {
            $rawClasse = $movement['classe'] ?? null;
            $classId = is_numeric($rawClasse) ? (int)$rawClasse : 0;
            if ($classId > 0) {
                $movement['classe_id'] = $classId;
            }
            $movement['classe'] = $classMap[$classId] ?? (string)($rawClasse ?? '');
        }
        unset($movement);

        return $movements;
    }

    /**
     * Lit les valeurs d'un type ENUM directement depuis le schéma MySQL.
     *
     * @param string $table  Nom de la table
     * @param string $column Nom de la colonne ENUM
     * @return string[]      Liste des valeurs autorisées, tableau vide si colonne absente
     */
    private function getEnumValues(string $table, string $column): array {
        $pdo = $this->db->getPdo();
        $stmt = $pdo->query("SHOW COLUMNS FROM `{$table}` LIKE '{$column}'");
        $columnInfo = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$columnInfo || !isset($columnInfo['Type'])) {
            return [];
        }

        if (!preg_match("/^enum\\((.*)\\)$/i", $columnInfo['Type'], $matches)) {
            return [];
        }

        $rawValues = str_getcsv($matches[1], ',', "'");
        return array_values(array_filter(array_map('trim', $rawValues), static fn($v) => $v !== ''));
    }

    private function hasColumn(string $table, string $column): bool {
        $pdo = $this->db->getPdo();
        $stmt = $pdo->prepare(
            'SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table AND COLUMN_NAME = :column'
        );
        $stmt->execute([
            ':table' => $table,
            ':column' => $column,
        ]);

        return ((int)$stmt->fetchColumn()) > 0;
    }

    private function getPassageLookupConfig(string $kind): array {
        $map = [
            'types' => [
                'table' => 'types_passage',
                'id' => 'id_type_passage',
                'fallback' => [
                    'Aucun',
                    'Entrée matin',
                    'Sortie midi',
                    'Rentrée midi',
                    'Entrée après-midi',
                    'Sortie autorisée',
                    'Journée',
                ],
            ],
            'statuses' => [
                'table' => 'statuts_passage',
                'id' => 'id_statut_passage',
                'fallback' => [
                    'Autorisé',
                    'Refusé',
                    'Absence justifiée',
                    'Sortie justifiée',
                    'Absent',
                    'En retard',
                    'Présent',
                ],
            ],
            'reasons' => [
                'table' => 'raisons_passage',
                'id' => 'id_raison_passage',
                'fallback' => ['Certificat médical', 'Autorisation  des parents', 'Autre'],
            ],
        ];

        return $map[$kind] ?? ['table' => '', 'fallback' => []];
    }

    private function getPassageLookupRows(string $kind): array {
        if (isset($this->passageLookupCache[$kind])) {
            return $this->passageLookupCache[$kind];
        }

        $config = $this->getPassageLookupConfig($kind);
        $rows = [];

        try {
            $pdo = $this->db->getPdo();
            $idColumn = (string)($config['id'] ?? 'id');
            $stmt = $pdo->query(sprintf(
                'SELECT %1$s AS id, code, legacy_value, label FROM %2$s ORDER BY sort_order ASC, label ASC',
                $idColumn,
                $config['table']
            ));
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
        } catch (\Throwable $e) {
            $rows = [];
        }

        if (!$rows) {
            $rows = array_map(static fn($label) => [
                'id' => null,
                'code' => null,
                'legacy_value' => $label,
                'label' => $label,
            ], $config['fallback']);
        }

        $this->passageLookupCache[$kind] = $rows;
        return $rows;
    }

    private function normalizePassageLookupLabel(string $kind, string $value, string $fallback): string {
        $needle = trim($value);
        if ($needle === '') {
            return $fallback;
        }

        foreach ($this->getPassageLookupRows($kind) as $row) {
            $candidates = [
                trim((string)($row['label'] ?? '')),
                trim((string)($row['legacy_value'] ?? '')),
                trim((string)($row['code'] ?? '')),
            ];

            if (in_array($needle, $candidates, true)) {
                return trim((string)($row['label'] ?? $fallback)) ?: $fallback;
            }
        }

        return $fallback;
    }

    private function resolveRequiredPassageLookupLabel(string $kind, ?string $value, string $fieldLabel): string {
        $needle = trim((string)($value ?? ''));
        if ($needle === '') {
            throw new \RuntimeException(sprintf('Le champ "%s" est obligatoire.', $fieldLabel));
        }

        foreach ($this->getPassageLookupRows($kind) as $row) {
            $candidates = [
                trim((string)($row['label'] ?? '')),
                trim((string)($row['legacy_value'] ?? '')),
                trim((string)($row['code'] ?? '')),
            ];

            if (in_array($needle, $candidates, true)) {
                $label = trim((string)($row['label'] ?? ''));
                if ($label !== '') {
                    return $label;
                }
            }
        }

        throw new \RuntimeException(sprintf('Valeur invalide pour "%s".', $fieldLabel));
    }

    private function normalizeOptionalPassageLookupLabel(string $kind, ?string $value): ?string {
        $needle = trim((string)($value ?? ''));
        if ($needle === '') {
            return null;
        }

        foreach ($this->getPassageLookupRows($kind) as $row) {
            $candidates = [
                trim((string)($row['label'] ?? '')),
                trim((string)($row['legacy_value'] ?? '')),
                trim((string)($row['code'] ?? '')),
            ];

            if (in_array($needle, $candidates, true)) {
                $label = trim((string)($row['label'] ?? ''));
                return $label !== '' ? $label : null;
            }
        }

        return null;
    }

    private function getPassageLookupLabels(string $kind): array {
        return array_values(array_filter(array_map(static fn($row) => trim((string)($row['label'] ?? '')), $this->getPassageLookupRows($kind))));
    }

    private function getPassageLookupIdByLabel(string $kind, string $label): ?int {
        $needle = trim($label);
        if ($needle === '') {
            return null;
        }

        foreach ($this->getPassageLookupRows($kind) as $row) {
            if (trim((string)($row['label'] ?? '')) !== $needle) {
                continue;
            }

            $id = $row['id'] ?? null;
            return is_numeric($id) ? (int)$id : null;
        }

        return null;
    }

    /**
     * Normalise le type_passage en s'assurant qu'il fait partie des valeurs ENUM attendues.
     * Valeur par défaut : 'Entrée matin'.
     *
     * @param string $typePassage Valeur brute
     * @return string Valeur normalisée
     */
    private function normalizeTypePassage(string $typePassage): string {
        return $this->resolveRequiredPassageLookupLabel('types', $typePassage, 'type_passage');
    }

    /**
     * Normalise le statut en s'assurant qu'il fait partie des valeurs ENUM attendues.
     * Valeur par défaut : 'Autorisé'.
     *
     * @param string $statut Valeur brute
     * @return string Valeur normalisée
     */
    private function normalizeStatut(string $statut): string {
        return $this->resolveRequiredPassageLookupLabel('statuses', $statut, 'statut');
    }

    /**
     * Normalise la raison d'un passage : vérifie que la valeur est dans l'ENUM passages.raison.
     * Retourne null si vide ou non reconnue.
     *
     * @param string|null $reason Valeur brute
     * @return string|null Valeur normalisée ou null
     */
    private function normalizeReason(?string $reason): ?string {
        return $this->normalizeOptionalPassageLookupLabel('reasons', $reason);
    }

    /**
     * Retourne les valeurs disponibles pour le champ raison (ENUM passages.raison).
     *
     * @return string[]
     */
    public function getReasonOptions(): array {
        return $this->getPassageLookupLabels('reasons');
    }

    /**
     * Insère un nouveau passage en base de données.
     *
     * @param array $movementData Champs attendus : id_etudiant, type_passage, statut,
     *                            date_passage, heure_passage, scan, manualEncoding, raison (optionnel)
     * @return bool true si la ligne a été insérée
     */
    public function addMovement($movementData) {
        $pdo = $this->db->getPdo();
        $dbTypePassage = $this->normalizeTypePassage((string)($movementData['type_passage'] ?? ''));
        $dbStatut = $this->normalizeStatut((string)($movementData['statut'] ?? ''));
        $targetDate = $movementData['date_passage'] ?? date('Y-m-d');
        $isScanAuto = !empty($movementData['scan']) && !(!empty($movementData['manualEncoding']) || !empty($movementData['manual']));

        // Premier scan du jour: considérer l'école ouverte et pré-marquer
        // les élèves sans passage en Journée/Absent (auto).
        if ($isScanAuto) {
            $this->initializeDailyAutoAbsences($targetDate);
        }

        // Si l'étudiant est finalement présent/en retard sur une entrée,
        // retirer l'absence auto "Journée" précédemment persistée.
        if (
            in_array($dbTypePassage, ['Entrée matin', 'Entrée après-midi'], true)
            && in_array($dbStatut, ['Présent', 'En retard'], true)
        ) {
            $this->deleteAutoAbsenceForDay((int)$movementData['id_etudiant'], $targetDate);
        }

        // Règle métier: un même étudiant ne peut pas avoir deux passages
        // du même type sur une même journée.
        if ($dbTypePassage !== 'Aucun' && $this->hasMovementTypeOnDate(
            (int)$movementData['id_etudiant'],
            $dbTypePassage,
            $targetDate
        )) {
            throw new \RuntimeException(sprintf(
                'Le passage "%s" est déjà enregistré pour cet étudiant aujourd\'hui.',
                $dbTypePassage
            ));
        }

        $typeId = $this->getPassageLookupIdByLabel('types', $dbTypePassage);
        $statutId = $this->getPassageLookupIdByLabel('statuses', $dbStatut);
        $raisonLabel = $this->normalizeReason($movementData['raison'] ?? null);
        $raisonId = $raisonLabel ? $this->getPassageLookupIdByLabel('reasons', $raisonLabel) : null;

        if ($typeId === null || $statutId === null) {
            throw new \RuntimeException('Configuration des métadonnées de passage invalide.');
        }

        $sql = "INSERT INTO passages (id_etudiant, date_passage, heure_passage, id_type_passage, id_statut_passage, id_raison_passage, `scan`, `manualEncoding`)
               VALUES (:id_etudiant, :date_passage, :heure_passage, :id_type_passage, :id_statut_passage, :id_raison_passage, :scan, :manualEncoding)";
        $stmt = $pdo->prepare($sql);
        try {
            $params = [
                ':id_etudiant'  => $movementData['id_etudiant'],
                ':id_type_passage' => $typeId,
                ':id_statut_passage' => $statutId,
                ':id_raison_passage' => $raisonId,
                ':date_passage' => $targetDate,
                ':heure_passage'=> $movementData['heure_passage'] ?? date('H:i:s'),
                ':scan'         => isset($movementData['scan'])   ? (int)(bool)$movementData['scan']   : 0,
                ':manualEncoding' => isset($movementData['manualEncoding'])
                    ? (int)(bool)$movementData['manualEncoding']
                    : (isset($movementData['manual']) ? (int)(bool)$movementData['manual'] : 0),
            ];

            $stmt->execute($params);
            if ($stmt->rowCount() > 0) {
                if (!$isScanAuto) {
                    \App\Service\AuditService::logDbChange('insert', 'passages', null, $movementData);
                }
            }
        } catch (PDOException $e) {
            error_log('Error adding movement: ' . $e->getMessage());
            throw $e;
        }
        return $stmt->rowCount() > 0;
    }

    /**
     * Supprime une absence auto persistée pour la journée en cours (si présente).
     */
    private function deleteAutoAbsenceForDay(int $studentId, string $datePassage): void {
        $pdo = $this->db->getPdo();
        $typeJourneeId = $this->getPassageLookupIdByLabel('types', 'Journée');
        $statutAbsentId = $this->getPassageLookupIdByLabel('statuses', 'Absent');
        if ($typeJourneeId === null || $statutAbsentId === null) {
            return;
        }

        $stmt = $pdo->prepare(
            "DELETE FROM passages
             WHERE id_etudiant = :id_etudiant
               AND date_passage = :date_passage
               AND id_type_passage = :id_type_passage
               AND id_statut_passage = :id_statut_passage
               AND scan = 0
               AND manualEncoding = 0"
        );
        $stmt->execute([
            ':id_etudiant' => $studentId,
            ':date_passage' => $datePassage,
            ':id_type_passage' => $typeJourneeId,
            ':id_statut_passage' => $statutAbsentId,
        ]);
    }

    /**
     * Pré-crée les absences automatiques "Journée/Absent" pour les élèves
     * qui n'ont encore aucun passage à la date donnée.
     */
    private function initializeDailyAutoAbsences(string $datePassage): void {
        $pdo = $this->db->getPdo();
        $typeJourneeId = $this->getPassageLookupIdByLabel('types', 'Journée');
        $statutAbsentId = $this->getPassageLookupIdByLabel('statuses', 'Absent');
        if ($typeJourneeId === null || $statutAbsentId === null) {
            return;
        }

        $alreadyInitializedStmt = $pdo->prepare(
            "SELECT 1
             FROM passages
             WHERE date_passage = :date_passage
               AND id_type_passage = :id_type_passage
               AND id_statut_passage = :id_statut_passage
               AND scan = 0
               AND manualEncoding = 0
             LIMIT 1"
        );
        $alreadyInitializedStmt->execute([
            ':date_passage' => $datePassage,
            ':id_type_passage' => $typeJourneeId,
            ':id_statut_passage' => $statutAbsentId,
        ]);
        if ($alreadyInitializedStmt->fetchColumn()) {
            return;
        }

        $insertStmt = $pdo->prepare(
            "INSERT INTO passages (
                id_etudiant,
                date_passage,
                heure_passage,
                id_type_passage,
                id_statut_passage,
                id_raison_passage,
                `scan`,
                `manualEncoding`
            )
            SELECT
                e.id_etudiant,
                :date_passage,
                '00:00:00',
                :id_type_passage,
                :id_statut_passage,
                NULL,
                0,
                0
            FROM etudiants e
            WHERE NOT EXISTS (
                SELECT 1
                FROM passages p
                WHERE p.id_etudiant = e.id_etudiant
                  AND p.date_passage = :date_passage_check
            )"
        );

        $insertStmt->execute([
            ':date_passage' => $datePassage,
            ':date_passage_check' => $datePassage,
            ':id_type_passage' => $typeJourneeId,
            ':id_statut_passage' => $statutAbsentId,
        ]);
    }

    /**
     * Vérifie l'existence d'un passage pour un étudiant, un type et une date.
     */
    private function hasMovementTypeOnDate(int $studentId, string $typePassage, string $datePassage): bool {
        $pdo = $this->db->getPdo();
        $typeId = $this->getPassageLookupIdByLabel('types', $typePassage);
        if ($typeId === null) {
            return false;
        }

        $stmt = $pdo->prepare(
            "SELECT 1
             FROM passages
             WHERE id_etudiant = :id_etudiant
               AND id_type_passage = :id_type_passage
               AND date_passage = :date_passage
             LIMIT 1"
        );
        $stmt->execute([
            ':id_etudiant' => $studentId,
            ':id_type_passage' => $typeId,
            ':date_passage' => $datePassage,
        ]);

        return (bool)$stmt->fetchColumn();
    }

    /**
     * Met à jour un passage existant. Seuls les champs présents dans $movementData sont modifiés.
     *
     * @param int|string $movementId ID du passage
     * @param array      $movementData Champs à mettre à jour (id_etudiant, type_passage, statut, raison)
     * @return void
     */
    public function updateMovement($movementId, $movementData) {
        $pdo = $this->db->getPdo();
        $setClauses = [];
        $params = [':id' => $movementId];
        $stmtOld = $pdo->prepare("SELECT * FROM passages WHERE id_passage = :id");
        $stmtOld->execute([':id' => $movementId]);
        $old = $stmtOld->fetch(PDO::FETCH_ASSOC);

        if (isset($movementData['id_etudiant'])) {
            $setClauses[] = "id_etudiant = :id_etudiant";
            $params[':id_etudiant'] = $movementData['id_etudiant'];
        }
        if (isset($movementData['type_passage'])) {
            $setClauses[] = "id_type_passage = :id_type_passage";
            $params[':id_type_passage'] = $this->getPassageLookupIdByLabel(
                'types',
                $this->normalizeTypePassage((string)$movementData['type_passage'])
            );
        }
        if (isset($movementData['statut'])) {
            $setClauses[] = "id_statut_passage = :id_statut_passage";
            $params[':id_statut_passage'] = $this->getPassageLookupIdByLabel(
                'statuses',
                $this->normalizeStatut((string)$movementData['statut'])
            );
        }
        if (array_key_exists('raison', $movementData)) {
            $setClauses[] = "id_raison_passage = :id_raison_passage";
            $reasonLabel = $this->normalizeReason($movementData['raison']);
            $params[':id_raison_passage'] = $reasonLabel
                ? $this->getPassageLookupIdByLabel('reasons', $reasonLabel)
                : null;
        }

        foreach ([':id_type_passage', ':id_statut_passage'] as $requiredParam) {
            if (array_key_exists($requiredParam, $params) && $params[$requiredParam] === null) {
                throw new \RuntimeException('Valeur de métadonnée invalide pour la mise à jour du passage.');
            }
        }
        if (empty($setClauses)) {
            return;
        }
        $sql = "UPDATE passages SET " . implode(', ', $setClauses) . " WHERE id_passage = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        if ($stmt->rowCount() > 0) {
            $stmtNew = $pdo->prepare("SELECT * FROM passages WHERE id_passage = :id");
            $stmtNew->execute([':id' => $movementId]);
            $new = $stmtNew->fetch(PDO::FETCH_ASSOC);
            \App\Service\AuditService::logDbChange('update', 'passages', $old, $new);
        }
    }

    /**
     * Recherche les passages selon un mot-clé (nom/prénom étudiant ou id).
     *
     * @param string $query Terme de recherche
     * @return array Lignes de passages (max 50)
     */
    public function searchMovements($query) {
        $pdo = $this->db->getPdo();
        // Chercher par nom d'étudiant ou ID
        $stmt = $pdo->prepare("SELECT p.*, tp.label AS type_passage, sp.label AS statut, rp.label AS raison
            FROM passages p 
            JOIN etudiants e ON p.id_etudiant = e.id_etudiant
            LEFT JOIN types_passage tp ON tp.id_type_passage = p.id_type_passage
            LEFT JOIN statuts_passage sp ON sp.id_statut_passage = p.id_statut_passage
            LEFT JOIN raisons_passage rp ON rp.id_raison_passage = p.id_raison_passage
            WHERE e.nom LIKE :query OR e.prenom LIKE :query OR p.id_etudiant LIKE :query 
            LIMIT 50");
        $stmt->execute([':query' => "%$query%"]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Retourne tous les passages d'un étudiant, triés du plus récent au plus ancien.
     *
     * @param int|string $studentId
     * @return array
     */
    public function getMovementByStudentId($studentId) {
        $pdo = $this->db->getPdo();
        $stmt = $pdo->prepare(
                        "SELECT p.*, tp.label AS type_passage, sp.label AS statut, rp.label AS raison
                         FROM passages p
                         LEFT JOIN types_passage tp ON tp.id_type_passage = p.id_type_passage
                         LEFT JOIN statuts_passage sp ON sp.id_statut_passage = p.id_statut_passage
                         LEFT JOIN raisons_passage rp ON rp.id_raison_passage = p.id_raison_passage
             WHERE id_etudiant = :id_etudiant
                             AND COALESCE(tp.label, '') != 'Aucun'
             ORDER BY date_passage DESC, heure_passage DESC"
        );
        $stmt->execute([':id_etudiant' => $studentId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Retourne tous les passages (toutes dates), enrichis du nom de classe.
     *
     * @return array
     */
    public function getAllMovements() {
        $pdo = $this->db->getPdo();
        $stmt = $pdo->query(
              "SELECT p.*, tp.label AS type_passage, sp.label AS statut, rp.label AS raison, e.nom, e.prenom, e.classe
             FROM passages p
             LEFT JOIN etudiants e ON p.id_etudiant = e.id_etudiant
               LEFT JOIN types_passage tp ON tp.id_type_passage = p.id_type_passage
               LEFT JOIN statuts_passage sp ON sp.id_statut_passage = p.id_statut_passage
               LEFT JOIN raisons_passage rp ON rp.id_raison_passage = p.id_raison_passage
               WHERE COALESCE(tp.label, '') != 'Aucun'
             ORDER BY p.date_passage DESC, p.heure_passage DESC"
        );
        $movements = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return $this->addClassNamesToMovements($movements);
    }

    /**
     * Retourne les passages d'une date précise, enrichis du nom de classe.
     *
     * @param string $date Format Y-m-d
     * @return array
     */
    public function getMovementsByDate($date) {
        $pdo = $this->db->getPdo();
        $stmt = $pdo->prepare(
                        "SELECT p.*, tp.label AS type_passage, sp.label AS statut, rp.label AS raison, e.nom, e.prenom, e.classe
             FROM passages p
             LEFT JOIN etudiants e ON p.id_etudiant = e.id_etudiant
                         LEFT JOIN types_passage tp ON tp.id_type_passage = p.id_type_passage
                         LEFT JOIN statuts_passage sp ON sp.id_statut_passage = p.id_statut_passage
                         LEFT JOIN raisons_passage rp ON rp.id_raison_passage = p.id_raison_passage
             WHERE p.date_passage = :date
                             AND COALESCE(tp.label, '') != 'Aucun'
             ORDER BY p.heure_passage DESC"
        );
        $stmt->execute([':date' => $date]);
        $movements = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return $this->addClassNamesToMovements($movements);
    }

    /**
     * Retourne les types_passage enregistrés aujourd'hui pour un étudiant.
    * Utilisé par le scanner pour détecter Sortie midi vs Rentrée midi.
     */
    public function getTodayPassageTypes($studentId): array {
        $pdo = $this->db->getPdo();
        $stmt = $pdo->prepare(
              "SELECT tp.label AS type_passage
               FROM passages p
               LEFT JOIN types_passage tp ON tp.id_type_passage = p.id_type_passage
               WHERE p.id_etudiant = :id AND p.date_passage = CURDATE()
             ORDER BY heure_passage ASC"
        );
        $stmt->execute([':id' => $studentId]);
        return array_column($stmt->fetchAll(PDO::FETCH_ASSOC), 'type_passage');
    }

    /**
     * Retourne les passages compris entre deux dates, enrichis du nom de classe.
     *
     * @param string $dateFrom Format Y-m-d
     * @param string $dateTo   Format Y-m-d
     * @return array
     */
    public function getMovementsBetweenDates($dateFrom, $dateTo) {
        $pdo = $this->db->getPdo();
        $stmt = $pdo->prepare(
                        "SELECT p.*, tp.label AS type_passage, sp.label AS statut, rp.label AS raison, e.nom, e.prenom, e.classe
             FROM passages p
             LEFT JOIN etudiants e ON p.id_etudiant = e.id_etudiant
                         LEFT JOIN types_passage tp ON tp.id_type_passage = p.id_type_passage
                         LEFT JOIN statuts_passage sp ON sp.id_statut_passage = p.id_statut_passage
                         LEFT JOIN raisons_passage rp ON rp.id_raison_passage = p.id_raison_passage
             WHERE p.date_passage BETWEEN :date_from AND :date_to
                             AND COALESCE(tp.label, '') != 'Aucun'
             ORDER BY p.date_passage DESC, p.heure_passage DESC"
        );
        $stmt->execute([':date_from' => $dateFrom, ':date_to' => $dateTo]);
        $movements = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return $this->addClassNamesToMovements($movements);
    }

    /**
     * Supprime un passage par son ID.
     *
     * @param int|string $id
     * @return bool true si la ligne a été supprimée
     */
    public function deleteMovement($id) {
        $pdo = $this->db->getPdo();
        $stmtOld = $pdo->prepare("SELECT * FROM passages WHERE id_passage = :id");
        $stmtOld->execute([':id' => $id]);
        $old = $stmtOld->fetch(PDO::FETCH_ASSOC);
        $stmt = $pdo->prepare("DELETE FROM passages WHERE id_passage = :id");
        $stmt->execute([':id' => $id]);
        if ($stmt->rowCount() > 0) {
            \App\Service\AuditService::logDbChange('delete', 'passages', $old, null);
        }
        return $stmt->rowCount() > 0;
    }

    /**
     * Recherche les passages filtrés par infos étudiant (nom, prénom, classe, statut).
     */
    public function searchMovementsByStudent(array $filters): array {
        $pdo = $this->db->getPdo();

        $where = ["COALESCE(tp.label, '') != 'Aucun'"];
        $params = [];

        if (!empty($filters['nom'])) {
            $where[] = "e.nom = :nom";
            $params[':nom'] = $filters['nom'];
        }
        if (!empty($filters['prenom'])) {
            $where[] = "e.prenom = :prenom";
            $params[':prenom'] = $filters['prenom'];
        }
        if (!empty($filters['classe'])) {
            $classId = $this->resolveClassId($filters['classe']);
            if ($classId === null) {
                return [];
            }
            $where[] = "e.classe = :classe_id";
            $params[':classe_id'] = $classId;
        }
        if (!empty($filters['statut'])) {
            $where[] = "sp.label = :statut";
            $params[':statut'] = $filters['statut'];
        }
        if (!empty($filters['date'])) {
            $where[] = "p.date_passage = :date";
            $params[':date'] = $filters['date'];
        }
        if (!empty($filters['date_from']) && !empty($filters['date_to'])) {
            $where[] = "p.date_passage BETWEEN :date_from AND :date_to";
            $params[':date_from'] = $filters['date_from'];
            $params[':date_to']   = $filters['date_to'];
        } elseif (!empty($filters['date_from'])) {
            $where[] = "p.date_passage >= :date_from";
            $params[':date_from'] = $filters['date_from'];
        } elseif (!empty($filters['date_to'])) {
            $where[] = "p.date_passage <= :date_to";
            $params[':date_to'] = $filters['date_to'];
        }

        $sql = "SELECT p.id_passage, p.date_passage, p.heure_passage,
               p.id_type_passage, p.id_statut_passage, p.id_raison_passage,
               tp.label AS type_passage, sp.label AS statut, rp.label AS raison,
                       COALESCE(e.demi_journee_absence, 0) AS total_demi_journees,
                       e.nom, e.prenom, e.classe
                FROM passages p
                JOIN etudiants e ON p.id_etudiant = e.id_etudiant
            LEFT JOIN types_passage tp ON tp.id_type_passage = p.id_type_passage
            LEFT JOIN statuts_passage sp ON sp.id_statut_passage = p.id_statut_passage
            LEFT JOIN raisons_passage rp ON rp.id_raison_passage = p.id_raison_passage
                WHERE " . implode(' AND ', $where) . "
                ORDER BY p.date_passage DESC, p.heure_passage DESC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $movements = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return $this->addClassNamesToMovements($movements);
    }
}
