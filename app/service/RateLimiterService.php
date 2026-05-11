<?php
namespace App\Service;

class RateLimiterService {
    private const LOGIN_MAX_ATTEMPTS = 5;
    private const LOGIN_WINDOW_SECONDS = 900; // 15 minutes
    private const STORAGE_FILE = __DIR__ . '/../logs/rate_limit_login.json';

    private static function getStoragePath(): string {
        $path = self::STORAGE_FILE;
        $dir = dirname($path);
        if (!is_dir($dir)) {
            mkdir($dir, 0775, true);
        }
        if (!file_exists($path)) {
            file_put_contents($path, json_encode(new \stdClass(), JSON_PRETTY_PRINT));
        }
        return $path;
    }

    private static function makeKey(string $ip, string $username): string {
        return hash('sha256', strtolower(trim($ip)) . '|' . strtolower(trim($username)));
    }

    private static function loadData(): array {
        $path = self::getStoragePath();
        $raw = file_get_contents($path);
        $data = json_decode($raw ?: '{}', true);
        return is_array($data) ? $data : [];
    }

    private static function saveData(array $data): void {
        $path = self::getStoragePath();
        file_put_contents($path, json_encode($data, JSON_PRETTY_PRINT), LOCK_EX);
    }

    private static function purgeExpired(array &$data): void {
        $now = time();
        foreach ($data as $key => $entry) {
            $firstAttempt = (int)($entry['first_attempt'] ?? 0);
            if ($firstAttempt <= 0 || ($now - $firstAttempt) > self::LOGIN_WINDOW_SECONDS) {
                unset($data[$key]);
            }
        }
    }

    public static function checkLogin(string $ip, string $username): array {
        $data = self::loadData();
        self::purgeExpired($data);

        $key = self::makeKey($ip, $username);
        $entry = $data[$key] ?? null;

        if (!is_array($entry)) {
            return ['allowed' => true, 'retry_after' => 0, 'attempts' => 0];
        }

        $attempts = (int)($entry['attempts'] ?? 0);
        $firstAttempt = (int)($entry['first_attempt'] ?? 0);

        if ($attempts < self::LOGIN_MAX_ATTEMPTS) {
            return ['allowed' => true, 'retry_after' => 0, 'attempts' => $attempts];
        }

        $elapsed = time() - $firstAttempt;
        $retryAfter = max(0, self::LOGIN_WINDOW_SECONDS - $elapsed);

        if ($retryAfter <= 0) {
            unset($data[$key]);
            self::saveData($data);
            return ['allowed' => true, 'retry_after' => 0, 'attempts' => 0];
        }

        return ['allowed' => false, 'retry_after' => $retryAfter, 'attempts' => $attempts];
    }

    public static function registerFailure(string $ip, string $username): void {
        $data = self::loadData();
        self::purgeExpired($data);

        $key = self::makeKey($ip, $username);
        $now = time();

        if (!isset($data[$key])) {
            $data[$key] = [
                'attempts' => 1,
                'first_attempt' => $now,
                'last_attempt' => $now,
            ];
        } else {
            $data[$key]['attempts'] = (int)($data[$key]['attempts'] ?? 0) + 1;
            $data[$key]['last_attempt'] = $now;
        }

        self::saveData($data);
    }

    public static function clearFailures(string $ip, string $username): void {
        $data = self::loadData();
        $key = self::makeKey($ip, $username);
        unset($data[$key]);
        self::saveData($data);
    }
}
