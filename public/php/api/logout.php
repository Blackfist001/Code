<?php
header('Content-Type: application/json');
session_start();

try {
    session_destroy();
    
    echo json_encode([
        'success' => true,
        'message' => 'Déconnexion réussie'
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Erreur: ' . $e->getMessage()
    ]);
}
