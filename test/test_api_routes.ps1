# Script PowerShell de test des routes API modernes

$baseUrl = "http://localhost:8000/api"

function Test-ApiRoute {
    param(
        [string]$Method,
        [string]$Endpoint,
        [object]$Body = $null
    )
    $url = "$baseUrl/$Endpoint"
    try {
        if ($Method -eq 'GET') {
            $response = Invoke-RestMethod -Uri $url -Method GET -ContentType 'application/json'
        } elseif ($Method -eq 'POST') {
            $jsonBody = $Body | ConvertTo-Json -Compress
            $response = Invoke-RestMethod -Uri $url -Method POST -Body $jsonBody -ContentType 'application/json'
        }
        Write-Host "[OK] $Method $Endpoint" -ForegroundColor Green
    } catch {
        Write-Host "[FAIL] $Method $Endpoint : $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Authentification
test-apiroute POST "login" @{username="test";password="test"}
test-apiroute POST "logout"

# Étudiants
test-apiroute GET "students"
test-apiroute POST "students/search" @{query=""}
test-apiroute POST "students/add" @{nom="Test";prenom="User";classe="A"}
test-apiroute POST "students/delete" @{id=1}

# Mouvements
test-apiroute GET "movements"
test-apiroute POST "movements/search" @{query=""}
test-apiroute POST "movements/add" @{student_id=1;date="2026-03-30"}
test-apiroute POST "movements/update" @{id=1;date="2026-03-30"}

# Utilisateurs
test-apiroute GET "users"
test-apiroute POST "users/add" @{username="testuser";password="test"}
test-apiroute POST "users/update" @{id=1;username="testuser2"}
test-apiroute POST "users/delete" @{id=1}

# Statistiques
test-apiroute GET "stats"
test-apiroute GET "stats/dates?date_from=2026-03-01&date_to=2026-03-30"

# Absents
test-apiroute GET "absents/today"
test-apiroute POST "absents/add" @{student_id=1}

# Export CSV
test-apiroute GET "export/csv?date_from=2026-03-01&date_to=2026-03-30"
