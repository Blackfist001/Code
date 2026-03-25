<?php
namespace App\Controller;

use App\Model\StudentsModel;
use App\Model\UsersModel;
use Exception;

class GestionController {
    private StudentsModel $studentsModel;
    private UsersModel $usersModel;

    public function __construct() {
        $this->studentsModel = new StudentsModel();
        $this->usersModel = new UsersModel();
    }

    /**
     * Affiche la page de gestion
     */
    public function index() {
        require_once __DIR__ . '/../view/historicalView.php';
    }

    /**
     * API : Ajouter un étudiant
     */
    public function addStudent($params = []) {
        header('Content-Type: application/json');
        
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input || empty($input['nom'])) {
                echo json_encode([
                    'success' => false,
                    'message' => 'Données invalides'
                ]);
                exit;
            }

            // Insérer via SQL direct (à améliorer avec addStudent method)
            $pdo = (new \App\Core\DataBase())->getPdo();
            $stmt = $pdo->prepare("INSERT INTO etudiants (nom, prenom, classe, sourcedId) 
                                   VALUES (:nom, :prenom, :classe, :sourcedId)");
            
            $stmt->execute([
                ':nom' => $input['nom'],
                ':prenom' => $input['prenom'] ?? '',
                ':classe' => $input['classe'] ?? '',
                ':sourcedId' => $input['sourcedId'] ?? uniqid()
            ]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Étudiant ajouté avec succès'
            ]);
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * API : Lister tous les étudiants
     */
    public function listStudents($params = []) {
        header('Content-Type: application/json');
        
        try {
            $students = $this->studentsModel->getAllStudents();
            
            echo json_encode([
                'success' => true,
                'count' => count($students),
                'results' => $students
            ]);
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * API : Supprimer un étudiant
     */
    public function deleteStudent($params = []) {
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
            $stmt = $pdo->prepare("DELETE FROM etudiants WHERE id_etudiant = :id");
            $stmt->execute([':id' => $input['id_etudiant']]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Étudiant supprimé'
            ]);
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * API : Lister tous les utilisateurs
     */
    public function listUsers($params = []) {
        header('Content-Type: application/json');
        
        try {
            $users = $this->usersModel->getAllUsers();
            
            echo json_encode([
                'success' => true,
                'count' => count($users),
                'results' => $users
            ]);
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * API : Importer des étudiants depuis fichier CSV
     */
    public function importStudents($params = []) {
        header('Content-Type: application/json');
        
        try {
            if (!isset($_FILES['file'])) {
                echo json_encode([
                    'success' => false,
                    'message' => 'Aucun fichier fourni'
                ]);
                exit;
            }

            $file = $_FILES['file']['tmp_name'];
            $handle = fopen($file, 'r');
            $count = 0;
            $pdo = (new \App\Core\DataBase())->getPdo();
            
            while (($row = fgetcsv($handle)) !== false) {
                if (count($row) >= 2) {
                    $stmt = $pdo->prepare("INSERT INTO etudiants (nom, prenom, classe, sourcedId) 
                                          VALUES (:nom, :prenom, :classe, :sourcedId)");
                    
                    $stmt->execute([
                        ':nom' => $row[0],
                        ':prenom' => $row[1] ?? '',
                        ':classe' => $row[2] ?? '',
                        ':sourcedId' => $row[3] ?? uniqid()
                    ]);
                    $count++;
                }
            }
            
            fclose($handle);
            
            echo json_encode([
                'success' => true,
                'message' => "$count étudiants importés"
            ]);
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }
    }
}
