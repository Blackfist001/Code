<?php
namespace App\Controller;

use App\Model\StudentsModel;
use Exception;

class StudentsController {
    private StudentsModel $studentsModel;

    public function __construct() {
        $this->studentsModel = new StudentsModel();
    }

    /**
     * API: Récupérer tous les étudiants
     */
    public function getAll() {
        header('Content-Type: application/json');

        try {
            $students = $this->studentsModel->getAllStudents();
            echo json_encode([
                'success' => true,
                'count' => count($students),
                'results' => $students
            ]);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * API: Récupérer un étudiant par ID
     */
    public function getById($params) {
        header('Content-Type: application/json');

        try {
            $studentId = $params['id'] ?? null;

            if (!$studentId) {
                echo json_encode(['success' => false, 'message' => 'ID étudiant requis']);
                return;
            }

            $student = $this->studentsModel->getStudentById($studentId);

            if ($student) {
                echo json_encode(['success' => true, 'result' => $student]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Étudiant non trouvé']);
            }
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * API: Rechercher des étudiants
     */
    public function search() {
        header('Content-Type: application/json');

        try {
            $body = json_decode(file_get_contents('php://input'), true) ?: [];
            $filters = [
                'id' => $_GET['id'] ?? ($body['id'] ?? ''),
                'sourcedId' => $_GET['sourcedId'] ?? ($body['sourcedId'] ?? ''),
                'name' => $_GET['name'] ?? ($body['name'] ?? ''),
                'surname' => $_GET['surname'] ?? ($body['surname'] ?? ''),
                'classe' => $_GET['classe'] ?? ($body['classe'] ?? ''),
                'statut' => $_GET['statut'] ?? ($body['statut'] ?? '')
            ];

            // Vérifier qu'au moins un filtre est fourni
            $hasFilters = array_filter($filters, function($value) {
                return !empty(trim($value));
            });

            if (empty($hasFilters)) {
                echo json_encode(['success' => false, 'message' => 'Au moins un critère de recherche requis']);
                return;
            }

            $results = $this->studentsModel->searchStudents($filters);
            echo json_encode([
                'success' => true,
                'count' => count($results),
                'results' => $results
            ]);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * API: Ajouter un étudiant
     */
    public function add() {
        header('Content-Type: application/json');

        try {
            $input = json_decode(file_get_contents('php://input'), true);

            if (!$input || !isset($input['nom']) || !isset($input['prenom'])) {
                echo json_encode(['success' => false, 'message' => 'Nom et prénom requis']);
                return;
            }

            $success = $this->studentsModel->addStudent($input);

            if ($success) {
                echo json_encode(['success' => true, 'message' => 'Étudiant ajouté']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Erreur lors de l\'ajout']);
            }
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * API: Supprimer un étudiant
     */
    public function delete() {
        header('Content-Type: application/json');

        try {
            $input = json_decode(file_get_contents('php://input'), true);

            if (!$input || !isset($input['id'])) {
                echo json_encode(['success' => false, 'message' => 'ID requis']);
                return;
            }

            $success = $this->studentsModel->deleteStudent($input['id']);

            if ($success) {
                echo json_encode(['success' => true, 'message' => 'Étudiant supprimé']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Erreur lors de la suppression']);
            }
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }
}