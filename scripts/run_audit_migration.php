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

$sql = file_get_contents(__DIR__ . '/../sql/MIGRATION_audits_persistence_db.sql');
if (!is_string($sql) || trim($sql) === '') {
    throw new RuntimeException('Migration SQL introuvable ou vide.');
}

$statements = array_filter(array_map('trim', explode(';', $sql)));
$count = 0;
foreach ($statements as $stmt) {
    $lines = preg_split('/\R/', $stmt) ?: [];
    $filteredLines = [];
    foreach ($lines as $line) {
        $trimmed = ltrim($line);
        if ($trimmed === '' || str_starts_with($trimmed, '--')) {
            continue;
        }
        $filteredLines[] = $line;
    }

    $clean = trim(implode("\n", $filteredLines));
    if ($clean === '' || str_starts_with($clean, '/*')) {
        continue;
    }

    $pdo->exec($clean);
    $count++;
}

echo 'Migration audits appliquee: ' . $count . " instructions executees." . PHP_EOL;
