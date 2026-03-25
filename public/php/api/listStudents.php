<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../../../vendor/autoload.php';
require_once __DIR__ . '/../../../app/model/studentsModel.php';

use App\Model\StudentsModel;

try {
    $studentsModel = new StudentsModel();
    $students = $studentsModel->getAllStudents();
    
    echo json_encode([
        'success' => true,
        'count' => count($students),
        'results' => $students
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Erreur: ' . $e->getMessage()
    ]);
}
