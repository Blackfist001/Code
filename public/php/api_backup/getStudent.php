<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../../../vendor/autoload.php';
require_once __DIR__ . '/../../../app/model/studentsModel.php';

use App\Model\StudentsModel;

try {
    $id = $_GET['id'] ?? null;
    
    if (empty($id)) {
        echo json_encode([
            'success' => false,
            'message' => 'ID étudiant requis'
        ]);
        exit;
    }

    $studentsModel = new StudentsModel();
    $student = $studentsModel->getStudentById($id);
    
    if (!$student) {
        echo json_encode([
            'success' => false,
            'message' => 'Étudiant non trouvé'
        ]);
        exit;
    }
    
    echo json_encode([
        'success' => true,
        'result' => $student
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Erreur: ' . $e->getMessage()
    ]);
}
