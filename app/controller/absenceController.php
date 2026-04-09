<?php
namespace App\Controller;

use App\Model\MovementsModel;
use App\Model\ClassesModel;
use Exception;

class AbsenceController {
    private MovementsModel $movementsModel;
    private ClassesModel $classesModel;

    public function __construct() {
        $this->movementsModel = new MovementsModel();
        $this->classesModel = new ClassesModel();
    }

    private function getClassMapById(): array {
        $map = [];
        foreach ($this->classesModel->getAllClasses() as $class) {
            $map[(int)$class['id_classe']] = $class['classe'];
        }
        return $map;
    }

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
     * Affiche la page des absences
     */
    public function index() {
        require_once __DIR__ . '/../view/absenceView.php';
    }

    /**
     * API : Obtenir les absents d'aujourd'hui
     */
    public function getTodayAbsents($params = []) {
        header('Content-Type: application/json');
        
        try {
            $pdo = (new \App\Core\DataBase())->getPdo();

            // Récupérer les passages avec statut 'Absent' ou 'Absence justifiée' du jour
            $stmt = $pdo->prepare("
                SELECT p.id_passage, p.id_etudiant, p.date_passage, p.heure_passage,
                       p.type_passage, p.statut,
                                             e.nom, e.prenom, e.classe
                FROM passages p
                JOIN etudiants e ON p.id_etudiant = e.id_etudiant
                WHERE p.date_passage = :today
                  AND p.statut IN ('Absent', 'Absence justifiée')
                ORDER BY e.nom, e.prenom
            ");
            $stmt->execute([':today' => date('Y-m-d')]);
                        $absents = $this->enrichClasseNom($stmt->fetchAll(\PDO::FETCH_ASSOC));

            echo json_encode([
                'success' => true,
                'count' => count($absents),
                'results' => $absents
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
                ':type_passage' => 'Journée',
                ':statut' => 'Absent'
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
                ':type_passage' => 'Journée',
                ':statut' => 'Absence justifiée'
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
                      AND p.statut IN ('Absent', 'Absence justifiée')";
            
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
}
