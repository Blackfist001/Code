<?php
namespace App\Controller;

use App\Model\UsersModel;
use App\Service\ValidationService;
use Exception;

class UsersController {
    private UsersModel $usersModel;

    public function __construct() {
        $this->usersModel = new UsersModel();
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
     * API: Récupérer tous les utilisateurs
     */
    public function getAll() {
        header('Content-Type: application/json');

        try {
            // Vérifier l'authentification et les rôles - Seulement Gestionnaire et Administrateur
            $this->requireRole('Gestionnaire', 'Administrateur');
            
            $users = $this->usersModel->getAllUsers();
            echo json_encode([
                'success' => true,
                'count' => count($users),
                'results' => $users
            ]);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * API: Ajouter un utilisateur
     */
    public function add() {
        header('Content-Type: application/json');

        try {
            // Vérifier l'authentification et les rôles - Seulement Gestionnaire et Administrateur
            $this->requireRole('Gestionnaire', 'Administrateur');
            
            $input = json_decode(file_get_contents('php://input'), true);

            if (!$input || !isset($input['username']) || !isset($input['password'])) {
                echo json_encode(['success' => false, 'message' => 'Données invalides']);
                return;
            }

            // Valider les données saisies
            if (!ValidationService::validateString($input['username'], 3, 50)) {
                echo json_encode(['success' => false, 'message' => 'Nom d\'utilisateur invalide (3-50 caractères)']);
                return;
            }

            if (!ValidationService::validateString($input['password'], 8, 128)) {
                echo json_encode(['success' => false, 'message' => 'Mot de passe invalide (minimum 8 caractères)']);
                return;
            }

            $success = $this->usersModel->addUser($input);

            if ($success) {
                echo json_encode(['success' => true, 'message' => 'Utilisateur ajouté']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Erreur lors de l\'ajout']);
            }
        } catch (\RuntimeException $e) {
            if ($e->getMessage() === 'DUPLICATE') {
                echo json_encode(['success' => false, 'message' => "Nom d'utilisateur déjà utilisé — veuillez choisir un autre nom."]);
            } else {
                echo json_encode(['success' => false, 'message' => $e->getMessage()]);
            }
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * API: Supprimer un utilisateur
     */
    public function delete() {
        header('Content-Type: application/json');

        try {
            // Vérifier l'authentification et les rôles - Seulement Gestionnaire et Administrateur
            $this->requireRole('Gestionnaire', 'Administrateur');
            
            $input = json_decode(file_get_contents('php://input'), true);

            if (!$input || !isset($input['id'])) {
                echo json_encode(['success' => false, 'message' => 'ID requis']);
                return;
            }

            if (!ValidationService::validateId($input['id'])) {
                echo json_encode(['success' => false, 'message' => 'ID invalide']);
                return;
            }

            $result = $this->usersModel->deleteUser($input['id']);

            if ($result === 'protected') {
                echo json_encode(['success' => false, 'message' => 'L\'utilisateur admin ne peut pas être supprimé.']);
            } elseif ($result) {
                echo json_encode(['success' => true, 'message' => 'Utilisateur supprimé']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Erreur lors de la suppression']);
            }
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * API: Mettre à jour un utilisateur
     */
    public function update() {
        header('Content-Type: application/json');

        try {
            // Vérifier l'authentification et les rôles - Seulement Gestionnaire et Administrateur
            $this->requireRole('Gestionnaire', 'Administrateur');
            
            $input = json_decode(file_get_contents('php://input'), true);

            if (!$input || !isset($input['id'])) {
                echo json_encode(['success' => false, 'message' => 'ID requis']);
                return;
            }

            if (!ValidationService::validateId($input['id'])) {
                echo json_encode(['success' => false, 'message' => 'ID invalide']);
                return;
            }

            $userId = $input['id'];
            unset($input['id']);

            $success = $this->usersModel->updateUser($userId, $input);

            if ($success) {
                echo json_encode(['success' => true, 'message' => 'Utilisateur mis à jour']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Erreur lors de la mise à jour']);
            }
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }
}