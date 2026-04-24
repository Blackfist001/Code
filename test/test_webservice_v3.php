<?php
require __DIR__ . '/../vendor/autoload.php';

use App\Service\SmartschoolWebServiceV3Client;

try {
    $client = new SmartschoolWebServiceV3Client();

    $wsdl = $client->testWsdlReachability();

    if (!$client->isSoapExtensionAvailable()) {
        echo json_encode([
            'success' => false,
            'soap_extension_available' => false,
            'wsdl_connectivity' => $wsdl,
            'error' => 'Extension SOAP PHP manquante. Activez php_soap pour la recuperation des donnees.',
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . PHP_EOL;
        exit(1);
    }

    $connection = $client->testConnection();
    $teachers = $client->getTeachers();
    $students = $client->getStudents();
    $schedules = $client->getSchedules();

    echo json_encode([
        'success' => true,
        'soap_extension_available' => true,
        'wsdl_connectivity' => $wsdl,
        'connection' => $connection,
        'counts' => [
            'students' => count($students),
            'teachers' => count($teachers),
            'schedules' => count($schedules),
        ],
        'samples' => [
            'students' => array_slice($students, 0, 2),
            'teachers' => array_slice($teachers, 0, 2),
            'schedules' => array_slice($schedules, 0, 2),
        ],
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . PHP_EOL;
} catch (Throwable $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . PHP_EOL;
    exit(1);
}
