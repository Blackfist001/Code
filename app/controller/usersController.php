<?php
namespace App\Controller;

use App\Model\UsersModel;
use Exception;

class UsersController {
    private UsersModel $usersModel;

    public function __construct() {
        $this->usersModel = new UsersModel();
    }

    /**
     * API: Récupérer tous les utilisateurs
     */
    public function getAll() {
        header('Content-Type: application/json');

        try {
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
            $input = json_decode(file_get_contents('php://input'), true);

            if (!$input || !isset($input['username']) || !isset($input['password'])) {
                echo json_encode(['success' => false, 'message' => 'Données invalides']);
                return;
            }

            $success = $this->usersModel->addUser($input);

            if ($success) {
                echo json_encode(['success' => true, 'message' => 'Utilisateur ajouté']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Erreur lors de l\'ajout']);
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
            $input = json_decode(file_get_contents('php://input'), true);

            if (!$input || !isset($input['id'])) {
                echo json_encode(['success' => false, 'message' => 'ID requis']);
                return;
            }

            $success = $this->usersModel->deleteUser($input['id']);

            if ($success) {
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
            $input = json_decode(file_get_contents('php://input'), true);

            if (!$input || !isset($input['id'])) {
                echo json_encode(['success' => false, 'message' => 'ID requis']);
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