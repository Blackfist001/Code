<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../../../vendor/autoload.php';
require_once __DIR__ . '/../../../app/model/movementsModel.php';

use App\Model\MovementsModel;

try {
    $movementsModel = new MovementsModel();
    
    // Récupérer les filtres optionnels
    $dateFrom = isset($_GET['date_from']) ? $_GET['date_from'] : null;
    $dateTo = isset($_GET['date_to']) ? $_GET['date_to'] : null;
    
    if ($dateFrom && $dateTo) {
        $passages = $movementsModel->getMovementsBetweenDates($dateFrom, $dateTo);
    } else {
        $passages = $movementsModel->getAllMovements();
    }
    
    echo json_encode([
        'success' => true,
        'count' => count($passages),
        'results' => $passages
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Erreur: ' . $e->getMessage()
    ]);
}
