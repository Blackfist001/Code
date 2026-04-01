<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../../../vendor/autoload.php';
require_once __DIR__ . '/../../../app/model/usersModel.php';

use App\Model\UsersModel;

try {
    $usersModel = new UsersModel();
    $users = $usersModel->getAllUsers();
    
    echo json_encode([
        'success' => true,
        'count' => count($users),
        'results' => $users
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Erreur: ' . $e->getMessage()
    ]);
}
