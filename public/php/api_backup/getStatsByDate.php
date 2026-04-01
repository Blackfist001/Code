<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../../../vendor/autoload.php';
require_once __DIR__ . '/../../../app/model/movementsModel.php';
require_once __DIR__ . '/../../../app/model/studentsModel.php';

use App\Model\MovementsModel;
use App\Model\StudentsModel;

try {
    $dateFrom = isset($_GET['date_from']) ? $_GET['date_from'] : null;
    $dateTo = isset($_GET['date_to']) ? $_GET['date_to'] : null;
    
    if (!$dateFrom || !$dateTo) {
        echo json_encode([
            'success' => false,
            'message' => 'Dates requises'
        ]);
        exit;
    }

    $movementsModel = new MovementsModel();
    $studentsModel = new StudentsModel();
    
    $passages = $movementsModel->getMovementsBetweenDates($dateFrom, $dateTo);
    $students = $studentsModel->getAllStudents();
    
    // Calculer les stats
    $present = count(array_unique(array_column($passages, 'id_etudiant')));
    $absent = count($students) - $present;
    
    echo json_encode([
        'success' => true,
        'total_passages' => count($passages),
        'present_count' => $present,
        'absent_count' => $absent,
        'date_from' => $dateFrom,
        'date_to' => $dateTo
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Erreur: ' . $e->getMessage()
    ]);
}
