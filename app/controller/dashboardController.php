<?php
namespace App\Controller;

use App\Model\StudentsModel;
use App\Model\MovementsModel;
use Exception;

class DashboardController {
    private StudentsModel $studentsModel;
    private MovementsModel $movementsModel;

    public function __construct() {
        $this->studentsModel = new StudentsModel();
        $this->movementsModel = new MovementsModel();
    }

    /**
     * Affiche la page dashboard
     */
    public function index() {
        require_once __DIR__ . '/../view/dashboardView.php';
    }

    /**
     * API : Retourne les statistiques du dashboard
     */
    public function getStats($params = []) {
        header('Content-Type: application/json');
        
        try {
            $students = $this->studentsModel->getAllStudents();
            $movements = $this->movementsModel->getAllMovements();
            
            $todayMovements = array_filter($movements, function($m) {
                return $m['date_passage'] === date('Y-m-d');
            });

            $presentStatus = ['Présent', 'Autorisé', 'En retard'];
            $absentStatus = ['Absent', 'Absence justifiée'];

            $presentIds = [];
            $absentIds = [];

            foreach ($todayMovements as $movement) {
                $studentId = isset($movement['id_etudiant']) ? (int)$movement['id_etudiant'] : 0;
                if ($studentId <= 0) {
                    continue;
                }

                $status = $movement['statut'] ?? '';
                if (in_array($status, $presentStatus, true)) {
                    $presentIds[$studentId] = true;
                }
                if (in_array($status, $absentStatus, true)) {
                    $absentIds[$studentId] = true;
                }
            }

            // Un élève compté présent aujourd'hui ne doit pas être aussi compté absent.
            foreach (array_keys($presentIds) as $presentId) {
                unset($absentIds[$presentId]);
            }

            $presentToday = count($presentIds);
            $absentToday = count($absentIds);
            
            $stats = [
                'success' => true,
                'total_students' => count($students),
                'total_scans' => count($todayMovements),
                'present_today' => $presentToday,
                'absent_today' => $absentToday
            ];
            
            echo json_encode($stats);
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * API : Retourne les passages d'aujourd'hui
     */
    public function getTodayMovements($params = []) {
        header('Content-Type: application/json');
        
        try {
            $movements = $this->movementsModel->getAllMovements();
            
            $today = array_filter($movements, function($m) {
                return $m['date_passage'] === date('Y-m-d');
            });
            
            echo json_encode([
                'success' => true,
                'count' => count($today),
                'results' => array_values($today)
            ]);
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * API : Retourne les derniers passages (pour affichage temps réel)
     */
    public function getRecentMovements($params = []) {
        header('Content-Type: application/json');
        
        try {
            $movements = $this->movementsModel->getAllMovements();
            
            // Trier par date/heure décroissante et prendre les 10 premiers
            usort($movements, function($a, $b) {
                $timeA = strtotime($a['date_passage'] . ' ' . $a['heure_passage']);
                $timeB = strtotime($b['date_passage'] . ' ' . $b['heure_passage']);
                return $timeB - $timeA;
            });
            
            $recent = array_slice($movements, 0, 10);
            
            echo json_encode([
                'success' => true,
                'count' => count($recent),
                'results' => $recent
            ]);
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }
    }
}
