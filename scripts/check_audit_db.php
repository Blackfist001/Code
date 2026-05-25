<?php

declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

$config = require __DIR__ . '/../app/config/config.php';
$pdo = new PDO(
    $config['dsn'],
    $config['user'],
    $config['pass'],
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

$tables = ['audit_logins', 'audit_db_changes'];
foreach ($tables as $table) {
    $stmt = $pdo->query("SELECT COUNT(*) AS c FROM {$table}");
    $count = (int)($stmt->fetch(PDO::FETCH_ASSOC)['c'] ?? 0);
    echo $table . ': ' . $count . PHP_EOL;
}

$lastLogin = $pdo->query('SELECT `user`, ip, created_at FROM audit_logins ORDER BY id DESC LIMIT 1')->fetch(PDO::FETCH_ASSOC);
$lastChange = $pdo->query('SELECT `user`, action, entity, created_at FROM audit_db_changes ORDER BY id DESC LIMIT 1')->fetch(PDO::FETCH_ASSOC);

echo 'last_login: ' . json_encode($lastLogin, JSON_UNESCAPED_UNICODE) . PHP_EOL;
echo 'last_change: ' . json_encode($lastChange, JSON_UNESCAPED_UNICODE) . PHP_EOL;
