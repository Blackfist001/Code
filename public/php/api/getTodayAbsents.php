<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../../../vendor/autoload.php';
require_once __DIR__ . '/../../../app/model/movementsModel.php';

use App\Model\MovementsModel;

try {
    $movementsModel = new MovementsModel();
    
    // Récupérer tous les passages du jour
    $todayDate = date('Y-m-d');
    $passages = $movementsModel->getMovementsByDate($todayDate);
    
    // Récupérer tous les étudiants
    $allStudents = [];
    
    // Déterminer les absents (étudiants sans passage)
    $absent = [];
    
    echo json_encode([
        'success' => true,
        'count' => count($absent),
        'results' => $absent,
        'date' => $todayDate
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Erreur: ' . $e->getMessage()
    ]);
}
