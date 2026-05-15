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

function testCandidates(string $baseUrl, string $token, array $candidates, int $retries, ?string $host, ?string $forceIp): array {
    $tries = [];

    for ($attempt = 1; $attempt <= $retries; $attempt++) {
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
                'attempt' => $attempt,
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
                    'attempt_utilise' => $attempt,
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
    }

    $last = end($tries);

    return [
        'endpoint_utilise' => $last['endpoint'] ?? end($candidates),
        'attempt_utilise' => $last['attempt'] ?? null,
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

$students = testCandidates($baseUrl, (string)$tokenResult['token'], ['/students'], $retries, $host, $forceIp);
$teachers = testCandidates($baseUrl, (string)$tokenResult['token'], ['/teachers', '/users?role=teacher', '/users?role=staff'], $retries, $host, $forceIp);
$schedules = testCandidates($baseUrl, (string)$tokenResult['token'], ['/classschedules', '/classSchedules', '/schedules', '/classeschedules'], $retries, $host, $forceIp);
$courses = testCandidates($baseUrl, (string)$tokenResult['token'], ['/courses'], $retries, $host, $forceIp);
$classes = testCandidates($baseUrl, (string)$tokenResult['token'], ['/classes'], $retries, $host, $forceIp);
$enrollments = testCandidates($baseUrl, (string)$tokenResult['token'], ['/enrollments'], $retries, $host, $forceIp);
$academicSessions = testCandidates($baseUrl, (string)$tokenResult['token'], ['/academicSessions'], $retries, $host, $forceIp);
$orgs = testCandidates($baseUrl, (string)$tokenResult['token'], ['/orgs'], $retries, $host, $forceIp);

$output['endpoints'] = [
    'students' => [
        'endpoint_utilise' => $students['endpoint_utilise'],
        'attempt_utilise' => $students['attempt_utilise'],
        'status_code' => $students['status_code'],
        'duration_ms' => $students['duration_ms'],
        'curl_errno' => $students['curl_errno'],
        'curl_error' => $students['curl_error'],
        'tries' => $students['tries'],
    ],
    'teachers' => [
        'endpoint_utilise' => $teachers['endpoint_utilise'],
        'attempt_utilise' => $teachers['attempt_utilise'],
        'status_code' => $teachers['status_code'],
        'duration_ms' => $teachers['duration_ms'],
        'curl_errno' => $teachers['curl_errno'],
        'curl_error' => $teachers['curl_error'],
        'tries' => $teachers['tries'],
    ],
    'schedules' => [
        'endpoint_utilise' => $schedules['endpoint_utilise'],
        'attempt_utilise' => $schedules['attempt_utilise'],
        'status_code' => $schedules['status_code'],
        'duration_ms' => $schedules['duration_ms'],
        'curl_errno' => $schedules['curl_errno'],
        'curl_error' => $schedules['curl_error'],
        'tries' => $schedules['tries'],
    ],
    'additional' => [
        'courses' => [
            'endpoint_utilise' => $courses['endpoint_utilise'],
            'attempt_utilise' => $courses['attempt_utilise'],
            'status_code' => $courses['status_code'],
            'duration_ms' => $courses['duration_ms'],
            'curl_errno' => $courses['curl_errno'],
            'curl_error' => $courses['curl_error'],
            'tries' => $courses['tries'],
        ],
        'classes' => [
            'endpoint_utilise' => $classes['endpoint_utilise'],
            'attempt_utilise' => $classes['attempt_utilise'],
            'status_code' => $classes['status_code'],
            'duration_ms' => $classes['duration_ms'],
            'curl_errno' => $classes['curl_errno'],
            'curl_error' => $classes['curl_error'],
            'tries' => $classes['tries'],
        ],
        'enrollments' => [
            'endpoint_utilise' => $enrollments['endpoint_utilise'],
            'attempt_utilise' => $enrollments['attempt_utilise'],
            'status_code' => $enrollments['status_code'],
            'duration_ms' => $enrollments['duration_ms'],
            'curl_errno' => $enrollments['curl_errno'],
            'curl_error' => $enrollments['curl_error'],
            'tries' => $enrollments['tries'],
        ],
        'academicSessions' => [
            'endpoint_utilise' => $academicSessions['endpoint_utilise'],
            'attempt_utilise' => $academicSessions['attempt_utilise'],
            'status_code' => $academicSessions['status_code'],
            'duration_ms' => $academicSessions['duration_ms'],
            'curl_errno' => $academicSessions['curl_errno'],
            'curl_error' => $academicSessions['curl_error'],
            'tries' => $academicSessions['tries'],
        ],
        'orgs' => [
            'endpoint_utilise' => $orgs['endpoint_utilise'],
            'attempt_utilise' => $orgs['attempt_utilise'],
            'status_code' => $orgs['status_code'],
            'duration_ms' => $orgs['duration_ms'],
            'curl_errno' => $orgs['curl_errno'],
            'curl_error' => $orgs['curl_error'],
            'tries' => $orgs['tries'],
        ],
    ],
];

$studentList = is_array($students['payload']) ? extractList($students['payload'], ['students', 'users', 'results', 'items']) : [];
$teacherList = is_array($teachers['payload']) ? extractList($teachers['payload'], ['teachers', 'users', 'results', 'items']) : [];
$scheduleList = is_array($schedules['payload']) ? extractList($schedules['payload'], ['classSchedules', 'schedules', 'results', 'items']) : [];
$courseList = is_array($courses['payload']) ? extractList($courses['payload'], ['courses', 'results', 'items']) : [];
$classList = is_array($classes['payload']) ? extractList($classes['payload'], ['classes', 'results', 'items']) : [];
$enrollmentList = is_array($enrollments['payload']) ? extractList($enrollments['payload'], ['enrollments', 'results', 'items']) : [];
$academicSessionList = is_array($academicSessions['payload']) ? extractList($academicSessions['payload'], ['academicSessions', 'results', 'items']) : [];
$orgList = is_array($orgs['payload']) ? extractList($orgs['payload'], ['orgs', 'results', 'items']) : [];

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
    'additional' => [
        'courses' => [
            'count' => count($courseList),
            'payload_keys' => is_array($courses['payload']) ? array_keys($courses['payload']) : [],
            'sample_keys' => !empty($courseList) && is_array($courseList[0]) ? array_keys($courseList[0]) : [],
            'sample' => array_slice($courseList, 0, 2),
        ],
        'classes' => [
            'count' => count($classList),
            'payload_keys' => is_array($classes['payload']) ? array_keys($classes['payload']) : [],
            'sample_keys' => !empty($classList) && is_array($classList[0]) ? array_keys($classList[0]) : [],
            'sample' => array_slice($classList, 0, 2),
        ],
        'enrollments' => [
            'count' => count($enrollmentList),
            'payload_keys' => is_array($enrollments['payload']) ? array_keys($enrollments['payload']) : [],
            'sample_keys' => !empty($enrollmentList) && is_array($enrollmentList[0]) ? array_keys($enrollmentList[0]) : [],
            'sample' => array_slice($enrollmentList, 0, 2),
        ],
        'academicSessions' => [
            'count' => count($academicSessionList),
            'payload_keys' => is_array($academicSessions['payload']) ? array_keys($academicSessions['payload']) : [],
            'sample_keys' => !empty($academicSessionList) && is_array($academicSessionList[0]) ? array_keys($academicSessionList[0]) : [],
            'sample' => array_slice($academicSessionList, 0, 2),
        ],
        'orgs' => [
            'count' => count($orgList),
            'payload_keys' => is_array($orgs['payload']) ? array_keys($orgs['payload']) : [],
            'sample_keys' => !empty($orgList) && is_array($orgList[0]) ? array_keys($orgList[0]) : [],
            'sample' => array_slice($orgList, 0, 2),
        ],
    ],
];

echo json_encode($output, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
