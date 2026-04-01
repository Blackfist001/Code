<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../../../vendor/autoload.php';
require_once __DIR__ . '/../../../app/model/movementsModel.php';

use App\Model\MovementsModel;

try {
    $movementsModel = new MovementsModel();
    $movements = $movementsModel->getAllMovements();
    
    echo json_encode([
        'success' => true,
        'count' => count($movements),
        'results' => $movements
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Erreur: ' . $e->getMessage()
    ]);
}
