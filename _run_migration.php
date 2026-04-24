<?php
require 'vendor/autoload.php';
$config = require 'app/config/config.php';
$pdo = new PDO($config['dsn'], $config['user'], $config['pass'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

$sql = file_get_contents('sql/MIGRATION_smartschool_soap_fields.sql');
$statements = array_filter(array_map('trim', explode(';', $sql)));
$count = 0;
foreach ($statements as $stmt) {
    $clean = ltrim($stmt);
    if ($clean === '' || str_starts_with($clean, '--') || str_starts_with($clean, '/*')) {
        continue;
    }
    $pdo->exec($stmt);
    $count++;
}
echo "Migration appliquee : $count instructions executees." . PHP_EOL;

foreach (['etudiants', 'professeurs', 'matieres'] as $t) {
    $cols = $pdo->query("SHOW COLUMNS FROM $t")->fetchAll(PDO::FETCH_COLUMN);
    echo "$t: " . implode(', ', $cols) . PHP_EOL;
}
<?php
require 'vendor/autoload.php';
$config = require 'app/config/config.php';
$dsn = 'mysql:host=' . $config['db_host'] . ';dbname=' . $config['db_name'] . ';charset=utf8mb4';
$pdo = new PDO($dsn, $config['db_user'], $config['db_pass'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

$sql = file_get_contents('sql/MIGRATION_smartschool_soap_fields.sql');
// Exécuter chaque instruction ALTER séparément
$statements = array_filter(array_map('trim', explode(';', $sql)));
$count = 0;
foreach ($statements as $stmt) {
    if ($stmt === '' || str_starts_with(ltrim($stmt), '--')) {
        continue;
    }
    $pdo->exec($stmt);
    $count++;
}
echo "Migration appliquee : $count instructions executees." . PHP_EOL;

foreach (['etudiants', 'professeurs', 'matieres'] as $t) {
    $cols = $pdo->query("SHOW COLUMNS FROM $t")->fetchAll(PDO::FETCH_COLUMN);
    echo "$t: " . implode(', ', $cols) . PHP_EOL;
}
