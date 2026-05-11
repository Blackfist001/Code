# P0 security bootstrap script (safe and idempotent)
$projectRoot = "C:\ProgsCodes\#ECI\Stage\test\Code"
$configDir = Join-Path $projectRoot "app\config"

Write-Host "Applying P0 security bootstrap..." -ForegroundColor Cyan

if (-not (Test-Path $configDir)) {
    throw "Config directory not found: $configDir"
}

$envExample = @"
DB_HOST=localhost
DB_NAME=sortie_ecole
DB_USER=root
DB_PASS=

SMARTSCHOOL_CLIENT_ID=
SMARTSCHOOL_CLIENT_SECRET=

ONEROSTER_CLIENT_ID=
ONEROSTER_CLIENT_SECRET=

SMARTSCHOOL_WS_LOGIN=
SMARTSCHOOL_PROFILE_PASSWORD=
"@

$envLocal = @"
DB_HOST=localhost
DB_NAME=sortie_ecole
DB_USER=root
DB_PASS=

SMARTSCHOOL_CLIENT_ID=928e81888fb6
SMARTSCHOOL_CLIENT_SECRET=eff9774f8334

ONEROSTER_CLIENT_ID=2458a844-29dc-4b1c-90a7-7fe2e44bebce
ONEROSTER_CLIENT_SECRET=4777c801a1219845eaf9d7b454113ac0dc2c3472d3f031ca2d21d2e1c44e

SMARTSCHOOL_WS_LOGIN=jiEK-t*p.R7;MZ5
SMARTSCHOOL_PROFILE_PASSWORD=3debd4de2017ab608ac9
"@

Set-Content -Path (Join-Path $configDir ".env.example") -Value $envExample -Encoding UTF8
Write-Host "Updated app/config/.env.example" -ForegroundColor Green

$envPath = Join-Path $configDir ".env"
if (-not (Test-Path $envPath)) {
    Set-Content -Path $envPath -Value $envLocal -Encoding UTF8
    Write-Host "Created app/config/.env" -ForegroundColor Green
} else {
    Write-Host "app/config/.env already exists (left unchanged)" -ForegroundColor Yellow
}

$gitignorePath = Join-Path $projectRoot ".gitignore"
if (Test-Path $gitignorePath) {
    $gi = Get-Content $gitignorePath -Raw
    if ($gi -notmatch "(?m)^app/config/\.env$") {
        Add-Content -Path $gitignorePath -Value "`napp/config/.env`n"
        Write-Host "Added app/config/.env to .gitignore" -ForegroundColor Green
    }
}

Write-Host "P0 bootstrap complete." -ForegroundColor Cyan
Write-Host "Next: run composer require vlucas/phpdotenv, then run tests." -ForegroundColor Cyan
