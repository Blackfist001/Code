<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../../../vendor/autoload.php';
require_once __DIR__ . '/../../../app/model/studentsModel.php';

use App\Model\StudentsModel;

try {
    $query = $_GET['q'] ?? '';
    
    if (empty($query)) {
        echo json_encode([
            'success' => false,
            'message' => 'Aucune requête fournie'
        ]);
        exit;
    }

    $studentsModel = new StudentsModel();
    $results = $studentsModel->searchStudents($query);
    
    echo json_encode([
        'success' => true,
        'count' => count($results),
        'results' => $results
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Erreur: ' . $e->getMessage()
    ]);
}
