<?php
require __DIR__ . '/../vendor/autoload.php';

use App\Service\OneRosterSync;

$dryRun = in_array('--dry-run', $argv, true);

try {
    $sync = new OneRosterSync();
    $stats = $sync->syncStudents($dryRun);

    echo json_encode([
        'success' => true,
        'dry_run' => $dryRun,
        'stats' => $stats,
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
} catch (Throwable $e) {
    echo json_encode([
        'success' => false,
        'dry_run' => $dryRun,
        'error' => $e->getMessage(),
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
    exit(1);
}
