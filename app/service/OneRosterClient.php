<?php
namespace App\Service;

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
        $url = rtrim($this->config['web_access_url'], '/') . '/students';

        return $this->getJson($url, [
            'Authorization: Bearer ' . $token,
            'Accept: application/json',
        ]);
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
        curl_close($ch);

        if ($err) {
            throw new RuntimeException('OneRoster GET error: ' . $err);
        }

        return json_decode($body, true) ?? [];
    }
}
