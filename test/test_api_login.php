<?php
// Test API login via route /login POST json

$url = 'http://localhost:8000/login';
$data = json_encode(['username' => 'edu', 'password' => 'edu']);
$options = [
    'http' => [
        'method' => 'POST',
        'header' => "Content-Type: application/json\r\n" . "Accept: application/json\r\n",
        'content' => $data,
        'ignore_errors' => true,
    ]
];
$context = stream_context_create($options);

$response = @file_get_contents($url, false, $context);
$status = isset($http_response_header[0]) ? $http_response_header[0] : 'HTTP/1.1 ?';

echo "=== LOGIN API TEST ===\n";
echo "URL: $url\n";
echo "Status: $status\n";
echo "Response: $response\n";

if ($response) {
    $json = json_decode($response, true);
    if ($json && isset($json['success'])) {
        echo "-> success: " . ($json['success'] ? 'true' : 'false') . "\n";
        echo "-> message: " . ($json['message'] ?? '(no message)') . "\n";
    } else {
        echo "-> impossible d'analyser la réponse JSON\n";
    }
} else {
    echo "-> pas de réponse du serveur\n";
}

?>