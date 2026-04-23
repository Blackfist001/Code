<?php
namespace App\Controller;

use App\Model\StudentsModel;
use App\Model\MovementsModel;
use App\Model\ClassesModel;
use Exception;

class SearchController {
    private StudentsModel $studentsModel;
    private MovementsModel $movementsModel;
    private ClassesModel $classesModel;

    public function __construct() {
        $this->studentsModel = new StudentsModel();
        $this->movementsModel = new MovementsModel();
        $this->classesModel = new ClassesModel();
    }

    /**
     * Construit un tableau id_classe => nom_classe pour le contrôleur courant.
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
     * Remplace le champ 'classe' (id numérique) par le nom lisible dans chaque ligne.
     *
     * @param array $rows Lignes issues de la base de données
     * @return array Lignes avec 'classe' résolu en nom
     */
    private function enrichClasseNom(array $rows): array {
        if (empty($rows)) {
            return $rows;
        }

        $classMap = $this->getClassMapById();
        foreach ($rows as &$row) {
            $rawClasse = $row['classe'] ?? null;
            $classId = is_numeric($rawClasse) ? (int)$rawClasse : 0;
            if ($classId > 0) {
                $row['classe_id'] = $classId;
            }
            $row['classe'] = $classMap[$classId] ?? (string)($rawClasse ?? '');
        }
        unset($row);

        return $rows;
    }

    /**
     * Affiche la page de recherche
     */
    public function index() {
        require_once __DIR__ . '/../view/searchView.php';
    }

    /**
     * API : Recherche complète (étudiants + passages)
     */
    public function search($params = []) {
        header('Content-Type: application/json');
        
        try {
            $query = $_GET['q'] ?? '';
            
            if (empty($query)) {
                echo json_encode([
                    'success' => false,
                    'message' => 'Requête vide'
                ]);
                exit;
            }

            $students = $this->studentsModel->searchStudents($query);
            $movements = $this->movementsModel->searchMovements($query);
            
            echo json_encode([
                'success' => true,
                'students' => [
                    'count' => count($students),
                    'results' => $students
                ],
                'movements' => [
                    'count' => count($movements),
                    'results' => $movements
                ]
            ]);
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * API : Recherche avancée par critères
     */
    public function advancedSearch($params = []) {
        header('Content-Type: application/json');
        
        try {
            $pdo = (new \App\Core\DataBase())->getPdo();
            
            $nom = $_GET['nom'] ?? '';
            $classe = $_GET['classe'] ?? '';
            $dateFrom = $_GET['date_from'] ?? '';
            $dateTo = $_GET['date_to'] ?? '';
            
            $query = "SELECT DISTINCT e.*, p.date_passage, p.type_passage, p.statut 
                      FROM etudiants e 
                      LEFT JOIN passages p ON e.id_etudiant = p.id_etudiant
                      WHERE 1=1";
            
            $params = [];
            
            if (!empty($nom)) {
                $query .= " AND (e.nom LIKE :nom OR e.prenom LIKE :nom)";
                $params[':nom'] = "%$nom%";
            }
            
            if (!empty($classe)) {
                $classId = $this->resolveClassId($classe);
                if ($classId === null) {
                    echo json_encode([
                        'success' => true,
                        'count' => 0,
                        'results' => []
                    ]);
                    return;
                }
                $query .= " AND e.classe = :classe_id";
                $params[':classe_id'] = $classId;
            }
            
            if (!empty($dateFrom)) {
                $query .= " AND p.date_passage >= :date_from";
                $params[':date_from'] = $dateFrom;
            }
            
            if (!empty($dateTo)) {
                $query .= " AND p.date_passage <= :date_to";
                $params[':date_to'] = $dateTo;
            }
            
            $stmt = $pdo->prepare($query);
            $stmt->execute($params);
            $results = $this->enrichClasseNom($stmt->fetchAll(\PDO::FETCH_ASSOC));
            
            echo json_encode([
                'success' => true,
                'count' => count($results),
                'results' => $results
            ]);
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * API : Obtenir les statistiques pour un étudiant
     */
    public function getStudentStats($params = []) {
        header('Content-Type: application/json');
        
        try {
            $studentId = $_GET['id'] ?? null;
            
            if (!$studentId) {
                echo json_encode([
                    'success' => false,
                    'message' => 'ID étudiant requis'
                ]);
                exit;
            }

            $student = $this->studentsModel->getStudentById($studentId);
            $movements = $this->movementsModel->getMovementByStudentId($studentId);
            
            $totalPresences = count(array_filter($movements, function($m) {
                return $m['statut'] === 'Autorisé';
            }));
            
            $totalAbsences = count(array_filter($movements, function($m) {
                return $m['statut'] === 'Absent';
            }));
            
            echo json_encode([
                'success' => true,
                'student' => $student,
                'total_passages' => count($movements),
                'total_presences' => $totalPresences,
                'total_absences' => $totalAbsences,
                'recent_movements' => array_slice($movements, 0, 10)
            ]);
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }
    }
}
