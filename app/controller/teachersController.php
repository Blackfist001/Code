<?php
namespace App\Controller;

use App\Model\TeachersModel;
use App\Service\ValidationService;
use Exception;

class TeachersController {
    private $teachersModel;

    public function __construct() {
        $this->teachersModel = new TeachersModel();
    }

    private function requireRole(...$allowedRoles) {
        if (!isset($_SESSION['user_id'])) {
            http_response_code(401);
            throw new Exception('Non authentifié');
        }

        $userRole = $_SESSION['role'] ?? null;
        if (!in_array($userRole, $allowedRoles)) {
            http_response_code(403);
            throw new Exception('Accès refusé: rôle insuffisant');
        }
    }

    public function getAll($params = []): void {
        header('Content-Type: application/json');

        try {
            $this->requireRole('Gestionnaire', 'Administrateur');

            $teachers = $this->teachersModel->getAllTeachers();
            echo json_encode([
                'success' => true,
                'count' => count($teachers),
                'results' => $teachers,
            ]);
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage(),
            ]);
        }
    }

    public function add(): void {
        header('Content-Type: application/json');

        try {
            $this->requireRole('Gestionnaire', 'Administrateur');

            $input = json_decode(file_get_contents('php://input'), true);

            if (!$input) {
                echo json_encode(['success' => false, 'message' => 'Données invalides']);
                return;
            }

            foreach (['nom', 'prenom', 'email', 'username'] as $field) {
                if (!isset($input[$field]) || !ValidationService::validateString(trim((string)$input[$field]), 1, 255)) {
                    echo json_encode(['success' => false, 'message' => ucfirst($field) . ' invalide']);
                    return;
                }
            }

            if (!ValidationService::validateEmail($input['email'])) {
                echo json_encode(['success' => false, 'message' => 'Email invalide']);
                return;
            }

            if (!ValidationService::validateUsername($input['username'], 3, 100)) {
                echo json_encode(['success' => false, 'message' => 'Username invalide']);
                return;
            }

            $success = $this->teachersModel->addTeacher([
                'nom' => trim((string)$input['nom']),
                'prenom' => trim((string)$input['prenom']),
                'email' => trim((string)$input['email']),
                'username' => trim((string)$input['username']),
                'enabled_user' => $input['enabled_user'] ?? 1,
            ]);

            if ($success) {
                echo json_encode(['success' => true, 'message' => 'Professeur ajouté']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Erreur lors de l\'ajout']);
            }
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public function update(): void {
        header('Content-Type: application/json');

        try {
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

            $teacherId = (int)$input['id'];
            unset($input['id']);

            foreach (['nom', 'prenom', 'email', 'username'] as $field) {
                if (isset($input[$field]) && !ValidationService::validateString(trim((string)$input[$field]), 1, 255)) {
                    echo json_encode(['success' => false, 'message' => ucfirst($field) . ' invalide']);
                    return;
                }
            }

            if (isset($input['email']) && !ValidationService::validateEmail($input['email'])) {
                echo json_encode(['success' => false, 'message' => 'Email invalide']);
                return;
            }

            if (isset($input['username']) && !ValidationService::validateUsername($input['username'], 3, 100)) {
                echo json_encode(['success' => false, 'message' => 'Username invalide']);
                return;
            }

            $normalized = [];
            foreach (['nom', 'prenom', 'email', 'username'] as $field) {
                if (array_key_exists($field, $input)) {
                    $normalized[$field] = trim((string)$input[$field]);
                }
            }

            $success = $this->teachersModel->updateTeacher($teacherId, $normalized);

            if ($success) {
                echo json_encode(['success' => true, 'message' => 'Professeur mis à jour']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Erreur lors de la mise à jour']);
            }
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public function delete(): void {
        header('Content-Type: application/json');

        try {
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

            $success = $this->teachersModel->deleteTeacher((int)$input['id']);

            if ($success) {
                echo json_encode(['success' => true, 'message' => 'Professeur supprimé']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Erreur lors de la suppression']);
            }
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }
}
