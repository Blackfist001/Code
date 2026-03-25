<?php
require_once '../vendor/autoload.php';

// 1. On récupère le tableau des routes
$routes = require_once '../app/Config/routes.php';

// 2. On initialise le routeur avec ces routes
$router = new App\Core\Router($routes);

// 3. On exécute l'aiguillage
$router->run();
