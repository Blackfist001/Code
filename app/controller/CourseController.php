<?php
namespace App\Controller;

use App\Model\CourseModel;
use Exception;

class CourseController {
    private CourseModel $courseModel;

    public function __construct() {
        $this->courseModel = new CourseModel();
    }

    public function getAll() {
        header('Content-Type: application/json');

        try {
            $courses = $this->courseModel->getAllMatieres();
            echo json_encode([
                'success' => true,
                'count' => count($courses),
                'results' => $courses,
            ]);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public function getById($params) {
        header('Content-Type: application/json');

        try {
            $id = isset($params['id']) ? (int)$params['id'] : 0;
            if ($id <= 0) {
                echo json_encode(['success' => false, 'message' => 'ID matiere requis']);
                return;
            }

            $course = $this->courseModel->getMatiereById($id);
            if (!$course) {
                echo json_encode(['success' => false, 'message' => 'Matiere non trouvee']);
                return;
            }

            echo json_encode(['success' => true, 'result' => $course]);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public function search() {
        header('Content-Type: application/json');

        try {
            $body = json_decode(file_get_contents('php://input'), true) ?: [];
            $filters = [
                'id' => $_GET['id'] ?? ($body['id'] ?? ''),
                'matiere' => $_GET['matiere'] ?? ($body['matiere'] ?? ''),
            ];

            $results = $this->courseModel->searchMatieres($filters);
            echo json_encode([
                'success' => true,
                'count' => count($results),
                'results' => $results,
            ]);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public function add() {
        header('Content-Type: application/json');

        try {
            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input || empty($input['matiere'])) {
                echo json_encode(['success' => false, 'message' => 'Nom de matiere requis']);
                return;
            }

            $success = $this->courseModel->addMatiere($input);
            echo json_encode($success
                ? ['success' => true, 'message' => 'Matiere ajoutee']
                : ['success' => false, 'message' => 'Erreur lors de l\'ajout']);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public function update() {
        header('Content-Type: application/json');

        try {
            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input || !isset($input['id'])) {
                echo json_encode(['success' => false, 'message' => 'ID requis']);
                return;
            }

            $id = (int)$input['id'];
            unset($input['id']);

            $success = $this->courseModel->updateMatiere($id, $input);
            echo json_encode($success
                ? ['success' => true, 'message' => 'Matiere mise a jour']
                : ['success' => false, 'message' => 'Erreur lors de la mise a jour']);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public function delete() {
        header('Content-Type: application/json');

        try {
            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input || !isset($input['id'])) {
                echo json_encode(['success' => false, 'message' => 'ID requis']);
                return;
            }

            $success = $this->courseModel->deleteMatiere((int)$input['id']);
            echo json_encode($success
                ? ['success' => true, 'message' => 'Matiere supprimee']
                : ['success' => false, 'message' => 'Suppression impossible']);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }
}
