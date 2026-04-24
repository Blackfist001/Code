<?php
namespace App\Controller;

use App\Model\TeachersModel;
use Exception;

class TeachersController {
    private TeachersModel $teachersModel;

    public function __construct() {
        $this->teachersModel = new TeachersModel();
    }

    public function getAll($params = []): void {
        header('Content-Type: application/json');

        try {
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
}
