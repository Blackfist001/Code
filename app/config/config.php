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

$env = static function (string $key, $default = null) {
    if (array_key_exists($key, $_ENV) && $_ENV[$key] !== '') {
        return $_ENV[$key];
    }

    if (array_key_exists($key, $_SERVER) && $_SERVER[$key] !== '') {
        return $_SERVER[$key];
    }

    $value = getenv($key);
    if ($value !== false && $value !== '') {
        return $value;
    }

    return $default;
};

$dbHost = $env('DB_HOST', 'localhost');
$dbName = $env('DB_NAME', 'sortie_ecole');
$dbPort = $env('DB_PORT', '3306');
$dbCharset = $env('DB_CHARSET', 'utf8');

return [
    'dsn' => 'mysql:host=' . $dbHost . ';dbname=' . $dbName . ';port=' . $dbPort . ';charset=' . $dbCharset,
    'user' => $env('DB_USER', 'root'),
    'pass' => $env('DB_PASS', ''),
];