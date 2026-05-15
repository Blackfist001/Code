<?php
namespace App\Controller;

use App\Model\ClassroomModel;
use App\Service\ValidationService;
use Exception;

class ClassroomController {
    private ClassroomModel $classroomModel;

    public function __construct() {
        $this->classroomModel = new ClassroomModel();
    }

    /**
     * Verifie que l'utilisateur a les roles requis.
     *
     * @param array $allowedRoles Roles autorises
     * @throws Exception Si non authentifie ou role insuffisant
     */
    private function requireRole(...$allowedRoles) {
        if (!isset($_SESSION['user_id'])) {
            http_response_code(401);
            throw new Exception('Non authentifie');
        }

        $userRole = $_SESSION['role'] ?? null;
        if (!in_array($userRole, $allowedRoles)) {
            http_response_code(403);
            throw new Exception('Acces refuse: role insuffisant');
        }
    }

    /**
     * API : Recuperer tous les locaux.
     */
    public function getAll() {
        header('Content-Type: application/json');

        try {
            $classrooms = $this->classroomModel->getAllClassrooms();
            echo json_encode([
                'success' => true,
                'count' => count($classrooms),
                'results' => $classrooms,
            ]);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * API : Ajouter un local.
     */
    public function add() {
        header('Content-Type: application/json');

        try {
            $this->requireRole('Gestionnaire', 'Administrateur');

            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input || empty($input['local'])) {
                echo json_encode(['success' => false, 'message' => 'Nom de local requis']);
                return;
            }

            $success = $this->classroomModel->addClassroom($input);
            echo json_encode($success
                ? ['success' => true, 'message' => 'Local ajoute']
                : ['success' => false, 'message' => 'Erreur lors de l\'ajout']);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * API : Mettre a jour un local.
     */
    public function update() {
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

            $id = (int)$input['id'];
            unset($input['id']);

            $success = $this->classroomModel->updateClassroom($id, $input);
            echo json_encode($success
                ? ['success' => true, 'message' => 'Local mis a jour']
                : ['success' => false, 'message' => 'Erreur lors de la mise a jour']);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * API : Supprimer un local.
     */
    public function delete() {
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

            $success = $this->classroomModel->deleteClassroom((int)$input['id']);
            echo json_encode($success
                ? ['success' => true, 'message' => 'Local supprime']
                : ['success' => false, 'message' => 'Suppression impossible']);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }
}
