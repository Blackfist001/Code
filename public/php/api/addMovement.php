<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../../../vendor/autoload.php';
require_once __DIR__ . '/../../../app/model/movementsModel.php';

use App\Model\MovementsModel;

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        echo json_encode([
            'success' => false,
            'message' => 'Données invalides'
        ]);
        exit;
    }

    $movementsModel = new MovementsModel();
    $success = $movementsModel->addMovement($input);
    
    if ($success) {
        echo json_encode([
            'success' => true,
            'message' => 'Passage enregistré avec succès'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Erreur lors de l\'enregistrement'
        ]);
    }
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Erreur: ' . $e->getMessage()
    ]);
}
