<?php
namespace App\Controller;

use App\Model\MovementsModel;
use App\Model\StudentsModel;
use App\Model\SchedulesModel;
use App\Core\ScanRules;
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
        ob_start();

        try {
            $input = json_decode(file_get_contents('php://input'), true);

            if (!$input || empty($input['id_etudiant'])) {
                ob_end_clean();
                echo json_encode(['success' => false, 'message' => 'Données invalides ou id_etudiant manquant']);
                return;
            }

            // Pour une entrée matin encodée manuellement, recalculer le statut
            // via les règles métier (Présent vs En retard selon l'horaire de la classe)
            if (($input['type_passage'] ?? '') === 'Entrée matin') {
                $student = (new StudentsModel())->getStudentById($input['id_etudiant']);
                if ($student) {
                    $heurePassage = $input['heure_passage'] ?? date('H:i:s');
                    $datePassage  = $input['date_passage']  ?? date('Y-m-d');
                    $jourSemaine  = strtolower((new \DateTime($datePassage))->format('l'));

                    $cours = (new SchedulesModel())->getScheduleByClassAndDay(
                        $student['classe'] ?? '',
                        $jourSemaine
                    );

                    $now = \DateTime::createFromFormat('Y-m-d H:i:s', $datePassage . ' ' . $heurePassage)
                        ?: \DateTime::createFromFormat('Y-m-d H:i',   $datePassage . ' ' . $heurePassage)
                        ?: new \DateTime();

                    $passagesTypes = $this->movementsModel->getTodayPassageTypes($input['id_etudiant']);
                    $rules = new ScanRules();
                    $calcul = $rules->calculer($student, $cours, $passagesTypes, $now);
                    $input['statut'] = $calcul['statut'];
                }
            }

            $success = $this->movementsModel->addMovement($input);

            ob_end_clean();
            if ($success) {
                echo json_encode(['success' => true, 'message' => 'Mouvement ajouté']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Erreur lors de l\'ajout']);
            }
        } catch (\Throwable $e) {
            ob_end_clean();
            error_log('[MovementsController::add] ' . $e->getMessage());
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
     * API: Récupérer les raisons disponibles (ENUM passages.raison)
     */
    public function getReasonOptions() {
        header('Content-Type: application/json');

        try {
            $reasons = $this->movementsModel->getReasonOptions();
            echo json_encode([
                'success' => true,
                'count' => count($reasons),
                'results' => $reasons,
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
            $date = $_GET['date'] ?? null;

            if ($date) {
                $passages = $this->movementsModel->getMovementsByDate($date);
            } else {
                $passages = $this->movementsModel->getAllMovements();
            }

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
     * API: Supprimer un passage
     */
    public function delete() {
        header('Content-Type: application/json');

        try {
            $input = json_decode(file_get_contents('php://input'), true);

            if (!$input || !isset($input['id'])) {
                echo json_encode(['success' => false, 'message' => 'ID requis']);
                return;
            }

            $success = $this->movementsModel->deleteMovement($input['id']);
            if ($success) {
                echo json_encode(['success' => true, 'message' => 'Passage supprimé']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Passage introuvable']);
            }
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * API: Rechercher les passages par infos étudiant
     */
    public function searchByStudent() {
        header('Content-Type: application/json');

        try {
            $filters = [
                'nom'       => $_GET['nom']       ?? '',
                'prenom'    => $_GET['prenom']    ?? '',
                'classe'    => $_GET['classe']    ?? '',
                'statut'    => $_GET['statut']    ?? '',
                'date'      => $_GET['date']      ?? '',
                'date_from' => $_GET['date_from'] ?? '',
                'date_to'   => $_GET['date_to']   ?? '',
            ];

            $results = $this->movementsModel->searchMovementsByStudent($filters);
            echo json_encode([
                'success' => true,
                'count'   => count($results),
                'results' => $results
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