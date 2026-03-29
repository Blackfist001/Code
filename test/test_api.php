<?php
require_once 'vendor/autoload.php';
require_once 'app/core/router.php';
require_once 'app/config/routes.php';

// Capturer toute la sortie pour éviter les problèmes d'headers
ob_start();

// Fonction pour tester une route
function testRoute($method, $uri, $description) {
    echo "Test: $method $uri - $description\n";

    // Sauvegarder l'état global
    $original_method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $original_uri = $_SERVER['REQUEST_URI'] ?? '/';

    // Simuler la requête
    $_SERVER['REQUEST_METHOD'] = $method;
    $_SERVER['REQUEST_URI'] = $uri;

    try {
        $routes = include 'app/config/routes.php';
        $router = new App\Core\Router($routes);

        // Capturer seulement la sortie du contrôleur
        ob_start();
        $router->run();
        $output = ob_get_clean();

        $data = json_decode($output, true);

        if ($data && isset($data['success'])) {
            echo "✅ Succès\n";
            if (isset($data['count'])) {
                echo "   Résultat: {$data['count']} éléments\n";
            }
            if (isset($data['total_students'])) {
                echo "   Stats: {$data['total_students']} étudiants, {$data['total_scans']} scans\n";
            }
        } else {
            echo "❌ Échec\n";
            echo "   Output: $output\n";
        }
    } catch (Exception $e) {
        echo "❌ Erreur: " . $e->getMessage() . "\n";
    }

    // Restaurer l'état
    $_SERVER['REQUEST_METHOD'] = $original_method;
    $_SERVER['REQUEST_URI'] = $original_uri;

    echo "\n";
}

// Tests des routes API
echo "=== TEST DES ROUTES API ===\n\n";

testRoute('GET', '/api/students', 'Récupération des étudiants');
testRoute('GET', '/api/movements', 'Récupération des mouvements');
testRoute('GET', '/api/stats', 'Récupération des statistiques');

echo "=== TESTS TERMINÉS ===\n";

// Afficher toute la sortie capturée
$content = ob_get_clean();
echo $content;
?>