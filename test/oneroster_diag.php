<?php
declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

/**
 * Usage examples:
 * php test/oneroster_diag.php
 * php test/oneroster_diag.php --force-ip=193.56.132.11
 * php test/oneroster_diag.php --force-ip=193.56.132.11 --retries=3
 */

$config = require __DIR__ . '/../app/config/oneroster.php';

$forceIp = null;
$retries = 3;

foreach (array_slice($argv, 1) as $arg) {
    if (str_starts_with($arg, '--force-ip=')) {
        $value = trim(substr($arg, strlen('--force-ip=')));
        if ($value !== '') {
            $forceIp = $value;
        }
    }

    if (str_starts_with($arg, '--retries=')) {
        $value = (int)trim(substr($arg, strlen('--retries=')));
        if ($value > 0 && $value <= 10) {
            $retries = $value;
        }
    }
}

$baseUrl = (string)($config['web_access_url'] ?? '');
$tokenEndpoint = (string)($config['token_endpoint'] ?? '');
$host = (string)parse_url($baseUrl, PHP_URL_HOST);

if ($baseUrl === '' || $tokenEndpoint === '' || $host === '') {
    echo json_encode([
        'success' => false,
        'error' => 'Configuration OneRoster invalide (web_access_url/token_endpoint).',
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
    exit(1);
}

function curlRequest(string $url, array $opts = [], ?string $forceHost = null, ?string $forceIp = null): array {
    $ch = curl_init($url);

    $default = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
    ];

    if ($forceHost !== null && $forceIp !== null) {
        $default[CURLOPT_RESOLVE] = [sprintf('%s:443:%s', $forceHost, $forceIp)];
    }

    curl_setopt_array($ch, $default + $opts);

    $start = microtime(true);
    $body = curl_exec($ch);
    $durationMs = (int)round((microtime(true) - $start) * 1000);
    $errno = curl_errno($ch);
    $error = curl_error($ch);
    $statusCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return [
        'status_code' => $statusCode,
        'duration_ms' => $durationMs,
        'curl_errno' => $errno,
        'curl_error' => $error,
        'body' => is_string($body) ? $body : '',
    ];
}

function extractList(array $payload, array $keys): array {
    foreach ($keys as $key) {
        if (isset($payload[$key]) && is_array($payload[$key])) {
            return $payload[$key];
        }
    }

    if (array_is_list($payload)) {
        return $payload;
    }

    return [];
}

function getToken(array $config, int $retries, ?string $host, ?string $forceIp): array {
    $durations = [];
    $attempts = 0;
    $lastError = null;
    $lastStatus = 0;
    $token = null;

    while ($attempts < $retries) {
        $attempts++;

        $result = curlRequest(
            (string)$config['token_endpoint'],
            [
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => http_build_query([
                    'grant_type' => (string)($config['grant_type'] ?? 'client_credentials'),
                    'client_id' => (string)$config['client_id'],
                    'client_secret' => (string)$config['client_secret'],
                    'scope' => (string)($config['scope'] ?? ''),
                ]),
                CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded'],
            ],
            $host,
            $forceIp
        );

        $durations[] = $result['duration_ms'];
        $lastStatus = $result['status_code'];

        if ($result['curl_errno'] !== 0) {
            $lastError = $result['curl_error'];
            continue;
        }

        $json = json_decode($result['body'], true);
        if ($result['status_code'] >= 200 && $result['status_code'] < 300 && is_array($json) && !empty($json['access_token'])) {
            $token = (string)$json['access_token'];
            break;
        }

        $snippet = trim(substr($result['body'], 0, 200));
        $lastError = $snippet !== '' ? $snippet : 'Token endpoint returned non-success response';
    }

    return [
        'success' => $token !== null,
        'token' => $token,
        'attempts' => $attempts,
        'durations_ms' => $durations,
        'last_http_status' => $lastStatus,
        'last_error' => $lastError,
    ];
}

function testCandidates(string $baseUrl, string $token, array $candidates, ?string $host, ?string $forceIp): array {
    $tries = [];

    foreach ($candidates as $candidate) {
        $url = rtrim($baseUrl, '/') . '/' . ltrim($candidate, '/');
        $result = curlRequest(
            $url,
            [
                CURLOPT_HTTPHEADER => [
                    'Authorization: Bearer ' . $token,
                    'Accept: application/json',
                ],
            ],
            $host,
            $forceIp
        );

        $entry = [
            'endpoint' => $candidate,
            'status_code' => $result['status_code'],
            'duration_ms' => $result['duration_ms'],
            'curl_errno' => $result['curl_errno'],
            'curl_error' => $result['curl_error'],
        ];

        $json = json_decode($result['body'], true);
        if ($result['status_code'] >= 200 && $result['status_code'] < 300 && is_array($json)) {
            return [
                'endpoint_utilise' => $candidate,
                'status_code' => $result['status_code'],
                'duration_ms' => $result['duration_ms'],
                'curl_errno' => $result['curl_errno'],
                'curl_error' => $result['curl_error'],
                'tries' => $tries,
                'payload' => $json,
            ];
        }

        $snippet = trim(substr($result['body'], 0, 180));
        if ($snippet !== '') {
            $entry['response_snippet'] = $snippet;
        }

        $tries[] = $entry;
    }

    $last = end($tries);

    return [
        'endpoint_utilise' => $last['endpoint'] ?? end($candidates),
        'status_code' => $last['status_code'] ?? 0,
        'duration_ms' => $last['duration_ms'] ?? 0,
        'curl_errno' => $last['curl_errno'] ?? 0,
        'curl_error' => $last['curl_error'] ?? null,
        'tries' => $tries,
        'payload' => null,
    ];
}

$tokenResult = getToken($config, $retries, $host, $forceIp);

$output = [
    'success' => true,
    'mode' => [
        'force_ip' => $forceIp,
        'host' => $host,
        'retries' => $retries,
    ],
    'token' => [
        'success' => $tokenResult['success'],
        'attempts' => $tokenResult['attempts'],
        'durations_ms' => $tokenResult['durations_ms'],
        'last_http_status' => $tokenResult['last_http_status'],
        'last_error' => $tokenResult['last_error'],
    ],
    'endpoints' => [],
    'data' => [],
];

if ($tokenResult['success'] !== true || empty($tokenResult['token'])) {
    echo json_encode($output, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
    exit(2);
}

$students = testCandidates($baseUrl, (string)$tokenResult['token'], ['/students'], $host, $forceIp);
$teachers = testCandidates($baseUrl, (string)$tokenResult['token'], ['/teachers', '/users?role=teacher', '/users?role=staff'], $host, $forceIp);
$schedules = testCandidates($baseUrl, (string)$tokenResult['token'], ['/classschedules', '/classSchedules', '/schedules', '/classeschedules'], $host, $forceIp);

$output['endpoints'] = [
    'students' => [
        'endpoint_utilise' => $students['endpoint_utilise'],
        'status_code' => $students['status_code'],
        'duration_ms' => $students['duration_ms'],
        'curl_errno' => $students['curl_errno'],
        'curl_error' => $students['curl_error'],
        'tries' => $students['tries'],
    ],
    'teachers' => [
        'endpoint_utilise' => $teachers['endpoint_utilise'],
        'status_code' => $teachers['status_code'],
        'duration_ms' => $teachers['duration_ms'],
        'curl_errno' => $teachers['curl_errno'],
        'curl_error' => $teachers['curl_error'],
        'tries' => $teachers['tries'],
    ],
    'schedules' => [
        'endpoint_utilise' => $schedules['endpoint_utilise'],
        'status_code' => $schedules['status_code'],
        'duration_ms' => $schedules['duration_ms'],
        'curl_errno' => $schedules['curl_errno'],
        'curl_error' => $schedules['curl_error'],
        'tries' => $schedules['tries'],
    ],
];

$studentList = is_array($students['payload']) ? extractList($students['payload'], ['students', 'users', 'results', 'items']) : [];
$teacherList = is_array($teachers['payload']) ? extractList($teachers['payload'], ['teachers', 'users', 'results', 'items']) : [];
$scheduleList = is_array($schedules['payload']) ? extractList($schedules['payload'], ['classSchedules', 'schedules', 'results', 'items']) : [];

$output['data'] = [
    'students' => [
        'count' => count($studentList),
        'payload_keys' => is_array($students['payload']) ? array_keys($students['payload']) : [],
        'sample' => array_slice($studentList, 0, 2),
    ],
    'teachers' => [
        'count' => count($teacherList),
        'payload_keys' => is_array($teachers['payload']) ? array_keys($teachers['payload']) : [],
        'sample' => array_slice($teacherList, 0, 2),
    ],
    'schedules' => [
        'count' => count($scheduleList),
        'payload_keys' => is_array($schedules['payload']) ? array_keys($schedules['payload']) : [],
        'sample' => array_slice($scheduleList, 0, 2),
    ],
];

echo json_encode($output, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
