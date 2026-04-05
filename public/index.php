<?php
// ---------- Logs & affichage des erreurs ----------
$logFile = __DIR__ . '/../app/logs/php_errors.log';
ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');
ini_set('log_errors', '1');
ini_set('error_log', $logFile);
error_reporting(E_ALL);
// --------------------------------------------------

require_once '../vendor/autoload.php';

// 1. On récupère le tableau des routes
$routes = require_once '../app/config/routes.php';

// 2. On initialise le routeur avec ces routes
$router = new App\Core\Router($routes);

// 3. On exécute l'aiguillage
$router->run();
