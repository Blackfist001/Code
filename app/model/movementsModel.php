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

    private function getClassMapById(): array {
        $map = [];
        foreach ($this->classesModel->getAllClasses() as $class) {
            $map[(int)$class['id_classe']] = $class['classe'];
        }
        return $map;
    }

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

    public function addMovement($movementData) {
        $pdo = $this->db->getPdo();
        $dbTypePassage = $this->normalizeTypePassage((string)($movementData['type_passage'] ?? 'Entrée matin'));
        $stmt = $pdo->prepare(
            "INSERT INTO passages (id_etudiant, date_passage, heure_passage, type_passage, statut, `scan`, `manualEncoding`)
             VALUES (:id_etudiant, :date_passage, :heure_passage, :type_passage, :statut, :scan, :manualEncoding)"
        );
        try {
            $stmt->execute([
                ':id_etudiant'  => $movementData['id_etudiant'],
                ':type_passage' => $dbTypePassage,
                ':statut'       => $this->normalizeStatut((string)($movementData['statut'] ?? 'Autorisé')),
                ':date_passage' => $movementData['date_passage'] ?? date('Y-m-d'),
                ':heure_passage'=> $movementData['heure_passage'] ?? date('H:i:s'),
                ':scan'         => isset($movementData['scan'])   ? (int)(bool)$movementData['scan']   : 0,
                ':manualEncoding' => isset($movementData['manualEncoding'])
                    ? (int)(bool)$movementData['manualEncoding']
                    : (isset($movementData['manual']) ? (int)(bool)$movementData['manual'] : 0),
            ]);
        } catch (PDOException $e) {
            error_log('Error adding movement: ' . $e->getMessage());
            throw $e;
        }
        return $stmt->rowCount() > 0;
    }

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
        
        if (empty($setClauses)) {
            return;
        }
        
        $sql = "UPDATE passages SET " . implode(', ', $setClauses) . " WHERE id_passage = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
    }

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

        $sql = "SELECT p.id_passage, p.date_passage, p.heure_passage,
                       p.type_passage, p.statut,
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
