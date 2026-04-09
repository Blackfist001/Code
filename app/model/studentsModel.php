<?php
namespace App\Model;

use App\Core\DataBase;
use PDO;
use Exception;

class StudentsModel {
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

    private function addClassNamesToStudents(array $students): array {
        if (empty($students)) {
            return $students;
        }

        $classMap = $this->getClassMapById();
        foreach ($students as &$student) {
            $rawClasse = $student['classe'] ?? null;
            $classId = is_numeric($rawClasse) ? (int)$rawClasse : 0;
            if ($classId > 0) {
                $student['classe_id'] = $classId;
            }
            $student['classe'] = $classMap[$classId] ?? (string)($rawClasse ?? '');
        }
        unset($student);

        return $students;
    }

    public function getAllStudents() {
        $pdo = $this->db->getPdo();
        $stmt = $pdo->query("SELECT e.* FROM etudiants e");
        $students = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return $this->addClassNamesToStudents($students);
    }

    public function getStudentById($id) {
        $pdo = $this->db->getPdo();
        $stmt = $pdo->prepare("
            SELECT e.*
            FROM etudiants e
            WHERE e.id_etudiant = :id
        ");
        $stmt->execute([':id' => $id]);
        $student = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$student) {
            return false;
        }

        $students = $this->addClassNamesToStudents([$student]);
        return $students[0];
    }

    public function getStudentBySourcedId($sourcedId) {
        $pdo = $this->db->getPdo();
        $stmt = $pdo->prepare("
            SELECT e.*
            FROM etudiants e
            WHERE e.sourcedId = :sourcedId
        ");
        $stmt->execute([':sourcedId' => $sourcedId]);
        $student = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$student) {
            return false;
        }

        $students = $this->addClassNamesToStudents([$student]);
        return $students[0];
    }

    public function searchStudents($filters) {
        $pdo = $this->db->getPdo();
        
        $whereConditions = [];
        $params = [];
        
        if (!empty($filters['id'])) {
            $whereConditions[] = "e.id_etudiant = :id";
            $params[':id'] = $filters['id'];
        }
        
        if (!empty($filters['sourcedId'])) {
            $whereConditions[] = "e.sourcedId LIKE :sourcedId";
            $params[':sourcedId'] = "%" . $filters['sourcedId'] . "%";
        }
        
        if (!empty($filters['name'])) {
            $whereConditions[] = "e.nom LIKE :name";
            $params[':name'] = "%" . $filters['name'] . "%";
        }
        
        if (!empty($filters['surname'])) {
            $whereConditions[] = "e.prenom LIKE :surname";
            $params[':surname'] = "%" . $filters['surname'] . "%";
        }
        
        if (!empty($filters['classe'])) {
            $classId = $this->resolveClassId($filters['classe']);
            if ($classId === null) {
                return [];
            }
            $whereConditions[] = "e.classe = :classe_id";
            $params[':classe_id'] = $classId;
        }
        
        if (!empty($filters['statut'])) {
            // Pour l'instant, on considère tous les étudiants comme actifs
            // À adapter selon la logique métier
            if ($filters['statut'] === 'actif') {
                $whereConditions[] = "1=1"; // Tous les étudiants sont actifs
            } else {
                $whereConditions[] = "1=0"; // Aucun étudiant inactif pour l'instant
            }
        }
        
        $whereClause = !empty($whereConditions) ? "WHERE " . implode(" AND ", $whereConditions) : "";
        
        $stmt = $pdo->prepare("
            SELECT e.*, 
                   COUNT(p.id_passage) as passages_count,
                   'actif' as statut
            FROM etudiants e 
            LEFT JOIN passages p ON e.id_etudiant = p.id_etudiant 
            $whereClause
            GROUP BY e.id_etudiant 
            ORDER BY e.nom, e.prenom 
            LIMIT 50
        ");
        
        $stmt->execute($params);
        $students = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return $this->addClassNamesToStudents($students);
    }

    public function addStudent($studentData) {
        $pdo = $this->db->getPdo();
        $nom = $studentData['nom'] ?? '';
        $prenom = $studentData['prenom'] ?? '';
        $classe = $studentData['classe'] ?? '';
        $classeId = $this->resolveClassId($classe);
        $photo = $studentData['photo'] ?? 'photos/default.jpg';
        $autorisation_midi = $studentData['autorisation_midi'] ?? 0;
        
        if (empty($nom) || empty($prenom) || $classeId === null) {
            return false;
        }

        $stmt = $pdo->prepare("
            INSERT INTO etudiants (nom, prenom, classe, photo, autorisation_midi)
            VALUES (:nom, :prenom, :classe, :photo, :autorisation_midi)
        ");
        
        try {
            $stmt->execute([
                ':nom' => $nom,
                ':prenom' => $prenom,
                ':classe' => $classeId,
                ':photo' => $photo,
                ':autorisation_midi' => $autorisation_midi
            ]);
            return true;
        } catch (Exception $e) {
            return false;
        }
    }

    public function deleteStudent($id) {
        $pdo = $this->db->getPdo();
        $stmt = $pdo->prepare("DELETE FROM etudiants WHERE id_etudiant = :id");
        $stmt->execute([':id' => $id]);
        return $stmt->rowCount() > 0;
    }

    public function updateStudent($id, $data) {
        $pdo = $this->db->getPdo();
        $setClauses = [];
        $params = [':id' => $id];

        foreach (['nom', 'prenom', 'classe', 'date_naissance'] as $field) {
            if (isset($data[$field])) {
                if ($field === 'classe') {
                    $classId = $this->resolveClassId($data[$field]);
                    if ($classId === null) {
                        return false;
                    }
                    $setClauses[] = "$field = :$field";
                    $params[":$field"] = $classId;
                    continue;
                }
                $setClauses[] = "$field = :$field";
                $params[":$field"] = $data[$field];
            }
        }
        if (isset($data['autorisation_midi'])) {
            $setClauses[] = "autorisation_midi = :autorisation_midi";
            $params[':autorisation_midi'] = $data['autorisation_midi'] ? 1 : 0;
        }

        if (empty($setClauses)) return false;

        $stmt = $pdo->prepare("UPDATE etudiants SET " . implode(', ', $setClauses) . " WHERE id_etudiant = :id");
        $stmt->execute($params);
        return $stmt->rowCount() > 0;
    }
}

