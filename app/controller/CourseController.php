<?php
namespace App\Controller;

use App\Model\CourseModel;
use Exception;

class CourseController {
    private CourseModel $courseModel;

    public function __construct() {
        $this->courseModel = new CourseModel();
    }

    /**
     * API : Récupérer toutes les matières
     *
     * @return void Réponse JSON {success, count, results[]}
     */
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

    /**
     * API : Récupérer une matière par son ID
     *
     * @param array $params Paramètres de route, doit contenir 'id'
     * @return void Réponse JSON {success, result}
     */
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

    /**
    * API : Rechercher des matières par filtres (id, matiere, id_professeur)
     *
     * @return void Réponse JSON {success, count, results[]}
     */
    public function search() {
        header('Content-Type: application/json');

        try {
            $body = json_decode(file_get_contents('php://input'), true) ?: [];
            $filters = [
                'id' => $_GET['id'] ?? ($body['id'] ?? ''),
                'matiere' => $_GET['matiere'] ?? ($body['matiere'] ?? ''),
                'id_professeur' => $_GET['id_professeur'] ?? ($body['id_professeur'] ?? ''),
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

    /**
     * API : Ajouter une matière
     *
     * @return void Réponse JSON {success, message}
     * @throws \RuntimeException('DUPLICATE') si le nom de matière est déjà utilisé
     */
    public function add() {
        header('Content-Type: application/json');

        try {
            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input || empty($input['matiere'])) {
                echo json_encode(['success' => false, 'message' => 'Nom de matiere requis']);
                return;
            }

            $success = $this->courseModel->addMatiere($input);
            echo json_encode(['success' => true, 'message' => 'Matiere ajoutee']);
        } catch (\RuntimeException $e) {
            if ($e->getMessage() === 'DUPLICATE') {
                echo json_encode([
                    'success' => false,
                    'message' => "Matière déjà encodée — vous ne pouvez pas encoder plusieurs fois une même matière."
                ]);
            } elseif ($e->getMessage() === 'TEACHER_NOT_FOUND') {
                echo json_encode([
                    'success' => false,
                    'message' => "Professeur introuvable — vérifiez l'identifiant du professeur pour cette matière."
                ]);
            } else {
                echo json_encode(['success' => false, 'message' => $e->getMessage()]);
            }
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * API : Mettre à jour une matière
     *
     * @return void Réponse JSON {success, message}
     * @throws \RuntimeException('DUPLICATE') si le nouveau nom est déjà utilisé par une autre matière
     */
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
        } catch (\RuntimeException $e) {
            if ($e->getMessage() === 'DUPLICATE') {
                echo json_encode(['success' => false, 'message' => "Matière déjà encodée — ce nom est utilisé par une autre matière."]);
            } elseif ($e->getMessage() === 'TEACHER_NOT_FOUND') {
                echo json_encode(['success' => false, 'message' => "Professeur introuvable — vérifiez l'identifiant du professeur pour cette matière."]);
            } else {
                echo json_encode(['success' => false, 'message' => $e->getMessage()]);
            }
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * API : Supprimer une matière
     *
     * @return void Réponse JSON {success, message}
     * @throws \RuntimeException('USED_IN_SCHEDULES') si la matière est référencée dans des horaires
     */
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
        } catch (\RuntimeException $e) {
            if ($e->getMessage() === 'USED_IN_SCHEDULES') {
                echo json_encode(['success' => false, 'message' => "Suppression impossible — cette matière est utilisée dans des horaires de cours. Supprimez d'abord les horaires associés."]);
            } else {
                echo json_encode(['success' => false, 'message' => $e->getMessage()]);
            }
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }
}
