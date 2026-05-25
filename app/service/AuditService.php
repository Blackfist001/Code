<?php
namespace App\Service;

use App\Core\DataBase;
use PDO;
use Throwable;

class AuditService {
    private const DEFAULT_LOGINS_LIMIT = 300;
    private const DEFAULT_DB_CHANGES_LIMIT = 500;

    private static function getPdo(): ?PDO {
        try {
            return (new DataBase())->getPdo();
        } catch (Throwable $e) {
            error_log('[AuditService] DB unavailable: ' . $e->getMessage());
            return null;
        }
    }

    private static function normalizeLimit(int $limit, int $default): int {
        return max(1, $limit > 0 ? $limit : $default);
    }

    private static function getClientIp(): string {
        $headers = [
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_REAL_IP',
            'REMOTE_ADDR',
        ];

        foreach ($headers as $header) {
            $value = $_SERVER[$header] ?? '';
            if (!is_string($value) || $value === '') {
                continue;
            }

            $ip = trim(explode(',', $value)[0]);
            if ($ip !== '') {
                return $ip;
            }
        }

        return '0.0.0.0';
    }

    private static function getCurrentUsername(): string {
        if (session_status() === PHP_SESSION_NONE) {
            @session_start();
        }

        $username = $_SESSION['username'] ?? '';
        return is_string($username) && $username !== '' ? $username : 'Système';
    }

    /**
     * @return mixed
     */
    private static function decodeJsonValue($value) {
        if ($value === null || $value === '') {
            return null;
        }

        if (is_array($value)) {
            return $value;
        }

        if (!is_string($value)) {
            return $value;
        }

        $decoded = json_decode($value, true);
        return json_last_error() === JSON_ERROR_NONE ? $decoded : $value;
    }

    public static function logLogin(?string $username = null, ?string $ip = null): void {
        $userValue = $username ?: self::getCurrentUsername();
        $ipValue = $ip ?: self::getClientIp();
        $createdAt = date('Y-m-d H:i:s');

        $pdo = self::getPdo();
        if ($pdo === null) {
            return;
        }

        try {
            $stmt = $pdo->prepare(
                'INSERT INTO audit_logins (`user`, `ip`, `created_at`) VALUES (:user, :ip, :created_at)'
            );
            $stmt->execute([
                ':user' => $userValue,
                ':ip' => $ipValue,
                ':created_at' => $createdAt,
            ]);
        } catch (Throwable $e) {
            error_log('[AuditService] logLogin DB failed: ' . $e->getMessage());
        }
    }

    /**
     * @param mixed $oldData
     * @param mixed $newData
     * @param array<string,mixed> $meta
     */
    public static function logDbChange(string $action, string $entity, $oldData, $newData, array $meta = []): void {
        $createdAt = date('Y-m-d H:i:s');
        $userValue = self::getCurrentUsername();
        $ipValue = self::getClientIp();

        $pdo = self::getPdo();
        if ($pdo === null) {
            return;
        }

        try {
            $stmt = $pdo->prepare(
                'INSERT INTO audit_db_changes (`user`, `ip`, `action`, `entity`, `old_data`, `new_data`, `meta`, `created_at`)
                 VALUES (:user, :ip, :action, :entity, :old_data, :new_data, :meta, :created_at)'
            );
            $stmt->execute([
                ':user' => $userValue,
                ':ip' => $ipValue,
                ':action' => $action,
                ':entity' => $entity,
                ':old_data' => $oldData === null ? null : json_encode($oldData, JSON_UNESCAPED_UNICODE),
                ':new_data' => $newData === null ? null : json_encode($newData, JSON_UNESCAPED_UNICODE),
                ':meta' => empty($meta) ? null : json_encode($meta, JSON_UNESCAPED_UNICODE),
                ':created_at' => $createdAt,
            ]);
        } catch (Throwable $e) {
            error_log('[AuditService] logDbChange DB failed: ' . $e->getMessage());
        }
    }

    /**
     * @return array<int,array<string,mixed>>
     */
    public static function getLogins(int $limit = 300): array {
        $safeLimit = self::normalizeLimit($limit, self::DEFAULT_LOGINS_LIMIT);
        $pdo = self::getPdo();
        if ($pdo !== null) {
            try {
                $stmt = $pdo->prepare(
                    'SELECT `user`, `ip`, `created_at` FROM audit_logins ORDER BY id DESC LIMIT :limit'
                );
                $stmt->bindValue(':limit', $safeLimit, PDO::PARAM_INT);
                $stmt->execute();
                $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

                return array_map(static function (array $row): array {
                    $createdAt = (string)($row['created_at'] ?? '');
                    $timestamp = strtotime($createdAt) ?: time();
                    return [
                        'user' => $row['user'] ?? 'Système',
                        'date' => date('Y-m-d', $timestamp),
                        'time' => date('H:i:s', $timestamp),
                        'ip' => $row['ip'] ?? '0.0.0.0',
                    ];
                }, $rows);
            } catch (Throwable $e) {
                error_log('[AuditService] getLogins DB failed: ' . $e->getMessage());
            }
        }

        return [];
    }

    /**
     * @return array<int,array<string,mixed>>
     */
    public static function getDbChanges(int $limit = 500): array {
        $safeLimit = self::normalizeLimit($limit, self::DEFAULT_DB_CHANGES_LIMIT);
        $pdo = self::getPdo();
        if ($pdo !== null) {
            try {
                $stmt = $pdo->prepare(
                    'SELECT `user`, `ip`, `action`, `entity`, `old_data`, `new_data`, `meta`, `created_at`
                     FROM audit_db_changes
                     ORDER BY id DESC
                     LIMIT :limit'
                );
                $stmt->bindValue(':limit', $safeLimit, PDO::PARAM_INT);
                $stmt->execute();
                $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

                return array_map(static function (array $row): array {
                    $createdAt = (string)($row['created_at'] ?? '');
                    $timestamp = strtotime($createdAt) ?: time();
                    return [
                        'user' => $row['user'] ?? 'Système',
                        'date' => date('Y-m-d', $timestamp),
                        'time' => date('H:i:s', $timestamp),
                        'ip' => $row['ip'] ?? '0.0.0.0',
                        'action' => $row['action'] ?? null,
                        'entity' => $row['entity'] ?? null,
                        'old_data' => self::decodeJsonValue($row['old_data'] ?? null),
                        'new_data' => self::decodeJsonValue($row['new_data'] ?? null),
                        'meta' => self::decodeJsonValue($row['meta'] ?? null) ?? [],
                    ];
                }, $rows);
            } catch (Throwable $e) {
                error_log('[AuditService] getDbChanges DB failed: ' . $e->getMessage());
            }
        }

        return [];
    }
}
