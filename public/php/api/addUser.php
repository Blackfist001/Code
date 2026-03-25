<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../../../vendor/autoload.php';
require_once __DIR__ . '/../../../app/model/usersModel.php';

use App\Model\UsersModel;

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        echo json_encode([
            'success' => false,
            'message' => 'Données invalides'
        ]);
        exit;
    }

    $usersModel = new UsersModel();
    $success = $usersModel->addUser($input);
    
    if ($success) {
        echo json_encode([
            'success' => true,
            'message' => 'Utilisateur créé avec succès'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Erreur lors de la création'
        ]);
    }
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Erreur: ' . $e->getMessage()
    ]);
}
