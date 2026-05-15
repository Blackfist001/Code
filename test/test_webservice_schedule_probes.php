<?php
declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

$config = require __DIR__ . '/../app/config/webService.php';
$accessCode = trim((string)($config['serviceWeb_password'] ?? ''));
$wsdl = 'https://centreleonarddefrance.smartschool.be/Webservices/V3?wsdl';

if ($accessCode === '') {
    echo json_encode([
        'success' => false,
        'error' => 'Configuration webService invalide: serviceWeb_password vide.',
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . PHP_EOL;
    exit(1);
}

if (!class_exists(SoapClient::class)) {
    echo json_encode([
        'success' => false,
        'error' => 'Extension SOAP PHP manquante. Activez php_soap.',
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . PHP_EOL;
    exit(1);
}

function makeSoapClient(string $wsdl): SoapClient {
    $streamContext = stream_context_create([
        'ssl' => [
            'crypto_method' => STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT,
            'verify_peer' => true,
            'verify_peer_name' => true,
        ],
    ]);

    return new SoapClient($wsdl, [
        'cache_wsdl' => WSDL_CACHE_NONE,
        'connection_timeout' => 10,
        'exceptions' => true,
        'features' => SOAP_SINGLE_ELEMENT_ARRAYS,
        'stream_context' => $streamContext,
        'trace' => false,
    ]);
}

function decodePayload($value): array {
    if (is_array($value)) {
        return $value;
    }

    if (is_object($value)) {
        $json = json_encode($value);
        return is_string($json) ? (json_decode($json, true) ?? []) : [];
    }

    if (!is_string($value)) {
        return [];
    }

    $trimmed = trim($value);
    if ($trimmed === '') {
        return [];
    }

    $json = json_decode($trimmed, true);
    if (is_array($json)) {
        return $json;
    }

    $decoded64 = base64_decode($trimmed, true);
    if (is_string($decoded64) && $decoded64 !== '') {
        $json64 = json_decode($decoded64, true);
        if (is_array($json64)) {
            return $json64;
        }

        $xml = @simplexml_load_string($decoded64);
        if ($xml !== false) {
            $jsonXml = json_encode($xml);
            return is_string($jsonXml) ? (json_decode($jsonXml, true) ?? []) : [];
        }

        $unserialized = @unserialize($decoded64);
        if (is_array($unserialized)) {
            return $unserialized;
        }
    }

    return [];
}

function flattenKeys(array $value, string $prefix = '', int $depth = 0, int $maxDepth = 6): array {
    if ($depth > $maxDepth) {
        return [];
    }

    $keys = [];
    foreach ($value as $k => $v) {
        $current = $prefix === '' ? (string)$k : $prefix . '.' . (string)$k;
        $keys[] = $current;

        if (is_array($v)) {
            $keys = array_merge($keys, flattenKeys($v, $current, $depth + 1, $maxDepth));
        }
    }

    return $keys;
}

function callMethod(SoapClient $soap, string $accessCode, string $method, array $extraParams = []): array {
    $params = array_merge([$accessCode], $extraParams);
    $start = microtime(true);

    try {
        $raw = $soap->__soapCall($method, $params);
        $durationMs = (int)round((microtime(true) - $start) * 1000);
        $decoded = decodePayload($raw);
        $flatKeys = flattenKeys($decoded);

        $signalTerms = [
            'day', 'weekday', 'date', 'jour', 'dag',
            'start', 'end', 'hour', 'time', 'heure', 'uur',
            'room', 'classroom', 'local', 'lokaal',
            'untis', 'schedule', 'horaire', 'planning',
        ];

        $signals = [];
        foreach ($flatKeys as $k) {
            $lower = strtolower($k);
            foreach ($signalTerms as $term) {
                if (str_contains($lower, $term)) {
                    $signals[] = $k;
                    break;
                }
            }
        }

        $signals = array_values(array_unique($signals));
        sort($signals);

        $rootKeys = array_keys($decoded);
        $sample = [];
        if (!empty($decoded)) {
            $sample = array_slice($decoded, 0, 1);
        }

        return [
            'ok' => true,
            'duration_ms' => $durationMs,
            'decoded' => !empty($decoded),
            'root_keys' => $rootKeys,
            'signal_keys' => array_slice($signals, 0, 40),
            'sample' => $sample,
            'raw_type' => gettype($raw),
        ];
    } catch (Throwable $e) {
        return [
            'ok' => false,
            'error' => $e->getMessage(),
        ];
    }
}

function extractErrorCodeMessage($payload, string $code): ?string {
    if (is_array($payload)) {
        if (isset($payload[$code]) && is_string($payload[$code])) {
            return $payload[$code];
        }

        foreach ($payload as $item) {
            if (!is_array($item)) {
                continue;
            }

            $itemCode = isset($item['code']) ? (string)$item['code'] : null;
            $itemMsg = isset($item['message']) ? (string)$item['message'] : null;
            if ($itemCode === $code && $itemMsg !== null) {
                return $itemMsg;
            }
        }
    }

    return null;
}

try {
    $soap = makeSoapClient($wsdl);

    $report = [
        'success' => true,
        'wsdl' => $wsdl,
        'probes' => [],
    ];

    $classListProbe = callMethod($soap, $accessCode, 'getClassListJson');
    $report['probes']['getClassListJson'] = $classListProbe;

    try {
        $errorCodesRaw = $soap->__soapCall('returnJsonErrorCodes', []);
        $errorCodesDecoded = decodePayload($errorCodesRaw);
        $report['probes']['returnJsonErrorCodes'] = [
            'ok' => true,
            'raw_type' => gettype($errorCodesRaw),
            'decoded' => !empty($errorCodesDecoded),
            'root_keys' => array_slice(array_keys($errorCodesDecoded), 0, 30),
            'sample' => array_slice($errorCodesDecoded, 0, 1),
        ];
    } catch (Throwable $e) {
        $errorCodesDecoded = [];
        $report['probes']['returnJsonErrorCodes'] = [
            'ok' => false,
            'error' => $e->getMessage(),
        ];
    }

    $firstClassCode = null;
    if (!empty($classListProbe['sample'][0]) && is_array($classListProbe['sample'][0])) {
        $row = $classListProbe['sample'][0];
        $firstClassCode = (string)($row['code'] ?? $row['classCode'] ?? '');
    }

    $report['probes']['getCourses'] = callMethod($soap, $accessCode, 'getCourses');
    $report['probes']['getClassTeachers_true'] = callMethod($soap, $accessCode, 'getClassTeachers', [true]);
    $report['probes']['getSkoreClassTeacherCourseRelation'] = callMethod($soap, $accessCode, 'getSkoreClassTeacherCourseRelation');
    $report['probes']['getAllGroupsAndClasses'] = callMethod($soap, $accessCode, 'getAllGroupsAndClasses');

    if ($firstClassCode !== '') {
        $report['probes']['getSchoolyearDataOfClass'] = callMethod($soap, $accessCode, 'getSchoolyearDataOfClass', [$firstClassCode]);
        $report['meta'] = ['tested_class_code' => $firstClassCode];
    } else {
        $report['probes']['getSchoolyearDataOfClass'] = [
            'ok' => false,
            'error' => 'Impossible de determiner un classCode depuis getClassListJson.',
        ];
    }

        // Pipeline Skore: demarrer la synchro puis verifier son statut.
        $startRaw = $soap->__soapCall('startSkoreSync', [$accessCode]);
        $startDecoded = is_string($startRaw) ? (json_decode($startRaw, true) ?? []) : [];
        $serviceId = is_array($startDecoded) ? (string)($startDecoded['serviceId'] ?? '') : '';
        $statusTrace = [];

        if ($serviceId !== '') {
            for ($i = 1; $i <= 12; $i++) {
                $statusRaw = $soap->__soapCall('checkStatus', [$accessCode, $serviceId]);
                $statusDecoded = is_string($statusRaw) ? (json_decode($statusRaw, true) ?? []) : [];
                $statusTrace[] = [
                    'attempt' => $i,
                    'raw' => $statusRaw,
                    'decoded' => $statusDecoded,
                ];

                if (is_array($statusDecoded) && isset($statusDecoded['status']) && (int)$statusDecoded['status'] !== 0) {
                    break;
                }

                usleep(700000);
            }
        }

        $code50Message = extractErrorCodeMessage($errorCodesDecoded, '50');

        $report['skore_sync'] = [
            'start_raw' => $startRaw,
            'start_decoded' => $startDecoded,
            'service_id' => $serviceId,
            'status_trace' => $statusTrace,
        ];

        $skoreRelationRaw = $soap->__soapCall('getSkoreClassTeacherCourseRelation', [$accessCode]);
        $report['skore_relation_raw'] = [
            'type' => gettype($skoreRelationRaw),
            'value' => is_int($skoreRelationRaw) ? $skoreRelationRaw : (is_string($skoreRelationRaw) ? substr($skoreRelationRaw, 0, 300) : $skoreRelationRaw),
            'code_50_message' => $code50Message,
        ];

    echo json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . PHP_EOL;
} catch (Throwable $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . PHP_EOL;
    exit(1);
}
