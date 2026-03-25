<?php
namespace App\Controller;

use App\Model\MovementsModel;
use Exception;

class HistoricalController {
    private MovementsModel $movementsModel;

    public function __construct() {
        $this->movementsModel = new MovementsModel();
    }

    /**
     * Affiche la page historique
     */
    public function index() {
        require_once __DIR__ . '/../view/historicalView.php';
    }

    /**
     * API : Obtenir tous les passages avec filtres
     */
    public function getPassages($params = []) {
        header('Content-Type: application/json');
        
        try {
            $dateFrom = $_GET['date_from'] ?? date('Y-m-01', strtotime('-1 month'));
            $dateTo = $_GET['date_to'] ?? date('Y-m-d');
            $studentId = $_GET['student_id'] ?? null;
            $typePassage = $_GET['type_passage'] ?? null;
            
            $pdo = (new \App\Core\DataBase())->getPdo();
            
            $query = "SELECT p.*, e.nom, e.prenom, e.classe 
                      FROM passages p
                      JOIN etudiants e ON p.id_etudiant = e.id_etudiant
                      WHERE p.date_passage BETWEEN :date_from AND :date_to";
            
            $bindParams = [
                ':date_from' => $dateFrom,
                ':date_to' => $dateTo
            ];
            
            if ($studentId) {
                $query .= " AND p.id_etudiant = :student_id";
                $bindParams[':student_id'] = $studentId;
            }
            
            if ($typePassage) {
                $query .= " AND p.type_passage = :type_passage";
                $bindParams[':type_passage'] = $typePassage;
            }
            
            $query .= " ORDER BY p.date_passage DESC, p.heure_passage DESC";
            
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

    /**
     * API : Statistiques par date
     */
    public function getStatsByDate($params = []) {
        header('Content-Type: application/json');
        
        try {
            $dateFrom = $_GET['date_from'] ?? date('Y-m-01', strtotime('-1 month'));
            $dateTo = $_GET['date_to'] ?? date('Y-m-d');
            
            $pdo = (new \App\Core\DataBase())->getPdo();
            
            $query = "SELECT 
                        p.date_passage,
                        COUNT(*) as total,
                        SUM(CASE WHEN p.type_passage = 'entree_matin' THEN 1 ELSE 0 END) as entrees,
                        SUM(CASE WHEN p.type_passage = 'sortie_midi' THEN 1 ELSE 0 END) as sorties,
                        SUM(CASE WHEN p.statut = 'absent' THEN 1 ELSE 0 END) as absents
                      FROM passages p
                      WHERE p.date_passage BETWEEN :date_from AND :date_to
                      GROUP BY p.date_passage
                      ORDER BY p.date_passage DESC";
            
            $stmt = $pdo->prepare($query);
            $stmt->execute([
                ':date_from' => $dateFrom,
                ':date_to' => $dateTo
            ]);
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
     * API : Exporter l'historique en CSV
     */
    public function exportCSV($params = []) {
        try {
            $dateFrom = $_GET['date_from'] ?? date('Y-m-01', strtotime('-1 month'));
            $dateTo = $_GET['date_to'] ?? date('Y-m-d');
            
            $pdo = (new \App\Core\DataBase())->getPdo();
            
            $query = "SELECT p.*, e.nom, e.prenom, e.classe 
                      FROM passages p
                      JOIN etudiants e ON p.id_etudiant = e.id_etudiant
                      WHERE p.date_passage BETWEEN :date_from AND :date_to
                      ORDER BY p.date_passage DESC";
            
            $stmt = $pdo->prepare($query);
            $stmt->execute([
                ':date_from' => $dateFrom,
                ':date_to' => $dateTo
            ]);
            $results = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            
            // Préparer le CSV
            header('Content-Type: text/csv');
            header('Content-Disposition: attachment; filename="passages_' . date('Y-m-d') . '.csv"');
            
            $output = fopen('php://output', 'w');
            
            // En-têtes
            fputcsv($output, ['Date', 'Heure', 'Nom', 'Prénom', 'Classe', 'Type', 'Statut']);
            
            // Données
            foreach ($results as $row) {
                fputcsv($output, [
                    $row['date_passage'],
                    $row['heure_passage'],
                    $row['nom'],
                    $row['prenom'],
                    $row['classe'],
                    $row['type_passage'],
                    $row['statut']
                ]);
            }
            
            fclose($output);
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * API : Obtenir les statistiques par classe
     */
    public function getStatsByClass($params = []) {
        header('Content-Type: application/json');
        
        try {
            $dateFrom = $_GET['date_from'] ?? date('Y-m-01', strtotime('-1 month'));
            $dateTo = $_GET['date_to'] ?? date('Y-m-d');
            
            $pdo = (new \App\Core\DataBase())->getPdo();
            
            $query = "SELECT 
                        e.classe,
                        COUNT(DISTINCT e.id_etudiant) as total_students,
                        COUNT(p.id_passage) as total_passages,
                        COUNT(DISTINCT CASE WHEN p.statut = 'absent' THEN p.id_etudiant END) as total_absents
                      FROM etudiants e
                      LEFT JOIN passages p ON e.id_etudiant = p.id_etudiant 
                                            AND p.date_passage BETWEEN :date_from AND :date_to
                      GROUP BY e.classe
                      ORDER BY e.classe";
            
            $stmt = $pdo->prepare($query);
            $stmt->execute([
                ':date_from' => $dateFrom,
                ':date_to' => $dateTo
            ]);
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
