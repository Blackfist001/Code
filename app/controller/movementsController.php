<?php
namespace App\Controller;

use App\Model\MovementsModel;
use Exception;

class MovementsController {
    private MovementsModel $movementsModel;

    public function __construct() {
        $this->movementsModel = new MovementsModel();
    }

    /**
     * API: Ajouter un mouvement
     */
    public function add() {
        header('Content-Type: application/json');

        try {
            $input = json_decode(file_get_contents('php://input'), true);

            if (!$input) {
                echo json_encode(['success' => false, 'message' => 'Données invalides']);
                return;
            }

            $success = $this->movementsModel->addMovement($input);

            if ($success) {
                echo json_encode(['success' => true, 'message' => 'Mouvement ajouté']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Erreur lors de l\'ajout']);
            }
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * API: Rechercher des mouvements
     */
    public function search() {
        header('Content-Type: application/json');

        try {
            $query = $_GET['q'] ?? '';

            if (empty($query)) {
                echo json_encode(['success' => false, 'message' => 'Query requis']);
                return;
            }

            $results = $this->movementsModel->searchMovements($query);
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
     * API: Récupérer tous les mouvements
     */
    public function getAll() {
        header('Content-Type: application/json');

        try {
            $movements = $this->movementsModel->getAllMovements();
            echo json_encode([
                'success' => true,
                'count' => count($movements),
                'results' => $movements
            ]);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * API: Récupérer les mouvements d'un étudiant
     */
    public function getByStudentId($params) {
        header('Content-Type: application/json');

        try {
            $studentId = $params['id'] ?? null;

            if (!$studentId) {
                echo json_encode(['success' => false, 'message' => 'ID étudiant requis']);
                return;
            }

            $movements = $this->movementsModel->getMovementByStudentId($studentId);
            echo json_encode([
                'success' => true,
                'count' => count($movements),
                'results' => $movements
            ]);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * API: Récupérer les passages (avec filtrage date)
     */
    public function getPassages() {
        header('Content-Type: application/json');

        try {
            $dateFrom = $_GET['date_from'] ?? null;
            $dateTo = $_GET['date_to'] ?? null;

            // Pour l'instant, récupérer tous les mouvements
            // TODO: Implémenter le filtrage par date
            $passages = $this->movementsModel->getAllMovements();

            echo json_encode([
                'success' => true,
                'count' => count($passages),
                'results' => $passages
            ]);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * API: Mettre à jour un mouvement
     */
    public function update() {
        header('Content-Type: application/json');

        try {
            $input = json_decode(file_get_contents('php://input'), true);

            if (!$input || !isset($input['id'])) {
                echo json_encode(['success' => false, 'message' => 'ID requis']);
                return;
            }

            $movementId = $input['id'];
            unset($input['id']);

            $this->movementsModel->updateMovement($movementId, $input);
            echo json_encode(['success' => true, 'message' => 'Mouvement mis à jour']);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }
}