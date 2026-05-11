<?php
namespace App\Controller;

use App\Model\ClassesModel;
use App\Service\ValidationService;
use Exception;

class ClassesController {
    private ClassesModel $classesModel;

    public function __construct() {
        $this->classesModel = new ClassesModel();
    }

    /**
     * Vérifie que l'utilisateur a les rôles requis
     *
     * @param array $allowedRoles Rôles autorisés
     * @throws Exception Si non authentifié ou rôle insuffisant
     */
    private function requireRole(...$allowedRoles) {
        if (!isset($_SESSION['user_id'])) {
            http_response_code(401);
            throw new Exception('Non authentifié');
        }
        
        $userRole = $_SESSION['role'] ?? null;
        if (!in_array($userRole, $allowedRoles)) {
            http_response_code(403);
            throw new Exception("Accès refusé: rôle insuffisant");
        }
    }

    /**
     * API : Récupérer toutes les classes
     *
     * @return void Réponse JSON {success, count, results[]}
     */
    public function getAll() {
        header('Content-Type: application/json');

        try {
            $classes = $this->classesModel->getAllClasses();
            echo json_encode([
                'success' => true,
                'count' => count($classes),
                'results' => $classes,
            ]);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * API : Ajouter une classe
     *
     * @return void Réponse JSON {success, message}
     */
    public function add() {
        header('Content-Type: application/json');

        try {
            // Vérifier l'authentification et les rôles - Seulement Gestionnaire
            $this->requireRole('Gestionnaire');
            
            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input || empty($input['classe'])) {
                echo json_encode(['success' => false, 'message' => 'Nom de classe requis']);
                return;
            }

            $success = $this->classesModel->addClass($input);
            echo json_encode($success
                ? ['success' => true, 'message' => 'Classe ajoutee']
                : ['success' => false, 'message' => 'Erreur lors de l\'ajout']);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * API : Mettre à jour une classe
     *
     * @return void Réponse JSON {success, message}
     */
    public function update() {
        header('Content-Type: application/json');

        try {
            // Vérifier l'authentification et les rôles - Seulement Gestionnaire
            $this->requireRole('Gestionnaire');
            
            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input || !isset($input['id'])) {
                echo json_encode(['success' => false, 'message' => 'ID requis']);
                return;
            }

            if (!ValidationService::validateId($input['id'])) {
                echo json_encode(['success' => false, 'message' => 'ID invalide']);
                return;
            }

            $id = (int)$input['id'];
            unset($input['id']);

            $success = $this->classesModel->updateClass($id, $input);
            echo json_encode($success
                ? ['success' => true, 'message' => 'Classe mise a jour']
                : ['success' => false, 'message' => 'Erreur lors de la mise a jour']);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * API : Supprimer une classe
     *
     * @return void Réponse JSON {success, message}
     */
    public function delete() {
        header('Content-Type: application/json');

        try {
            // Vérifier l'authentification et les rôles - Seulement Gestionnaire
            $this->requireRole('Gestionnaire');
            
            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input || !isset($input['id'])) {
                echo json_encode(['success' => false, 'message' => 'ID requis']);
                return;
            }

            if (!ValidationService::validateId($input['id'])) {
                echo json_encode(['success' => false, 'message' => 'ID invalide']);
                return;
            }

            $success = $this->classesModel->deleteClass((int)$input['id']);
            echo json_encode($success
                ? ['success' => true, 'message' => 'Classe supprimee']
                : ['success' => false, 'message' => 'Suppression impossible']);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }
}