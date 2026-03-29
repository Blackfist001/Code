# test-routes.ps1
$base = "http://localhost:8000"
$routes = @(
    "/", "/login", "/logout", "/scan", "/dashboard",
    "/manualEncoding", "/historical", "/absent",
    "/search", "/gestion", "/api/students",
    "/api/students/1", "/api/movements", "/api/movements/student/1",
    "/api/users", "/api/absents/today", "/api/stats",
    "/api/stats/dates?date_from=2026-01-01&date_to=2026-01-31"
)

function Test-Route {
    param($route)
    $url = "$base$route"
    try {
        $r = Invoke-WebRequest -Uri $url -UseBasicParsing -Method GET -TimeoutSec 5 -ErrorAction Stop
        [pscustomobject]@{
            Route = $route; URL = $url; Up = $true; Status = $r.StatusCode; Info = 'OK'
        }
    } catch {
        [pscustomobject]@{
            Route = $route; URL = $url; Up = $false; Status = ($_.Exception.Response.StatusCode.Value__ 2>$null) ; Info = $_.Exception.Message
        }
    }
}

$resultats = [System.Collections.Generic.List[psobject]]::new()
foreach ($r in $routes) { $resultats.Add(Test-Route -route $r) }

# POST /login
$loginReq = @{
    uri = "$base/login"
    method = 'POST'
    contentType = 'application/json'
    body = (ConvertTo-Json @{ username = 'edu'; password = 'edu' })
    TimeoutSec = 5
}
try {
    $loginResp = Invoke-WebRequest @loginReq -UseBasicParsing -ErrorAction Stop
    $loginStatus = $loginResp.StatusCode
    $loginBody = $loginResp.Content
    $loginOk = $true
    $loginInfo = 'OK'
} catch {
    $loginStatus = ($_.Exception.Response.StatusCode.Value__ 2>$null)
    $loginBody = $_.Exception.Message
    $loginOk = $false
    $loginInfo = 'ERR'
}

$resultats.Add([pscustomobject]@{
    Route = 'POST /login'; URL = $loginReq.uri; Up = $loginOk; Status = $loginStatus; Info = $loginInfo; Body = $loginBody
})

$resultats | Format-Table -AutoSize
$resultats | Export-Csv -Path ".\test-route-check.csv" -NoTypeInformation -Encoding UTF8
Write-Host "Rapport dans test-route-check.csv"