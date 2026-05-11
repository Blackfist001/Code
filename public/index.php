<?php
header('Content-Type: text/html; charset=utf-8');
header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('X-XSS-Protection: 1; mode=block');
header("Permissions-Policy: geolocation=(), microphone=(), camera=(), usb=(), vr=()");

$csp = "default-src 'self'; "
	. "script-src 'self' 'unsafe-inline' cdn.jsdelivr.net qrserver.com; "
	. "style-src 'self' 'unsafe-inline' cdn.jsdelivr.net; "
	. "img-src 'self' data: https:; "
	. "font-src 'self' cdn.jsdelivr.net; "
	. "connect-src 'self'; "
	. "frame-ancestors 'none'; "
	. "base-uri 'self'; "
	. "form-action 'self'";
header('Content-Security-Policy: ' . $csp);

if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
	header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
}

// ---------- Logs & affichage des erreurs ----------
$logFile = __DIR__ . '/../app/logs/php_errors.log';
ini_set('display_errors', '0');
ini_set('display_startup_errors', '0');
ini_set('log_errors', '1');
ini_set('error_log', $logFile);
error_reporting(E_ALL);

ini_set('session.cookie_httponly', '1');
ini_set('session.cookie_samesite', 'Lax');
ini_set('session.use_strict_mode', '1');
ini_set('session.gc_maxlifetime', '3600');

if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
	ini_set('session.cookie_secure', '1');
}
// --------------------------------------------------

require_once '../vendor/autoload.php';

// 1. On récupère le tableau des routes
$routes = require_once '../app/config/routes.php';

// 2. On initialise le routeur avec ces routes
$router = new App\Core\Router($routes);

// 3. On exécute l'aiguillage
$router->run();
