<?php
/**
 * Tests de sécurité P1 - Validation des entrées et Autorisation
 * 
 * Tests:
 * 1. ValidationService::validateString() - Validations de chaînes
 * 2. ValidationService::validateDate() - Validations de dates
 * 3. ValidationService::validateUUID() - Validations d'UUIDs
 * 4. ValidationService::validateId() - Validations d'IDs numériques
 * 5. ValidationService::validatePassword() - Validations de mots de passe
 * 6. ValidationService::sanitizeSearch() - Nettoyage de requêtes
 */

require_once __DIR__ . '/../vendor/autoload.php';

use App\Service\ValidationService;

// Couleurs de sortie
$colors = [
    'reset' => "\033[0m",
    'red' => "\033[91m",
    'green' => "\033[92m",
    'yellow' => "\033[93m",
];

$passed = 0;
$failed = 0;
$tests = [];

function test($name, $condition) {
    global $passed, $failed, $tests, $colors;
    
    if ($condition) {
        echo "✓ {$colors['green']}PASS{$colors['reset']}: $name\n";
        $passed++;
        $tests[] = ['name' => $name, 'status' => 'PASS'];
    } else {
        echo "✗ {$colors['red']}FAIL{$colors['reset']}: $name\n";
        $failed++;
        $tests[] = ['name' => $name, 'status' => 'FAIL'];
    }
}

echo "\n=== TEST P1 - VALIDATION ET AUTORISATION ===\n\n";

// ============================================
// TEST 1: ValidationService::validateString()
// ============================================
echo "Test 1: ValidationService::validateString()\n";
test("Chaîne valide (\"hello\")", ValidationService::validateString("hello"));
test("Chaîne vide valide par défaut", ValidationService::validateString(""));
test("Chaîne vide invalide avec minLen=1", !ValidationService::validateString("", 1));
test("Non-chaîne (123) invalide", !ValidationService::validateString(123));
test("Chaîne trop longue rejetée", !ValidationService::validateString("aaa", 0, 2)); // 3 chars, max 2 = FAIL
test("Chaîne trop courte rejetée", !ValidationService::validateString("ab", 3)); // 2 chars, min 3 = FAIL
test("Chaîne exacte à la limite", ValidationService::validateString("abc", 3, 3));
echo "\n";

// ============================================
// TEST 2: ValidationService::validateDate()
// ============================================
echo "Test 2: ValidationService::validateDate()\n";
test("Date valide (2026-05-11)", ValidationService::validateDate("2026-05-11"));
test("Date invalide (2026-13-01)", !ValidationService::validateDate("2026-13-01"));
test("Date invalide (2026-05-32)", !ValidationService::validateDate("2026-05-32"));
test("Non-date (123) invalide", !ValidationService::validateDate(123));
test("Format incorrect rejeté", !ValidationService::validateDate("11-05-2026", 'Y-m-d'));
test("Format correct accepté", ValidationService::validateDate("2026-05-11", 'Y-m-d'));
echo "\n";

// ============================================
// TEST 3: ValidationService::validateUUID()
// ============================================
echo "Test 3: ValidationService::validateUUIDGeneric()\n";
test("UUID v4 valide", ValidationService::validateUUIDGeneric("550e8400-e29b-41d4-a716-446655440000"));
test("UUID (autre version) valide", ValidationService::validateUUIDGeneric("12345678-1234-5678-1234-567812345678"));
test("UUID invalide (mauvais format)", !ValidationService::validateUUIDGeneric("12345678-1234-5678-1234-56781234567"));
test("UUID invalide (trop court)", !ValidationService::validateUUIDGeneric("550e8400-e29b-41d4-a716"));
test("UUID invalide (caractères invalides)", !ValidationService::validateUUIDGeneric("550e8400-e29b-41d4-a716-44665544ZZZZ"));
test("Non-UUID (string simple) invalide", !ValidationService::validateUUIDGeneric("hello"));
echo "\n";

// ============================================
// TEST 4: ValidationService::validateId()
// ============================================
echo "Test 4: ValidationService::validateId()\n";
test("ID valide (1)", ValidationService::validateId(1));
test("ID valide (999)", ValidationService::validateId(999));
test("ID invalide (0)", !ValidationService::validateId(0));
test("ID invalide (-1)", !ValidationService::validateId(-1));
test("ID valide (string '123')", ValidationService::validateId("123"));
test("ID invalide (string 'abc')", !ValidationService::validateId("abc"));
test("ID invalide (null)", !ValidationService::validateId(null));
echo "\n";

// ============================================
// TEST 5: ValidationService::validatePassword()
// ============================================
echo "Test 5: ValidationService::validatePassword()\n";
test("Mot de passe valide (8+ chars)", ValidationService::validatePassword("password123"));
test("Mot de passe invalide (trop court)", !ValidationService::validatePassword("pass"));
test("Mot de passe invalide (7 chars)", !ValidationService::validatePassword("1234567"));
test("Mot de passe valide (exactement 8 chars)", ValidationService::validatePassword("12345678"));
test("Mot de passe invalide (trop long, >128)", !ValidationService::validatePassword(str_repeat("a", 129)));
test("Non-password (123) invalide", !ValidationService::validatePassword(123));
echo "\n";

// ============================================
// TEST 6: ValidationService::sanitizeSearch()
// ============================================
echo "Test 6: ValidationService::sanitizeSearch()\n";

try {
    $result = ValidationService::sanitizeSearch("hello");
    test("Requête valide trimée et acceptée", $result === "hello");
} catch (Exception $e) {
    test("Requête valide trimée et acceptée", false);
}

try {
    ValidationService::sanitizeSearch("");
    test("Requête vide rejetée", false);
} catch (Exception $e) {
    test("Requête vide rejetée", strpos($e->getMessage(), "trop courte") !== false);
}

try {
    ValidationService::sanitizeSearch(str_repeat("a", 101));
    test("Requête trop longue rejetée", false);
} catch (Exception $e) {
    test("Requête trop longue rejetée", strpos($e->getMessage(), "trop longue") !== false);
}

try {
    $result = ValidationService::sanitizeSearch("  hello world  ");
    test("Requête trimée correctement", $result === "hello world");
} catch (Exception $e) {
    test("Requête trimée correctement", false);
}

try {
    ValidationService::sanitizeSearch(123);
    test("Non-string rejeté", false);
} catch (Exception $e) {
    test("Non-string rejeté", strpos($e->getMessage(), "invalide") !== false);
}

echo "\n";

// ============================================
// TEST 7: ValidationService::validateUsername()
// ============================================
echo "Test 7: ValidationService::validateUsername()\n";
test("Username valide (john)", ValidationService::validateUsername("john"));
test("Username invalide (ab)", !ValidationService::validateUsername("ab")); // 2 chars < 3
test("Username valide (admin123)", ValidationService::validateUsername("admin123"));
test("Username valide avec underscores (admin_user)", ValidationService::validateUsername("admin_user"));
test("Username valide avec tirets (admin-user)", ValidationService::validateUsername("admin-user"));
test("Username invalide (caractères spéciaux)", !ValidationService::validateUsername("admin@user"));
test("Username trop long rejeté", !ValidationService::validateUsername(str_repeat("a", 51)));
echo "\n";

// ============================================
// TEST 8: ValidationService::validateRole()
// ============================================
echo "Test 8: ValidationService::validateRole()\n";
test("Rôle valide (Gestionnaire)", ValidationService::validateRole("Gestionnaire"));
test("Rôle valide (Surveillant)", ValidationService::validateRole("Surveillant"));
test("Rôle valide (Administrateur)", ValidationService::validateRole("Administrateur"));
test("Rôle invalide (BadRole)", !ValidationService::validateRole("BadRole"));
test("Rôle invalide (lowercase)", !ValidationService::validateRole("gestionnaire"));
test("Rôle invalide (null)", !ValidationService::validateRole(null));
echo "\n";

// ============================================
// RÉSUMÉ
// ============================================
echo "=== RÉSUMÉ DES TESTS ===\n";
echo "{$colors['green']}✓ PASS: {$passed}{$colors['reset']}\n";
echo "{$colors['red']}✗ FAIL: {$failed}{$colors['reset']}\n";
echo "Total: " . ($passed + $failed) . "\n\n";

if ($failed === 0) {
    echo "{$colors['green']}✓ TOUS LES TESTS PASSENT ✓{$colors['reset']}\n";
    exit(0);
} else {
    echo "{$colors['red']}✗ CERTAINS TESTS ONT ÉCHOUÉ{$colors['reset']}\n";
    exit(1);
}
?>
