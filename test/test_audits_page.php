<?php

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use App\Core\Router;
use App\Service\AuditService;

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$_SESSION['role'] = 'Admin';
$_SESSION['username'] = 'audit_tester';

$routes = require __DIR__ . '/../app/config/routes.php';
$router = new Router($routes);

$probeId = 'audit_probe_' . date('Ymd_His');
AuditService::logLogin('audit_tester', '127.0.0.1');
AuditService::logDbChange('probe', 'audit_probe', null, ['id' => $probeId]);

$callRoute = static function (Router $router, string $method, string $uri): array {
    $originalMethod = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $originalUri = $_SERVER['REQUEST_URI'] ?? '/';

    $_SERVER['REQUEST_METHOD'] = $method;
    $_SERVER['REQUEST_URI'] = $uri;

    ob_start();
    $router->run();
    $output = (string)ob_get_clean();

    $_SERVER['REQUEST_METHOD'] = $originalMethod;
    $_SERVER['REQUEST_URI'] = $originalUri;

    $decoded = json_decode($output, true);
    return [
        'raw' => $output,
        'json' => is_array($decoded) ? $decoded : null,
    ];
};

$dbResult = $callRoute($router, 'GET', '/api/audits/db-changes');
$dbJson = $dbResult['json'];
$dbRows = is_array($dbJson['results'] ?? null) ? $dbJson['results'] : [];

$loginsResult = $callRoute($router, 'GET', '/api/audits/logins');
$loginsJson = $loginsResult['json'];
$loginRows = is_array($loginsJson['results'] ?? null) ? $loginsJson['results'] : [];

$probeDbVisible = false;
foreach ($dbRows as $row) {
    if (($row['entity'] ?? '') === 'audit_probe' && (string)($row['action'] ?? '') === 'probe') {
        $newData = $row['new_data'] ?? [];
        if (is_array($newData) && (($newData['id'] ?? '') === $probeId)) {
            $probeDbVisible = true;
            break;
        }
    }
}

$probeLoginVisible = false;
foreach ($loginRows as $row) {
    if (($row['user'] ?? '') === 'audit_tester') {
        $probeLoginVisible = true;
        break;
    }
}

echo "=== TEST PAGE AUDIT ===\n";
echo 'Endpoint /api/audits/db-changes: ' . ((bool)($dbJson['success'] ?? false) ? 'OK' : 'KO') . "\n";
echo 'Endpoint /api/audits/logins: ' . ((bool)($loginsJson['success'] ?? false) ? 'OK' : 'KO') . "\n";
echo 'Entrée probe db visible: ' . ($probeDbVisible ? 'OK' : 'KO') . "\n";
echo 'Entrée probe login visible: ' . ($probeLoginVisible ? 'OK' : 'KO') . "\n";

if (!($dbJson['success'] ?? false)) {
    echo "Réponse brute db-changes:\n" . $dbResult['raw'] . "\n";
}
if (!($loginsJson['success'] ?? false)) {
    echo "Réponse brute logins:\n" . $loginsResult['raw'] . "\n";
}
