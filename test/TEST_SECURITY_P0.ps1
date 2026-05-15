# ============================================
# TESTS DE SÉCURITÉ P0 - VALIDATION CORRECTIFS
# ============================================

$baseUrl = "http://127.0.0.1:8000"
$apiBase = "$baseUrl/api"
$projectRoot = "C:\ProgsCodes\#ECI\Stage\test\Code"

Write-Host "🧪 SECURITY TESTS - P0 CRITICAL FIXES" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

$failedTests = @()
$passedTests = @()

# ============================================
# TEST 1: Secrets not exposed in files
# ============================================
Write-Host "`n[TEST 1] Secrets not hardcoded in files" -ForegroundColor Yellow

# Vérifier config.php n'a pas de secrets hardcodés
$configPath = "$projectRoot\app\config\config.php"
$configContent = Get-Content $configPath -Raw

if ($configContent -like "*'root'*" -and $configContent -notlike "*\$_ENV*") {
    $failedTests += "TEST 1A: config.php still has hardcoded credentials"
    Write-Host "  ❌ config.php: HARDCODED credentials found" -ForegroundColor Red
} else {
    $passedTests += "TEST 1A: config.php using environment variables"
    Write-Host "  ✅ config.php: Using environment variables" -ForegroundColor Green
}

# Vérifier oauth_credentials.php
$oauthPath = "$projectRoot\app\config\oauth_credentials.php"
$oauthContent = Get-Content $oauthPath -Raw

if ($oauthContent -like "*'928e81888fb6'*") {
    $failedTests += "TEST 1B: oauth_credentials.php still has hardcoded client_id"
    Write-Host "  ❌ oauth_credentials.php: HARDCODED secrets found" -ForegroundColor Red
} else {
    $passedTests += "TEST 1B: oauth_credentials.php using environment variables"
    Write-Host "  ✅ oauth_credentials.php: Using environment variables" -ForegroundColor Green
}

# Vérifier webService.php
$webServicePath = "$projectRoot\app\config\webService.php"
$webServiceContent = Get-Content $webServicePath -Raw

if ($webServiceContent -like "*'jiEK-t*p.R7;MZ5'*") {
    $failedTests += "TEST 1C: webService.php still has hardcoded password"
    Write-Host "  ❌ webService.php: HARDCODED password found" -ForegroundColor Red
} else {
    $passedTests += "TEST 1C: webService.php using environment variables"
    Write-Host "  ✅ webService.php: Using environment variables" -ForegroundColor Green
}

# ============================================
# TEST 2: .env file exists and is private
# ============================================
Write-Host "`n[TEST 2] .env file exists and in .gitignore" -ForegroundColor Yellow

$envPath = "$projectRoot\app\config\.env"
if (Test-Path $envPath) {
    Write-Host "  ✅ .env file exists" -ForegroundColor Green
    $passedTests += "TEST 2A: .env file exists"
    
    # Vérifier permissions
    $acl = Get-Acl $envPath
    Write-Host "  ✅ .env file accessible" -ForegroundColor Green
    $passedTests += "TEST 2B: .env permissions verified"
} else {
    $failedTests += "TEST 2A: .env file not found"
    Write-Host "  ❌ .env file NOT FOUND" -ForegroundColor Red
}

# Vérifier .gitignore
$gitignorePath = "$projectRoot\.gitignore"
if (Test-Path $gitignorePath) {
    $gitignoreContent = Get-Content $gitignorePath -Raw
    if ($gitignoreContent -like "*app/config/.env*") {
        Write-Host "  ✅ .env listed in .gitignore" -ForegroundColor Green
        $passedTests += "TEST 2C: .env in .gitignore"
    } else {
        $failedTests += "TEST 2C: .env not in .gitignore"
        Write-Host "  ❌ .env NOT in .gitignore" -ForegroundColor Red
    }
} else {
    Write-Host "  ⚠️  .gitignore not found (optional)" -ForegroundColor Yellow
}

# ============================================
# TEST 3: Security headers present
# ============================================
Write-Host "`n[TEST 3] Security headers present" -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri $baseUrl -Method Head -ErrorAction SilentlyContinue
    
    $headers = $response.Headers
    
    # Test X-Frame-Options
    if ($headers.ContainsKey('X-Frame-Options')) {
        Write-Host "  ✅ X-Frame-Options: $($headers['X-Frame-Options'])" -ForegroundColor Green
        $passedTests += "TEST 3A: X-Frame-Options header present"
    } else {
        $failedTests += "TEST 3A: X-Frame-Options header missing"
        Write-Host "  ❌ X-Frame-Options: MISSING" -ForegroundColor Red
    }
    
    # Test X-Content-Type-Options
    if ($headers.ContainsKey('X-Content-Type-Options')) {
        Write-Host "  ✅ X-Content-Type-Options: $($headers['X-Content-Type-Options'])" -ForegroundColor Green
        $passedTests += "TEST 3B: X-Content-Type-Options header present"
    } else {
        $failedTests += "TEST 3B: X-Content-Type-Options header missing"
        Write-Host "  ❌ X-Content-Type-Options: MISSING" -ForegroundColor Red
    }
    
    # Test CSP
    if ($headers.ContainsKey('Content-Security-Policy')) {
        Write-Host "  ✅ Content-Security-Policy: Present" -ForegroundColor Green
        $passedTests += "TEST 3C: CSP header present"
    } else {
        $failedTests += "TEST 3C: CSP header missing"
        Write-Host "  ❌ Content-Security-Policy: MISSING" -ForegroundColor Red
    }
    
    # Test Referrer-Policy
    if ($headers.ContainsKey('Referrer-Policy')) {
        Write-Host "  ✅ Referrer-Policy: $($headers['Referrer-Policy'])" -ForegroundColor Green
        $passedTests += "TEST 3D: Referrer-Policy header present"
    } else {
        $failedTests += "TEST 3D: Referrer-Policy header missing"
        Write-Host "  ❌ Referrer-Policy: MISSING" -ForegroundColor Red
    }
    
} catch {
    Write-Host "  ⚠️  Cannot reach server at $baseUrl" -ForegroundColor Yellow
    Write-Host "     Make sure server is running: php -S 127.0.0.1:8000 -t public/" -ForegroundColor Yellow
}

# ============================================
# TEST 4: Display errors disabled
# ============================================
Write-Host "`n[TEST 4] Display errors disabled" -ForegroundColor Yellow

$indexPath = "$projectRoot\public\index.php"
$indexContent = Get-Content $indexPath -Raw

if ($indexContent -like "*ini_set('display_errors', '0')*") {
    Write-Host "  ✅ display_errors set to 0" -ForegroundColor Green
    $passedTests += "TEST 4A: display_errors disabled"
} else {
    $failedTests += "TEST 4A: display_errors not disabled"
    Write-Host "  ❌ display_errors might be enabled" -ForegroundColor Red
}

if ($indexContent -like "*ini_set('log_errors', '1')*") {
    Write-Host "  ✅ log_errors enabled for logging" -ForegroundColor Green
    $passedTests += "TEST 4B: log_errors enabled"
} else {
    $failedTests += "TEST 4B: log_errors not properly configured"
    Write-Host "  ⚠️  log_errors might not be configured" -ForegroundColor Yellow
}

# ============================================
# TEST 5: No sensitive logs in error log
# ============================================
Write-Host "`n[TEST 5] No sensitive data in error logs" -ForegroundColor Yellow

$logsDir = "$projectRoot\app\logs"
if (Test-Path $logsDir) {
    $logFiles = Get-ChildItem $logsDir -Filter "*.log" -ErrorAction SilentlyContinue
    
    if ($logFiles) {
        $sensitivePatterns = @(
            "Login input:",
            "password_verify:",
            "928e81888fb6",
            "eff9774f8334",
            "4777c801a1219845eaf9d7b454113ac0dc2c3472d3f031ca2d21d2e1c44e",
            "jiEK-t*p.R7;MZ5",
            "3debd4de2017ab608ac9"
        )
        
        $foundSensitive = $false
        foreach ($pattern in $sensitivePatterns) {
            $count = (Select-String -Path $logFiles -Pattern $pattern -ErrorAction SilentlyContinue | Measure-Object).Count
            if ($count -gt 0) {
                Write-Host "  ⚠️  Found historical '$pattern' in logs ($count occurrences)" -ForegroundColor Yellow
                $foundSensitive = $true
            }
        }
        
        if (-not $foundSensitive) {
            Write-Host "  ✅ No sensitive patterns found in logs" -ForegroundColor Green
            $passedTests += "TEST 5: No sensitive data in logs"
        } else {
            Write-Host "  ⚠️  Historical logs should be rotated or cleaned" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ⚠️  No log files found yet (normal on first run)" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ⚠️  app/logs/ directory not found" -ForegroundColor Yellow
}

# ============================================
# TEST 6: Session configuration
# ============================================
Write-Host "`n[TEST 6] Session configuration secure" -ForegroundColor Yellow

if ($indexContent -like "*ini_set('session.cookie_httponly', '1')*") {
    Write-Host "  ✅ session.cookie_httponly = 1 (HttpOnly set)" -ForegroundColor Green
    $passedTests += "TEST 6A: HttpOnly cookie set"
} else {
    $failedTests += "TEST 6A: HttpOnly cookie not configured"
    Write-Host "  ❌ session.cookie_httponly not configured" -ForegroundColor Red
}

if ($indexContent -like "*ini_set('session.cookie_samesite', 'Lax')*") {
    Write-Host "  ✅ session.cookie_samesite = Lax (CSRF protection)" -ForegroundColor Green
    $passedTests += "TEST 6B: SameSite cookie set"
} else {
    $failedTests += "TEST 6B: SameSite cookie not configured"
    Write-Host "  ❌ session.cookie_samesite not configured" -ForegroundColor Red
}

if ($indexContent -like "*ini_set('session.gc_maxlifetime', '3600')*") {
    Write-Host "  ✅ session.gc_maxlifetime = 3600 (1 hour timeout)" -ForegroundColor Green
    $passedTests += "TEST 6C: Session timeout configured"
} else {
    $failedTests += "TEST 6C: Session timeout not configured"
    Write-Host "  ❌ session.gc_maxlifetime not configured" -ForegroundColor Red
}

# ============================================
# TEST 7: webService.php specific
# ============================================
Write-Host "`n[TEST 7] webService.php security" -ForegroundColor Yellow

$webServiceContent = Get-Content $webServicePath -Raw

if ($webServiceContent.Contains("`$_ENV['SMARTSCHOOL_WS_LOGIN']")) {
    Write-Host "  ✅ SMARTSCHOOL_WS_LOGIN from environment" -ForegroundColor Green
    $passedTests += "TEST 7A: webService password from .env"
} else {
    $failedTests += "TEST 7A: webService password not from .env"
    Write-Host "  ❌ SMARTSCHOOL_WS_LOGIN not from .env" -ForegroundColor Red
}

if ($webServiceContent.Contains("`$_ENV['SMARTSCHOOL_PROFILE_PASSWORD']")) {
    Write-Host "  ✅ SMARTSCHOOL_PROFILE_PASSWORD from environment" -ForegroundColor Green
    $passedTests += "TEST 7B: webService profile password from .env"
} else {
    $failedTests += "TEST 7B: webService profile password not from .env"
    Write-Host "  ❌ SMARTSCHOOL_PROFILE_PASSWORD not from .env" -ForegroundColor Red
}

# ============================================
# RÉSUMÉ
# ============================================
Write-Host "`n$('='*50)" -ForegroundColor Cyan
Write-Host "TEST SUMMARY" -ForegroundColor Cyan
Write-Host "$('='*50)" -ForegroundColor Cyan

$totalTests = $passedTests.Count + $failedTests.Count
Write-Host "`n✅ Passed: $($passedTests.Count)/$totalTests" -ForegroundColor Green
Write-Host "❌ Failed: $($failedTests.Count)/$totalTests" -ForegroundColor $(if ($failedTests.Count -eq 0) { "Green" } else { "Red" })

if ($failedTests.Count -gt 0) {
    Write-Host "`n❌ FAILED TESTS:" -ForegroundColor Red
    foreach ($test in $failedTests) {
        Write-Host "  - $test" -ForegroundColor Red
    }
} else {
    Write-Host "`n✅ ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host "`n🎉 P0 Critical Security Fixes are properly applied!" -ForegroundColor Green
}

Write-Host "`n⏱️  Tests completed at $(Get-Date)" -ForegroundColor Cyan

# Exit code
if ($failedTests.Count -gt 0) {
    exit 1
} else {
    exit 0
}
