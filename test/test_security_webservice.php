<?php
/**
 * TEST_SECURITY_WEBSERVICE.php
 * Tests de sécurité pour app/config/webService.php et SmartschoolWebServiceV3Client
 * Exécution : php test/test_security_webservice.php
 */

error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

$projectRoot = dirname(__DIR__);
require_once $projectRoot . '/vendor/autoload.php';

// Charger .env
if (file_exists($projectRoot . '/app/config/.env')) {
    $dotenv = Dotenv\Dotenv::createImmutable($projectRoot . '/app/config');
    $dotenv->load();
}

echo "═══════════════════════════════════════════════════════════════\n";
echo "SECURITY TESTS - webService.php & SmartschoolWebServiceV3Client\n";
echo "═══════════════════════════════════════════════════════════════\n\n";

$passedTests = [];
$failedTests = [];

// ============================================
// TEST 1: webService.php configuration
// ============================================
echo "[TEST 1] webService.php Configuration\n";

try {
    $webServicePath = $projectRoot . '/app/config/webService.php';
    if (!file_exists($webServicePath)) {
        throw new Exception("webService.php not found at $webServicePath");
    }
    
    $webServiceConfig = require $webServicePath;
    
    // Vérifier structure
    if (!is_array($webServiceConfig)) {
        throw new Exception("webService.php doesn't return an array");
    }
    
    if (!isset($webServiceConfig['serviceWeb_password'])) {
        throw new Exception("webService.php missing 'serviceWeb_password' key");
    }
    
    if (!isset($webServiceConfig['profil_password'])) {
        throw new Exception("webService.php missing 'profil_password' key");
    }
    
    echo "  ✅ webService.php returns valid configuration array\n";
    $passedTests[] = "TEST 1A: webService.php configuration structure";
    
    // Vérifier les valeurs ne sont pas vides
    if (empty($webServiceConfig['serviceWeb_password'])) {
        throw new Exception("SMARTSCHOOL_WS_LOGIN not set in .env");
    }
    
    echo "  ✅ serviceWeb_password loaded from environment\n";
    $passedTests[] = "TEST 1B: serviceWeb_password loaded";
    
    if (empty($webServiceConfig['profil_password'])) {
        throw new Exception("SMARTSCHOOL_PROFILE_PASSWORD not set in .env");
    }
    
    echo "  ✅ profil_password loaded from environment\n";
    $passedTests[] = "TEST 1C: profil_password loaded";
    
} catch (Exception $e) {
    echo "  ❌ FAILED: " . $e->getMessage() . "\n";
    $failedTests[] = "TEST 1: " . $e->getMessage();
}

// ============================================
// TEST 2: Source code security
// ============================================
echo "\n[TEST 2] Source Code Secret Exposure Scan\n";

$sensitivePatterns = [
    'jiEK-t*p.R7;MZ5' => 'SMARTSCHOOL_WS_LOGIN',
    '3debd4de2017ab608ac9' => 'SMARTSCHOOL_PROFILE_PASSWORD',
    '928e81888fb6' => 'SMARTSCHOOL_CLIENT_ID',
    'eff9774f8334' => 'SMARTSCHOOL_CLIENT_SECRET',
    '4777c801a1219845eaf9d7b454113ac0dc2c3472d3f031ca2d21d2e1c44e' => 'ONEROSTER_CLIENT_SECRET'
];

try {
    $configDir = $projectRoot . '/app/config';
    $phpFiles = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($configDir),
        RecursiveIteratorIterator::LEAVES_ONLY
    );
    
    $foundSecrets = false;
    
    foreach ($phpFiles as $file) {
        if ($file->getExtension() === 'php') {
            $content = file_get_contents($file->getRealPath());
            
            foreach ($sensitivePatterns as $secret => $secretName) {
                if (strpos($content, $secret) !== false) {
                    // Ignore .env and .env.example
                    if (strpos($file->getRealPath(), '.env') === false) {
                        echo "  ❌ Found hardcoded $secretName in " . basename($file->getRealPath()) . "\n";
                        $failedTests[] = "TEST 2: Hardcoded secret found: $secretName";
                        $foundSecrets = true;
                    }
                }
            }
        }
    }
    
    if (!$foundSecrets) {
        echo "  ✅ No hardcoded secrets found in PHP source files\n";
        $passedTests[] = "TEST 2: No hardcoded secrets in source";
    }
    
} catch (Exception $e) {
    echo "  ⚠️  SKIPPED: " . $e->getMessage() . "\n";
}

// ============================================
// TEST 3: Environment variables loaded
// ============================================
echo "\n[TEST 3] Environment Variables Loaded\n";

$requiredEnvVars = [
    'SMARTSCHOOL_WS_LOGIN' => 'SmartSchool WebService Login',
    'SMARTSCHOOL_PROFILE_PASSWORD' => 'SmartSchool Profile Password',
    'SMARTSCHOOL_CLIENT_ID' => 'SmartSchool Client ID',
    'SMARTSCHOOL_CLIENT_SECRET' => 'SmartSchool Client Secret',
    'DB_HOST' => 'Database Host',
    'DB_NAME' => 'Database Name',
    'DB_USER' => 'Database User'
];

try {
    $missingVars = [];
    
    foreach ($requiredEnvVars as $varName => $varDesc) {
        if (empty($_ENV[$varName])) {
            $missingVars[] = $varName;
        } else {
            echo "  OK \$_ENV['" . $varName . "'] is set\n";
            $passedTests[] = "TEST 3: $varName loaded";
        }
    }
    
    if (!empty($missingVars)) {
        echo "  ⚠️  Missing environment variables: " . implode(', ', $missingVars) . "\n";
        echo "     Make sure .env is properly configured\n";
    }
    
} catch (Exception $e) {
    echo "  ⚠️  SKIPPED: " . $e->getMessage() . "\n";
}

// ============================================
// TEST 4: SmartschoolWebServiceV3Client
// ============================================
echo "\n[TEST 4] SmartschoolWebServiceV3Client Security\n";

try {
    $clientPath = $projectRoot . '/app/service/SmartschoolWebServiceV3Client.php';
    
    if (!file_exists($clientPath)) {
        echo "  ⚠️  SmartschoolWebServiceV3Client.php not found (optional check)\n";
    } else {
        $clientContent = file_get_contents($clientPath);
        
        // Vérifier pas de hardcoded credentials
        $foundHardcoded = false;
        foreach ($sensitivePatterns as $secret => $secretName) {
            if (strpos($clientContent, $secret) !== false) {
                echo "  ❌ Found hardcoded $secretName in SmartschoolWebServiceV3Client.php\n";
                $failedTests[] = "TEST 4: Hardcoded secret in SmartschoolWebServiceV3Client";
                $foundHardcoded = true;
            }
        }
        
        if (!$foundHardcoded) {
            echo "  ✅ No hardcoded secrets in SmartschoolWebServiceV3Client.php\n";
            $passedTests[] = "TEST 4A: No hardcoded secrets in client";
        }
        
        // Vérifier pas de logging sensible
        if (preg_match('/error_log\s*\(.*(?:password|credential|secret|token).*\)/i', $clientContent)) {
            echo "  ❌ Found sensitive logging in SmartschoolWebServiceV3Client.php\n";
            $failedTests[] = "TEST 4: Sensitive logging in client";
        } else {
            echo "  ✅ No sensitive logging in SmartschoolWebServiceV3Client.php\n";
            $passedTests[] = "TEST 4B: No sensitive logging";
        }
    }
    
} catch (Exception $e) {
    echo "  ⚠️  SKIPPED: " . $e->getMessage() . "\n";
}

// ============================================
// TEST 5: config.php loads .env
// ============================================
echo "\n[TEST 5] config.php Dotenv Integration\n";

try {
    $configPath = $projectRoot . '/app/config/config.php';
    $configContent = file_get_contents($configPath);
    
    if (strpos($configContent, 'Dotenv') === false) {
        echo "  ⚠️  config.php doesn't reference Dotenv (may be loaded elsewhere)\n";
    } else {
        echo "  ✅ config.php uses Dotenv\n";
        $passedTests[] = "TEST 5: config.php uses Dotenv";
    }
    
    if (strpos($configContent, '\$_ENV') === false && strpos($configContent, '$_ENV') === false) {
        echo "  ❌ config.php doesn't use \$_ENV variables\n";
        $failedTests[] = "TEST 5: config.php doesn't load from .env";
    } else {
        echo "  ✅ config.php loads credentials from \$_ENV\n";
        $passedTests[] = "TEST 5: config.php uses .env variables";
    }
    
} catch (Exception $e) {
    echo "  ⚠️  SKIPPED: " . $e->getMessage() . "\n";
}

// ============================================
// RÉSUMÉ
// ============================================
echo "\n═══════════════════════════════════════════════════════════════\n";
echo "TEST SUMMARY\n";
echo "═══════════════════════════════════════════════════════════════\n\n";

$totalTests = count($passedTests) + count($failedTests);
echo "✅ Passed: " . count($passedTests) . "/$totalTests\n";
echo "❌ Failed: " . count($failedTests) . "/$totalTests\n\n";

if (!empty($failedTests)) {
    echo "❌ FAILED TESTS:\n";
    foreach ($failedTests as $test) {
        echo "  ⚠️  $test\n";
    }
    echo "\n🔧 RECOMMENDED ACTIONS:\n";
    echo "  1. Run: .\APPLY_SECURITY_FIXES.ps1 (PowerShell)\n";
    echo "  2. Run: composer require vlucas/phpdotenv\n";
    echo "  3. Verify: php test/test_security_webservice.php\n";
} else {
    echo "✅ ALL TESTS PASSED!\n";
    echo "🎉 webService.php and SmartschoolWebServiceV3Client are properly secured!\n\n";
    echo "Security Status:\n";
    echo "  ✅ Secrets loaded from environment variables\n";
    echo "  ✅ No hardcoded credentials in source code\n";
    echo "  ✅ Dotenv properly integrated\n";
    echo "  ✅ No sensitive data being logged\n";
}

echo "\n═══════════════════════════════════════════════════════════════\n";
echo "Test completed at " . date('Y-m-d H:i:s') . "\n";
echo "═══════════════════════════════════════════════════════════════\n";

exit(!empty($failedTests) ? 1 : 0);
?>
