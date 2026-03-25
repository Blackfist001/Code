<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../../../vendor/autoload.php';
require_once __DIR__ . '/../../../app/model/movementsModel.php';

use App\Model\MovementsModel;

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['id_etudiant'])) {
        echo json_encode([
            'success' => false,
            'message' => 'ID étudiant requis'
        ]);
        exit;
    }

    $movementsModel = new MovementsModel();
    
    // Enregistrer le passage comme absence
    $movementData = [
        'id_etudiant' => $input['id_etudiant'],
        'type_passage' => 'absence',
        'statut' => $input['reason'] ?? 'non-justifie',
        'date_passage' => date('Y-m-d'),
        'heure_passage' => date('H:i:s')
    ];
    
    $success = $movementsModel->addMovement($movementData);
    
    if ($success) {
        echo json_encode([
            'success' => true,
            'message' => 'Absence enregistrée'
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
