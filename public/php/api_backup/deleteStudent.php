<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../../../vendor/autoload.php';
require_once __DIR__ . '/../../../app/model/studentsModel.php';

use App\Model\StudentsModel;

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['id_etudiant'])) {
        echo json_encode([
            'success' => false,
            'message' => 'ID étudiant requis'
        ]);
        exit;
    }

    $studentsModel = new StudentsModel();
    $success = $studentsModel->deleteStudent($input['id_etudiant']);
    
    if ($success) {
        echo json_encode([
            'success' => true,
            'message' => 'Étudiant supprimé avec succès'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Erreur lors de la suppression'
        ]);
    }
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Erreur: ' . $e->getMessage()
    ]);
}
