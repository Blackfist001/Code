<?php
namespace App\Service;

class CsrfService {
    private const SESSION_KEY = 'csrf_token';

    private static function ensureSession(): void {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }

    public static function getToken(): string {
        self::ensureSession();

        if (empty($_SESSION[self::SESSION_KEY])) {
            $_SESSION[self::SESSION_KEY] = bin2hex(random_bytes(32));
        }

        return $_SESSION[self::SESSION_KEY];
    }

    public static function rotateToken(): string {
        self::ensureSession();
        $_SESSION[self::SESSION_KEY] = bin2hex(random_bytes(32));
        return $_SESSION[self::SESSION_KEY];
    }

    public static function validateToken(?string $token): bool {
        self::ensureSession();

        if (!is_string($token) || $token === '') {
            return false;
        }

        $sessionToken = $_SESSION[self::SESSION_KEY] ?? null;
        if (!is_string($sessionToken) || $sessionToken === '') {
            return false;
        }

        return hash_equals($sessionToken, $token);
    }
}
