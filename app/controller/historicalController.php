<?php
namespace App\Controller;

use App\Model\MovementsModel;
use App\Model\ClassesModel;
use Exception;

class HistoricalController {
    private MovementsModel $movementsModel;
    private ClassesModel $classesModel;

    public function __construct() {
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
                                                SUM(CASE WHEN p.statut = 'Autorisé' THEN 1 ELSE 0 END) as autorise_count,
                                                SUM(CASE WHEN p.statut = 'Refusé' THEN 1 ELSE 0 END) as refuse_count,
                                                SUM(CASE WHEN p.statut = 'Absence justifiée' THEN 1 ELSE 0 END) as absence_justifiee_count,
                                                SUM(CASE WHEN p.statut = 'Sortie justifiée' THEN 1 ELSE 0 END) as sortie_justifiee_count,
                                                SUM(CASE WHEN p.statut = 'Absent' THEN 1 ELSE 0 END) as absent_count,
                                                SUM(CASE WHEN p.statut = 'En retard' THEN 1 ELSE 0 END) as en_retard_count,
                                                SUM(CASE WHEN p.statut = 'Présent' THEN 1 ELSE 0 END) as present_count
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

            // Nettoyer les dates pour le nom de fichier.
            $safeDateFrom = preg_replace('/[^0-9\-]/', '', (string)$dateFrom);
            $safeDateTo = preg_replace('/[^0-9\-]/', '', (string)$dateTo);
            $filename = sprintf('Historique_Passages_%s_%s.csv', $safeDateFrom, $safeDateTo);
            
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
            $results = $this->enrichClasseNom($stmt->fetchAll(\PDO::FETCH_ASSOC));
            
            // Préparer le CSV
            if (ob_get_length()) {
                ob_clean();
            }
            header('Content-Type: text/csv; charset=UTF-16LE');
            header('Content-Disposition: attachment; filename="' . $filename . '"');
            header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
            header('Pragma: no-cache');
            
            $output = fopen('php://output', 'w');
            // Excel Windows interprète plus fiablement les accents en UTF-16LE.
            fwrite($output, "\xFF\xFE");
            stream_filter_append($output, 'convert.iconv.UTF-8/UTF-16LE');
            fwrite($output, "sep=;\r\n");
            
            // En-têtes
            fputcsv($output, ['Date', 'Heure', 'Nom', 'Prénom', 'Classe', 'Type', 'Statut'], ';');
            
            // Données
            foreach ($results as $row) {
                fputcsv($output, [
                    $row['date_passage'],
                    $row['heure_passage'],
                    $row['nom'],
                    $row['prenom'],
                    $row['classe'] ?? '',
                    $row['type_passage'],
                    $row['statut']
                ], ';');
            }
            
            fclose($output);
            exit;
        } catch (Exception $e) {
            header('Content-Type: application/json');
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
                                                e.classe as classe,
                        COUNT(DISTINCT e.id_etudiant) as total_students,
                        COUNT(p.id_passage) as total_passages,
                        COUNT(DISTINCT CASE WHEN p.statut = 'Absent' THEN p.id_etudiant END) as total_absents
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
