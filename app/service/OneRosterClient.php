<?php
namespace App\Service;

/**
 * [CONSERVÉ – NON UTILISÉ EN PRODUCTION]
 *
 * OneRosterClient — Client HTTP OneRoster V1.1 OAuth2
 * ===================================================
 *
 * Ce client est conservé à titre documentaire. La synchronisation principale
 * utilise désormais SmartschoolWebServiceV3Client (SOAP V3).
 *
 * ## Authentification
 *
 * Flux : OAuth2 client_credentials
 * POST {token_endpoint} avec grant_type, client_id, client_secret, scope
 * Le bearer token obtenu est injecté dans le header Authorization de chaque requête.
 *
 * ## Endpoints et stratégie de fallback
 *
 * Chaque méthode essaie plusieurs endpoints dans l'ordre. Si un endpoint retourne
 * HTTP 404 ou 405, il est ignoré et le suivant est tenté. Toute autre erreur HTTP
 * lève une RuntimeException.
 *
 *   getStudents()  : /students  →  /users?role=student
 *   getTeachers()  : /teachers  →  /users?role=teacher  →  /users?role=staff
 *   getSchedules() : /classschedules  →  /classSchedules  →  /schedules  →  /classeschedules
 *
 * ## Format de réponse attendu
 *
 * JSON avec enveloppe : { "users": [...] } ou { "classSchedules": [...] }
 * Les éléments respectent le schéma OneRoster V1.1.
 *
 * ## Configuration
 *
 * app/config/oneroster.php :
 *   client_id, client_secret, web_access_url, token_endpoint,
 *   http_timeout, scope, grant_type
 */

use RuntimeException;

class OneRosterClient {
    private array $config;

    public function __construct() {
        $this->config = require __DIR__ . '/../config/oneroster.php';
    }

    public function getAccessToken(): string {
        $body = [
            'grant_type'    => $this->config['grant_type'] ?? 'client_credentials',
            'client_id'     => $this->config['client_id'],
            'client_secret' => $this->config['client_secret'],
        ];

        if (!empty($this->config['scope'])) {
            $body['scope'] = $this->config['scope'];
        }

        $response = $this->postForm($this->config['token_endpoint'], $body);

        if (empty($response['access_token'])) {
            throw new RuntimeException('OneRoster token manquant dans la reponse');
        }

        return $response['access_token'];
    }

    public function getStudents(): array {
        $token = $this->getAccessToken();
        $headers = [
            'Authorization: Bearer ' . $token,
            'Accept: application/json',
        ];

        return $this->getFirstAvailablePayload([
            '/students',
            '/users?role=student',
        ], $headers);
    }

    public function getTeachers(): array {
        $token = $this->getAccessToken();
        $headers = [
            'Authorization: Bearer ' . $token,
            'Accept: application/json',
        ];

        return $this->getFirstAvailablePayload([
            '/teachers',
            '/users?role=teacher',
            '/users?role=staff',
        ], $headers);
    }

    public function getSchedules(): array {
        $token = $this->getAccessToken();
        $headers = [
            'Authorization: Bearer ' . $token,
            'Accept: application/json',
        ];

        return $this->getFirstAvailablePayload([
            '/classschedules',
            '/classSchedules',
            '/schedules',
            '/classeschedules',
        ], $headers);
    }

    private function getFirstAvailablePayload(array $relativeUrls, array $headers): array {
        $lastError = null;

        foreach ($relativeUrls as $relativeUrl) {
            try {
                return $this->getJson($this->buildUrl($relativeUrl), $headers);
            } catch (RuntimeException $e) {
                $lastError = $e;
                $msg = $e->getMessage();
                $isNotFound = str_contains($msg, 'HTTP 404') || str_contains($msg, 'HTTP 405');
                if ($isNotFound) {
                    continue;
                }
                throw $e;
            }
        }

        if ($lastError !== null) {
            throw $lastError;
        }

        return [];
    }

    private function buildUrl(string $relativeUrl): string {
        return rtrim($this->config['web_access_url'], '/') . '/' . ltrim($relativeUrl, '/');
    }

    private function postForm(string $url, array $data): array {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => (int)($this->config['http_timeout'] ?? 30),
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => http_build_query($data),
            CURLOPT_HTTPHEADER     => ['Content-Type: application/x-www-form-urlencoded'],
            CURLOPT_SSL_VERIFYPEER => true,
        ]);

        $body = curl_exec($ch);
        $err = curl_error($ch);
        curl_close($ch);

        if ($err) {
            throw new RuntimeException('OneRoster POST error: ' . $err);
        }

        return json_decode($body, true) ?? [];
    }

    private function getJson(string $url, array $headers): array {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => (int)($this->config['http_timeout'] ?? 30),
            CURLOPT_HTTPHEADER     => $headers,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);

        $body = curl_exec($ch);
        $err = curl_error($ch);
        $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($err) {
            throw new RuntimeException('OneRoster GET error: ' . $err);
        }

        $decoded = json_decode((string)$body, true);

        if ($code >= 400) {
            $snippet = is_string($body) ? trim(substr($body, 0, 180)) : '';
            throw new RuntimeException('OneRoster GET HTTP ' . $code . ($snippet !== '' ? (' - ' . $snippet) : ''));
        }

        if (!is_array($decoded)) {
            throw new RuntimeException('OneRoster GET reponse JSON invalide');
        }

        return $decoded;
    }
}
