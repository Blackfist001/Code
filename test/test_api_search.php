<?php
// Activer l'affichage des erreurs
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Test script pour vérifier l'API de recherche avancée
echo "Test de l'API de recherche...\n";

$url = 'http://localhost:8000/api/students/search?name=Dupont';
echo "URL: $url\n";

$context = stream_context_create([
    'http' => [
        'method' => 'GET',
        'header' => 'Content-Type: application/json'
    ]
]);

$response = file_get_contents($url, false, $context);

if ($response === false) {
    echo "Erreur: Impossible de contacter l'API\n";
    echo "Erreur détaillée: " . error_get_last()['message'] . "\n";
} else {
    echo "Réponse de l'API:\n";
    echo $response . "\n";
}
?>