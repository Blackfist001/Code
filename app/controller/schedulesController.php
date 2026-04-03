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
            // strftime peut retourner en français selon locale, sinon on force en anglais
            if (empty($jour)) {
                $jour = date('l');
            }

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
}
