<?php
require_once 'vendor/autoload.php';

use App\Core\Router;
use App\Controller\DashboardController;
use App\Controller\MovementsController;
use App\Controller\StudentsController;
use App\Controller\UsersController;

// Test de chargement du routeur
try {
    $routes = include 'app/config/routes.php';
    $router = new Router($routes);
    echo '✅ Routeur chargé avec succès' . PHP_EOL;

    // Test de chargement des contrôleurs
    $controllers = [
        'DashboardController' => DashboardController::class,
        'MovementsController' => MovementsController::class,
        'StudentsController' => StudentsController::class,
        'UsersController' => UsersController::class,
    ];

    foreach ($controllers as $name => $class) {
        if (class_exists($class)) {
            echo "✅ $name trouvé" . PHP_EOL;
        } else {
            echo "❌ $name non trouvé" . PHP_EOL;
        }
    }

    // Test d'instanciation d'un contrôleur
    $dashboard = new DashboardController();
    echo '✅ DashboardController instancié avec succès' . PHP_EOL;

    // Test de la connexion DB
    $db = new App\Core\DataBase();
    $pdo = $db->getPdo();
    echo '✅ Connexion à la base de données réussie' . PHP_EOL;

} catch (Exception $e) {
    echo '❌ Erreur: ' . $e->getMessage() . PHP_EOL;
}
?>