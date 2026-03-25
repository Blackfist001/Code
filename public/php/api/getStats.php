<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../../../vendor/autoload.php';
require_once __DIR__ . '/../../../app/model/studentsModel.php';
require_once __DIR__ . '/../../../app/model/movementsModel.php';

use App\Model\StudentsModel;
use App\Model\MovementsModel;

try {
    $studentsModel = new StudentsModel();
    $movementsModel = new MovementsModel();
    
    $students = $studentsModel->getAllStudents();
    $movements = $movementsModel->getAllMovements();
    
    // Compter les passages du jour
    $todayDate = date('Y-m-d');
    $todayMovements = array_filter($movements, function($m) use ($todayDate) {
        return $m['date_passage'] === $todayDate;
    });
    
    $presentToday = count(array_unique(array_column($todayMovements, 'id_etudiant')));
    $absentToday = count($students) - $presentToday;
    
    echo json_encode([
        'success' => true,
        'total_students' => count($students),
        'total_scans' => count($movements),
        'present_today' => $presentToday,
        'absent_today' => $absentToday
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Erreur: ' . $e->getMessage()
    ]);
}
