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
            if (!$input || empty($input['nom_classe']) || empty($input['matiere']) || empty($input['jour_semaine'])) {
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
            $this->schedulesModel->updateSchedule($id, $input);
            echo json_encode(['success' => true, 'message' => 'Horaire modifié']);
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
