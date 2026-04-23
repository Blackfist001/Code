<?php
namespace App\Model;

use App\Core\DataBase;
use PDO;
use PDOException;

class MovementsModel {
    private DataBase $db;
    private ClassesModel $classesModel;

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

    /**
     * Normalise le type_passage en s'assurant qu'il fait partie des valeurs ENUM attendues.
     * Valeur par défaut : 'Entrée matin'.
     *
     * @param string $typePassage Valeur brute
     * @return string Valeur normalisée
     */
    private function normalizeTypePassage(string $typePassage): string {
        $allowed = [
            'Aucun',
            'Entrée matin',
            'Sortie midi',
            'Rentrée midi',
            'Entrée après-midi',
            'Sortie autorisée',
            'Journée',
        ];

        return in_array($typePassage, $allowed, true) ? $typePassage : 'Entrée matin';
    }

    /**
     * Normalise le statut en s'assurant qu'il fait partie des valeurs ENUM attendues.
     * Valeur par défaut : 'Autorisé'.
     *
     * @param string $statut Valeur brute
     * @return string Valeur normalisée
     */
    private function normalizeStatut(string $statut): string {
        $allowed = [
            'Autorisé',
            'Refusé',
            'Absence justifiée',
            'Sortie justifiée',
            'Absent',
            'En retard',
            'Présent',
        ];

        return in_array($statut, $allowed, true) ? $statut : 'Autorisé';
    }

    /**
     * Normalise la raison d'un passage : vérifie que la valeur est dans l'ENUM passages.raison.
     * Retourne null si vide ou non reconnue.
     *
     * @param string|null $reason Valeur brute
     * @return string|null Valeur normalisée ou null
     */
    private function normalizeReason(?string $reason): ?string {
        $value = trim((string)($reason ?? ''));
        if ($value === '') {
            return null;
        }

        $allowed = $this->getEnumValues('passages', 'raison');
        if (empty($allowed)) {
            return null;
        }

        return in_array($value, $allowed, true) ? $value : null;
    }

    /**
     * Retourne les valeurs disponibles pour le champ raison (ENUM passages.raison).
     *
     * @return string[]
     */
    public function getReasonOptions(): array {
        return $this->getEnumValues('passages', 'raison');
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
        $dbTypePassage = $this->normalizeTypePassage((string)($movementData['type_passage'] ?? 'Entrée matin'));
        $hasReasonColumn = !empty($this->getEnumValues('passages', 'raison'));
        $sql = $hasReasonColumn
            ? "INSERT INTO passages (id_etudiant, date_passage, heure_passage, type_passage, statut, raison, `scan`, `manualEncoding`)
               VALUES (:id_etudiant, :date_passage, :heure_passage, :type_passage, :statut, :raison, :scan, :manualEncoding)"
            : "INSERT INTO passages (id_etudiant, date_passage, heure_passage, type_passage, statut, `scan`, `manualEncoding`)
               VALUES (:id_etudiant, :date_passage, :heure_passage, :type_passage, :statut, :scan, :manualEncoding)";
        $stmt = $pdo->prepare($sql);
        try {
            $params = [
                ':id_etudiant'  => $movementData['id_etudiant'],
                ':type_passage' => $dbTypePassage,
                ':statut'       => $this->normalizeStatut((string)($movementData['statut'] ?? 'Autorisé')),
                ':date_passage' => $movementData['date_passage'] ?? date('Y-m-d'),
                ':heure_passage'=> $movementData['heure_passage'] ?? date('H:i:s'),
                ':scan'         => isset($movementData['scan'])   ? (int)(bool)$movementData['scan']   : 0,
                ':manualEncoding' => isset($movementData['manualEncoding'])
                    ? (int)(bool)$movementData['manualEncoding']
                    : (isset($movementData['manual']) ? (int)(bool)$movementData['manual'] : 0),
            ];
            if ($hasReasonColumn) {
                $params[':raison'] = $this->normalizeReason($movementData['raison'] ?? null);
            }

            $stmt->execute($params);
        } catch (PDOException $e) {
            error_log('Error adding movement: ' . $e->getMessage());
            throw $e;
        }
        return $stmt->rowCount() > 0;
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
        
        if (isset($movementData['id_etudiant'])) {
            $setClauses[] = "id_etudiant = :id_etudiant";
            $params[':id_etudiant'] = $movementData['id_etudiant'];
        }
        if (isset($movementData['type_passage'])) {
            $setClauses[] = "type_passage = :type_passage";
            $params[':type_passage'] = $this->normalizeTypePassage((string)$movementData['type_passage']);
        }
        if (isset($movementData['statut'])) {
            $setClauses[] = "statut = :statut";
            $params[':statut'] = $this->normalizeStatut((string)$movementData['statut']);
        }
        if (array_key_exists('raison', $movementData) && !empty($this->getEnumValues('passages', 'raison'))) {
            $setClauses[] = "raison = :raison";
            $params[':raison'] = $this->normalizeReason($movementData['raison']);
        }
        
        if (empty($setClauses)) {
            return;
        }
        
        $sql = "UPDATE passages SET " . implode(', ', $setClauses) . " WHERE id_passage = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
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
        $stmt = $pdo->prepare("SELECT p.* FROM passages p 
            JOIN etudiants e ON p.id_etudiant = e.id_etudiant 
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
            "SELECT * FROM passages
             WHERE id_etudiant = :id_etudiant
               AND type_passage != 'Aucun'
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
            "SELECT p.*, e.nom, e.prenom, e.classe
             FROM passages p
             LEFT JOIN etudiants e ON p.id_etudiant = e.id_etudiant
             WHERE p.type_passage != 'Aucun'
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
            "SELECT p.*, e.nom, e.prenom, e.classe
             FROM passages p
             LEFT JOIN etudiants e ON p.id_etudiant = e.id_etudiant
             WHERE p.date_passage = :date
               AND p.type_passage != 'Aucun'
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
            "SELECT type_passage FROM passages
             WHERE id_etudiant = :id AND date_passage = CURDATE()
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
            "SELECT p.*, e.nom, e.prenom, e.classe
             FROM passages p
             LEFT JOIN etudiants e ON p.id_etudiant = e.id_etudiant
             WHERE p.date_passage BETWEEN :date_from AND :date_to
               AND p.type_passage != 'Aucun'
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
        $stmt = $pdo->prepare("DELETE FROM passages WHERE id_passage = :id");
        $stmt->execute([':id' => $id]);
        return $stmt->rowCount() > 0;
    }

    /**
     * Recherche les passages filtrés par infos étudiant (nom, prénom, classe, statut).
     */
    public function searchMovementsByStudent(array $filters): array {
        $pdo = $this->db->getPdo();

        $where = ["p.type_passage != 'Aucun'"];
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
            $where[] = "p.statut = :statut";
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
                   p.type_passage, p.statut, p.raison,
                       COALESCE(e.demi_journee_absence, 0) AS total_demi_journees,
                       e.nom, e.prenom, e.classe
                FROM passages p
                JOIN etudiants e ON p.id_etudiant = e.id_etudiant
                WHERE " . implode(' AND ', $where) . "
                ORDER BY p.date_passage DESC, p.heure_passage DESC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $movements = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return $this->addClassNamesToMovements($movements);
    }
}
