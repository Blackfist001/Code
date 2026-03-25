<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../../../vendor/autoload.php';
require_once __DIR__ . '/../../../app/model/usersModel.php';

use App\Model\UsersModel;

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['id'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Données invalides'
        ]);
        exit;
    }

    $userId = $input['id'];
    
    $usersModel = new UsersModel();
    $usersModel->deleteUser($userId);
    
    echo json_encode([
        'success' => true,
        'message' => 'Utilisateur supprimé avec succès'
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Erreur: ' . $e->getMessage()
    ]);
}
