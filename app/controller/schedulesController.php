<?php
namespace App\Controller;

use App\Model\SchedulesModel;
use Exception;

class SchedulesController {
    private SchedulesModel $schedulesModel;

    public function __construct() {
        $this->schedulesModel = new SchedulesModel();
    }

    public function getByClass($params) {
        header('Content-Type: application/json');
        try {
            $classe = $params['classe'] ?? null;
            if (!$classe) {
                echo json_encode(['success' => false, 'message' => 'Classe requise']);
                return;
            }

            $jour = $_GET['jour'] ?? strftime('%A', time());
            if (empty($jour)) { $jour = date('l'); }

            $schedule = $this->schedulesModel->getScheduleByClassAndDay($classe, $jour);

            echo json_encode([
                'success' => true,
                'classe' => $classe,
                'jour' => $jour,
                'schedule' => $schedule
            ]);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public function getCreneaux() {
        header('Content-Type: application/json');
        try {
            $creneaux = $this->schedulesModel->getAllCreneaux();
            echo json_encode([
                'success' => true,
                'count' => count($creneaux),
                'results' => $creneaux
            ]);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public function getAll() {
        header('Content-Type: application/json');
        try {
            $schedules = $this->schedulesModel->getAllSchedules();
            echo json_encode(['success' => true, 'count' => count($schedules), 'results' => $schedules]);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public function add() {
        header('Content-Type: application/json');
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $hasClasse = !empty($input['id_classe']) || !empty($input['classe']);
            $hasMatiere = !empty($input['id_matiere']) || !empty($input['matiere']);
            $hasCreneauDebut = !empty($input['id_creneau_debut']) || !empty($input['heure_debut']);
            $hasCreneauFin = !empty($input['id_creneau_fin']) || !empty($input['heure_fin']);
            if (!$input || !$hasClasse || !$hasMatiere || empty($input['jour_semaine']) || !$hasCreneauDebut || !$hasCreneauFin) {
                echo json_encode(['success' => false, 'message' => 'Champs obligatoires manquants']);
                return;
            }
            $success = $this->schedulesModel->addSchedule($input);
            echo json_encode($success
                ? ['success' => true,  'message' => 'Horaire ajouté']
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
            $success = $this->schedulesModel->updateSchedule($id, $input);
            echo json_encode($success
                ? ['success' => true,  'message' => 'Horaire modifié']
                : ['success' => false, 'message' => 'Erreur lors de la modification']);
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
            $success = $this->schedulesModel->deleteSchedule((int)$input['id']);
            echo json_encode($success
                ? ['success' => true,  'message' => 'Horaire supprimé']
                : ['success' => false, 'message' => 'Horaire introuvable']);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }
}
