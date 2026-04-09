<?php
namespace App\Controller;

use App\Model\UsersModel;
use Exception;

class ManagementController {
    private UsersModel $usersModel;

    public function __construct() {
        $this->usersModel = new UsersModel();
    }

    /**
     * Affiche la page de gestion
     */
    public function index() {
        require_once __DIR__ . '/../view/historicalView.php';
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
     * API : Ajouter un utilisateur
     */
    public function addUser($params = []) {
        header('Content-Type: application/json');
        
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input || empty($input['username']) || empty($input['password']) || empty($input['role'])) {
                echo json_encode([
                    'success' => false,
                    'message' => 'Données invalides : username, password et role requis'
                ]);
                exit;
            }

            // Hash du mot de passe
            $hashedPassword = password_hash($input['password'], PASSWORD_DEFAULT);
            
            $userData = [
                'username' => $input['username'],
                'password' => $hashedPassword,
                'role' => $input['role']
            ];

            $result = $this->usersModel->addUser($userData);
            
            if ($result) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Utilisateur ajouté avec succès'
                ]);
            } else {
                echo json_encode([
                    'success' => false,
                    'message' => 'Erreur lors de l\'ajout de l\'utilisateur'
                ]);
            }
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => 'Erreur: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * API : Mettre à jour un utilisateur
     */
    public function updateUser($params = []) {
        header('Content-Type: application/json');
        
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input || !isset($input['id'])) {
                echo json_encode([
                    'success' => false,
                    'message' => 'ID utilisateur requis'
                ]);
                exit;
            }

            $userId = $input['id'];
            $updateData = [];

            if (isset($input['username'])) {
                $updateData['username'] = $input['username'];
            }
            if (isset($input['password']) && !empty($input['password'])) {
                $updateData['password'] = password_hash($input['password'], PASSWORD_DEFAULT);
            }
            if (isset($input['role'])) {
                $updateData['role'] = $input['role'];
            }

            if (empty($updateData)) {
                echo json_encode([
                    'success' => false,
                    'message' => 'Aucune donnée à mettre à jour'
                ]);
                exit;
            }

            $result = $this->usersModel->updateUser($userId, $updateData);
            
            if ($result) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Utilisateur mis à jour avec succès'
                ]);
            } else {
                echo json_encode([
                    'success' => false,
                    'message' => 'Erreur lors de la mise à jour de l\'utilisateur'
                ]);
            }
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => 'Erreur: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * API : Supprimer un utilisateur
     */
    public function deleteUser($params = []) {
        header('Content-Type: application/json');
        
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input || !isset($input['id'])) {
                echo json_encode([
                    'success' => false,
                    'message' => 'ID utilisateur requis'
                ]);
                exit;
            }

            $userId = $input['id'];
            $result = $this->usersModel->deleteUser($userId);
            
            if ($result) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Utilisateur supprimé avec succès'
                ]);
            } else {
                echo json_encode([
                    'success' => false,
                    'message' => 'Erreur lors de la suppression de l\'utilisateur'
                ]);
            }
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => 'Erreur: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * API : Obtenir un utilisateur par ID
     */
    public function getUser($params = []) {
        header('Content-Type: application/json');
        
        try {
            if (!isset($params['id'])) {
                echo json_encode([
                    'success' => false,
                    'message' => 'ID utilisateur requis'
                ]);
                exit;
            }

            $userId = $params['id'];
            $user = $this->usersModel->getUserById($userId);
            
            if ($user) {
                echo json_encode([
                    'success' => true,
                    'result' => $user
                ]);
            } else {
                echo json_encode([
                    'success' => false,
                    'message' => 'Utilisateur non trouvé'
                ]);
            }
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => 'Erreur: ' . $e->getMessage()
            ]);
        }
    }
}
