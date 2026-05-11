<?php
/**
 * Tests de sécurité P2
 * - CSRF token lifecycle
 * - Rate limiting login
 */

require_once __DIR__ . '/../vendor/autoload.php';

use App\Service\CsrfService;
use App\Service\RateLimiterService;

$passed = 0;
$failed = 0;

function assertTest(string $label, bool $condition): void {
    global $passed, $failed;
    if ($condition) {
        echo "[PASS] {$label}\n";
        $passed++;
        return;
    }

    echo "[FAIL] {$label}\n";
    $failed++;
}

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Reset session token state for deterministic tests.
unset($_SESSION['csrf_token']);

$token1 = CsrfService::getToken();
assertTest('CSRF token generated', is_string($token1) && strlen($token1) === 64);

$token2 = CsrfService::getToken();
assertTest('CSRF token stable within same session', $token1 === $token2);

assertTest('CSRF token validates correctly', CsrfService::validateToken($token1));
assertTest('CSRF token rejects invalid value', !CsrfService::validateToken('invalid-token'));

$rotated = CsrfService::rotateToken();
assertTest('CSRF token rotated', $rotated !== $token1 && strlen($rotated) === 64);
assertTest('Old CSRF token invalid after rotation', !CsrfService::validateToken($token1));
assertTest('New CSRF token valid after rotation', CsrfService::validateToken($rotated));

$ip = '127.0.0.1';
$user = 'test_user_p2';

RateLimiterService::clearFailures($ip, $user);
$check0 = RateLimiterService::checkLogin($ip, $user);
assertTest('Rate limit initially allows login', $check0['allowed'] === true && $check0['attempts'] === 0);

for ($i = 0; $i < 5; $i++) {
    RateLimiterService::registerFailure($ip, $user);
}

$checkBlocked = RateLimiterService::checkLogin($ip, $user);
assertTest('Rate limit blocks after 5 failed attempts', $checkBlocked['allowed'] === false);
assertTest('Rate limit returns retry_after > 0 when blocked', (int)$checkBlocked['retry_after'] > 0);

RateLimiterService::clearFailures($ip, $user);
$checkReset = RateLimiterService::checkLogin($ip, $user);
assertTest('Rate limit resets after clearFailures', $checkReset['allowed'] === true && $checkReset['attempts'] === 0);

echo "\nSummary: {$passed} passed, {$failed} failed\n";
exit($failed === 0 ? 0 : 1);
