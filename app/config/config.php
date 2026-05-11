<?php
// Configuration de la base de donnees.
// Charge les secrets depuis app/config/.env si disponible.

@require_once __DIR__ . '/../../vendor/autoload.php';

if (class_exists(\Dotenv\Dotenv::class)) {
    static $envLoaded = false;
    if (!$envLoaded) {
        \Dotenv\Dotenv::createImmutable(__DIR__)->safeLoad();
        $envLoaded = true;
    }
}

$dbHost = $_ENV['DB_HOST'] ?? 'localhost';
$dbName = $_ENV['DB_NAME'] ?? 'sortie_ecole';

return [
    'dsn' => 'mysql:host=' . $dbHost . ';dbname=' . $dbName . ';port=3306;charset=utf8',
    'user' => $_ENV['DB_USER'] ?? 'root',
    'pass' => $_ENV['DB_PASS'] ?? '',
];