<?php
header('Content-Type: application/json');
session_start();

require_once __DIR__ . '/../../../vendor/autoload.php';
require_once __DIR__ . '/../../../app/model/usersModel.php';

use App\Model\UsersModel;

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['username']) || !isset($input['password'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Identifiants manquants'
        ]);
        exit;
    }

    $usersModel = new UsersModel();
    $user = $usersModel->authenticate($input['username'], $input['password']);
    
    if ($user) {
        $_SESSION['user_id'] = $user['id_user'];
        $_SESSION['username'] = $user['nom'];
        $_SESSION['role'] = $user['role'];
        
        echo json_encode([
            'success' => true,
            'message' => 'Authentification réussie',
            'user' => $user
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Identifiants invalides'
        ]);
    }
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Erreur: ' . $e->getMessage()
    ]);
}
