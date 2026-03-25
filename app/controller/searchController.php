<?php
namespace App\Controller;

use App\Model\StudentsModel;
use App\Model\MovementsModel;
use Exception;

class SearchController {
    private StudentsModel $studentsModel;
    private MovementsModel $movementsModel;

    public function __construct() {
        $this->studentsModel = new StudentsModel();
        $this->movementsModel = new MovementsModel();
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
                $query .= " AND e.classe = :classe";
                $params[':classe'] = $classe;
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
            $results = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            
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
                return $m['statut'] === 'autorise';
            }));
            
            $totalAbsences = count(array_filter($movements, function($m) {
                return $m['statut'] === 'absent';
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
