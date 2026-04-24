<?php
namespace App\Service;

use RuntimeException;
use SoapClient;
use SoapFault;

class SmartschoolWebServiceV3Client {
    private array $config;
    private ?SoapClient $soap = null;
    private ?string $soapInitError = null;
    private string $wsdl = 'https://centreleonarddefrance.smartschool.be/Webservices/V3?wsdl';

    public function __construct(?SoapClient $soapClient = null) {
        $this->config = require __DIR__ . '/../config/webService.php';

        if ($soapClient !== null) {
            $this->soap = $soapClient;
            return;
        }
    }

    public function testConnection(): array {
        $result = $this->call('getClassListJson');
        $classes = $this->decodeToArray($result);

        return [
            'ok' => true,
            'class_count' => is_array($classes) ? count($classes) : 0,
            'sample_classes' => is_array($classes) ? array_slice($classes, 0, 3) : [],
        ];
    }

    public function isSoapExtensionAvailable(): bool {
        return class_exists(SoapClient::class);
    }

    public function testWsdlReachability(): array {
        $ch = curl_init($this->wsdl);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 20,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
        ]);

        $start = microtime(true);
        $body = curl_exec($ch);
        $duration = (int)round((microtime(true) - $start) * 1000);
        $error = curl_error($ch);
        $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        return [
            'ok' => $error === '' && $status > 0 && $status < 500,
            'http_status' => $status,
            'duration_ms' => $duration,
            'curl_error' => $error,
            'body_excerpt' => is_string($body) ? trim(substr($body, 0, 140)) : '',
        ];
    }

    public function getStudents(): array {
        $classes = $this->getClasses();
        $students = [];

        foreach ($classes as $classRow) {
            $classCode = (string)($classRow['code'] ?? $classRow['classCode'] ?? '');
            if ($classCode === '') {
                continue;
            }

            $payload = $this->call('getAllAccountsExtended', [$classCode, '0']);
            $accounts = $this->extractAccounts($payload);

            foreach ($accounts as $account) {
                if ($this->looksLikeTeacher($account)) {
                    continue;
                }

                $account['source_class_code'] = $classCode;
                $students[] = $account;
            }
        }

        return $students;
    }

    public function getTeachers(): array {
        // Les enseignants sont dans le groupe Smartschool "Enseignants" (type G)
        $payload = $this->call('getAllAccountsExtended', ['Enseignants', '1']);
        $accounts = $this->extractAccounts($payload);

        // Filtrer les vrais enseignants (basisrol != 1) au cas où des admins seraient inclus
        return array_values(array_filter($accounts, fn($a) => ($a['basisrol'] ?? '') !== '1'));
    }

    public function getSchedules(): array {
        // getCourses retourne un XML base64 avec cours + mainTeacher + studentGroups
        $payload = $this->call('getCourses');
        $xmlStr = base64_decode(trim((string)$payload), true);
        if ($xmlStr === false || $xmlStr === '') {
            return [];
        }

        return $this->parseCourseXml($xmlStr);
    }

    public function getClasses(): array {
        $result = $this->call('getClassListJson');
        $classes = $this->decodeToArray($result);

        return array_is_list($classes) ? $classes : [];
    }

    private function createSoapClient(): SoapClient {
        $timeout = 8;

        $streamContext = stream_context_create([
            'ssl' => [
                'crypto_method' => STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT,
                'verify_peer' => true,
                'verify_peer_name' => true,
            ],
        ]);

        return new SoapClient($this->wsdl, [
            'cache_wsdl' => WSDL_CACHE_NONE,
            'connection_timeout' => $timeout,
            'exceptions' => true,
            'features' => SOAP_SINGLE_ELEMENT_ARRAYS,
            'stream_context' => $streamContext,
            'trace' => false,
        ]);
    }

    private function ensureSoapClient(): void {
        if ($this->soap !== null || $this->soapInitError !== null) {
            return;
        }

        if (!class_exists(SoapClient::class)) {
            $this->soapInitError = 'Extension SOAP PHP manquante. Activez php_soap pour recuperer les donnees.';
            return;
        }

        try {
            $this->soap = $this->createSoapClient();
        } catch (SoapFault $e) {
            $raw = $e->getMessage();
            if (stripos($raw, 'timeout') !== false || stripos($raw, 'timed out') !== false) {
                $this->soapInitError = 'Serveur Smartschool injoignable (timeout). Synchronisation ignorée.';
            } elseif (stripos($raw, "Couldn't load") !== false || stripos($raw, 'failed to load') !== false || stripos($raw, 'Could not connect') !== false) {
                $this->soapInitError = 'Serveur Smartschool injoignable (réseau). Synchronisation ignorée.';
            } else {
                $this->soapInitError = 'Smartschool indisponible : ' . $raw;
            }
        }
    }

    private function call(string $method, array $extraParams = []) {
        $this->ensureSoapClient();

        if ($this->soap === null) {
            $message = $this->soapInitError ?? 'Extension SOAP PHP manquante. Activez php_soap pour recuperer les donnees.';
            throw new RuntimeException($message);
        }

        $params = array_merge([$this->accessCode()], $extraParams);

        try {
            return $this->soap->__soapCall($method, $params);
        } catch (SoapFault $e) {
            throw new RuntimeException('Smartschool SOAP ' . $method . ' failed: ' . $e->getMessage(), 0, $e);
        }
    }

    private function accessCode(): string {
        $accessCode = trim((string)($this->config['serviceWeb_password'] ?? ''));
        if ($accessCode === '') {
            throw new RuntimeException('Configuration webService invalide: serviceWeb_password vide.');
        }

        return $accessCode;
    }

    private function extractAccounts($payload): array {
        $decoded = $this->decodeToArray($payload);

        foreach (['accounts', 'users', 'results', 'items'] as $key) {
            if (isset($decoded[$key]) && is_array($decoded[$key])) {
                return $decoded[$key];
            }
        }

        return array_is_list($decoded) ? $decoded : [];
    }

    private function looksLikeTeacher(array $account): bool {
        // basisrol "1" = leerling (étudiant) — tout autre rôle est non-étudiant
        $basisrol = (string)($account['basisrol'] ?? '');
        if ($basisrol !== '' && $basisrol !== '1') {
            return true;
        }

        // Fallback: vérification textuelle pour les plateformes avec d'autres conventions
        $candidates = [
            $account['role'] ?? null,
            $account['type'] ?? null,
        ];
        foreach ($candidates as $candidate) {
            if (!is_string($candidate)) {
                continue;
            }
            $value = strtolower($candidate);
            if (str_contains($value, 'teacher') || str_contains($value, 'prof') || str_contains($value, 'enseignant')) {
                return true;
            }
        }

        return false;
    }

    private function parseCourseXml(string $xmlStr): array {
        $xml = @simplexml_load_string($xmlStr);
        if ($xml === false) {
            return [];
        }

        $courses = [];
        // Ne pas caster en (array) — cela détruit la structure SimpleXML
        $courseNodes = $xml->getName() === 'course' ? [$xml] : $xml->course;

        foreach ($courseNodes as $c) {
            $groups = [];
            if (isset($c->studentGroups->studentGroup)) {
                $sgNodes = $c->studentGroups->studentGroup;
                // SimpleXML : un seul node ou plusieurs
                if (!($sgNodes instanceof \SimpleXMLElement)) {
                    foreach ($sgNodes as $sg) {
                        $groups[] = (string)$sg->name;
                    }
                } else {
                    $groups[] = (string)$sgNodes->name;
                }
            }

            $courses[] = [
                'courseName'           => (string)$c->name,
                'description'          => (string)$c->description,
                'active'               => (string)$c->active,
                'mainTeacherUsername'  => (string)($c->mainTeacher->username ?? ''),
                'mainTeacherFirstname' => (string)($c->mainTeacher->firstname ?? ''),
                'mainTeacherLastname'  => (string)($c->mainTeacher->lastname ?? ''),
                'studentGroups'        => $groups,
            ];
        }

        return $courses;
    }

    private function decodeToArray($value): array {
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
}
