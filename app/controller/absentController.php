<?php
namespace App\Controller;

use App\Model\MovementsModel;
use Exception;

class AbsentController {
    private MovementsModel $movementsModel;

    public function __construct() {
        $this->movementsModel = new MovementsModel();
    }

    /**
     * Affiche la page des absences
     */
    public function index() {
        require_once __DIR__ . '/../view/absentView.php';
    }

    /**
     * API : Obtenir les absents d'aujourd'hui
     */
    public function getTodayAbsents($params = []) {
        header('Content-Type: application/json');
        
        try {
            $pdo = (new \App\Core\DataBase())->getPdo();
            
            // Tous les étudiants
            $stmtAll = $pdo->query("SELECT * FROM etudiants");
            $allStudents = $stmtAll->fetchAll(\PDO::FETCH_ASSOC);
            
            // Étudiants présents aujourd'hui
            $stmtPresent = $pdo->prepare("
                SELECT DISTINCT p.id_etudiant FROM passages p
                WHERE p.date_passage = :today AND p.statut = 'autorise'
            ");
            $stmtPresent->execute([':today' => date('Y-m-d')]);
            $presentStudents = array_map(function($p) {
                return $p['id_etudiant'];
            }, $stmtPresent->fetchAll(\PDO::FETCH_ASSOC));
            
            // Absents = ceux non présents
            $absents = array_filter($allStudents, function($student) use ($presentStudents) {
                return !in_array($student['id_etudiant'], $presentStudents);
            });
            
            echo json_encode([
                'success' => true,
                'count' => count($absents),
                'results' => array_values($absents)
            ]);
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * API : Marquer une absence
     */
    public function markAbsent($params = []) {
        header('Content-Type: application/json');
        
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input || !isset($input['id_etudiant'])) {
                echo json_encode([
                    'success' => false,
                    'message' => 'ID étudiant requis'
                ]);
                exit;
            }

            $reason = $input['reason'] ?? '';
            $pdo = (new \App\Core\DataBase())->getPdo();
            
            $stmt = $pdo->prepare("
                INSERT INTO passages (id_etudiant, date_passage, heure_passage, type_passage, statut)
                VALUES (:id_etudiant, :date_passage, :heure_passage, :type_passage, :statut)
            ");
            
            $stmt->execute([
                ':id_etudiant' => $input['id_etudiant'],
                ':date_passage' => date('Y-m-d'),
                ':heure_passage' => date('H:i:s'),
                ':type_passage' => 'absent',
                ':statut' => 'absent'
            ]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Absence enregistrée'
            ]);
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * API : Marquer une absence justifiée
     */
    public function markJustifiedAbsent($params = []) {
        header('Content-Type: application/json');
        
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input || !isset($input['id_etudiant'])) {
                echo json_encode([
                    'success' => false,
                    'message' => 'ID étudiant requis'
                ]);
                exit;
            }

            $pdo = (new \App\Core\DataBase())->getPdo();
            
            $stmt = $pdo->prepare("
                INSERT INTO passages (id_etudiant, date_passage, heure_passage, type_passage, statut)
                VALUES (:id_etudiant, :date_passage, :heure_passage, :type_passage, :statut)
            ");
            
            $stmt->execute([
                ':id_etudiant' => $input['id_etudiant'],
                ':date_passage' => date('Y-m-d'),
                ':heure_passage' => date('H:i:s'),
                ':type_passage' => 'absence_justifie',
                ':statut' => 'absence_justifie'
            ]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Absence justifiée enregistrée'
            ]);
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * API : Obtenir l'historique des absents
     */
    public function getAbsentHistory($params = []) {
        header('Content-Type: application/json');
        
        try {
            $dateFrom = $_GET['date_from'] ?? date('Y-m-01', strtotime('-1 month'));
            $dateTo = $_GET['date_to'] ?? date('Y-m-d');
            $studentId = $_GET['student_id'] ?? null;
            
            $pdo = (new \App\Core\DataBase())->getPdo();
            
            $query = "SELECT e.*, p.date_passage, p.statut 
                      FROM etudiants e
                      JOIN passages p ON e.id_etudiant = p.id_etudiant
                      WHERE p.date_passage BETWEEN :date_from AND :date_to
                      AND p.statut IN ('absent', 'absence_justifie')";
            
            $bindParams = [
                ':date_from' => $dateFrom,
                ':date_to' => $dateTo
            ];
            
            if ($studentId) {
                $query .= " AND e.id_etudiant = :student_id";
                $bindParams[':student_id'] = $studentId;
            }
            
            $query .= " ORDER BY p.date_passage DESC";
            
            $stmt = $pdo->prepare($query);
            $stmt->execute($bindParams);
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
}
