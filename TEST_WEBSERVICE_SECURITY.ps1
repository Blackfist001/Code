$projectRoot = "C:\ProgsCodes\#ECI\Stage\test\Code"
$webServicePath = Join-Path $projectRoot "app\config\webService.php"
$clientPath = Join-Path $projectRoot "app\service\SmartschoolWebServiceV3Client.php"
$envPath = Join-Path $projectRoot "app\config\.env"

$failed = @()
$passed = @()

Write-Host "Running security checks for webService and Smartschool client..." -ForegroundColor Cyan

if (-not (Test-Path $webServicePath)) {
    $failed += "webService.php missing"
} else {
    $webContent = Get-Content $webServicePath -Raw

    if ($webContent -match "jiEK-t\*p\.R7;MZ5|3debd4de2017ab608ac9") {
        $failed += "Hardcoded secret found in webService.php"
    } else {
        $passed += "No hardcoded secret in webService.php"
    }

    if ($webContent.Contains("`$_ENV['SMARTSCHOOL_WS_LOGIN']")) {
        $passed += "SMARTSCHOOL_WS_LOGIN read from env"
    } else {
        $failed += "SMARTSCHOOL_WS_LOGIN is not read from env"
    }

    if ($webContent.Contains("`$_ENV['SMARTSCHOOL_PROFILE_PASSWORD']")) {
        $passed += "SMARTSCHOOL_PROFILE_PASSWORD read from env"
    } else {
        $failed += "SMARTSCHOOL_PROFILE_PASSWORD is not read from env"
    }
}

if (-not (Test-Path $clientPath)) {
    $failed += "SmartschoolWebServiceV3Client.php missing"
} else {
    $clientContent = Get-Content $clientPath -Raw

    if ($clientContent -match "jiEK-t\*p\.R7;MZ5|3debd4de2017ab608ac9") {
        $failed += "Hardcoded secret found in SmartschoolWebServiceV3Client.php"
    } else {
        $passed += "No hardcoded secret in SmartschoolWebServiceV3Client.php"
    }

    if ($clientContent -match "error_log\s*\(.*(password|secret|token|credential)") {
        $failed += "Sensitive logging pattern found in SmartschoolWebServiceV3Client.php"
    } else {
        $passed += "No sensitive logging pattern in SmartschoolWebServiceV3Client.php"
    }
}

if (Test-Path $envPath) {
    $passed += ".env file exists"
} else {
    $failed += ".env file missing"
}

Write-Host ""
Write-Host "Passed: $($passed.Count)" -ForegroundColor Green
Write-Host "Failed: $($failed.Count)" -ForegroundColor $(if ($failed.Count -eq 0) { "Green" } else { "Red" })

if ($passed.Count -gt 0) {
    Write-Host ""
    Write-Host "Pass details:" -ForegroundColor Green
    foreach ($item in $passed) {
        Write-Host " - $item" -ForegroundColor Green
    }
}

if ($failed.Count -gt 0) {
    Write-Host ""
    Write-Host "Fail details:" -ForegroundColor Red
    foreach ($item in $failed) {
        Write-Host " - $item" -ForegroundColor Red
    }
    exit 1
}

Write-Host ""
Write-Host "All webService security checks passed." -ForegroundColor Cyan
exit 0
