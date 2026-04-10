$base = "http://localhost:8000"
$staticRoutes = @(
    "/html/login.html",
    "/html/scan.html",
    "/html/dashboard.html",
    "/html/manualEncoding.html",
    "/html/historical.html",
    "/html/absence.html",
    "/html/search.html",
    "/html/management.html",
    "/html/layout.html",
    "/html/navAdmin.html",
    "/html/navGestion.html",
    "/html/navUser.html"
)

$resultats = foreach ($route in $staticRoutes) {
    $url = "$base$route"
    try {
        $r = Invoke-WebRequest -Uri $url -UseBasicParsing -Method GET -TimeoutSec 5 -ErrorAction Stop
        [pscustomobject]@{
            Route = $route
            URL = $url
            Status = $r.StatusCode
            Length = $r.RawContentLength
            OK = $true
        }
    } catch {
        [pscustomobject]@{
            Route = $route
            URL = $url
            Status = ($_.Exception.Response.StatusCode.Value__ 2>$null)
            Length = 0
            OK = $false
        }
    }
}

$resultats | Format-Table -AutoSize
$resultats | Export-Csv -Path ".\test-route-html-check.csv" -NoTypeInformation -Encoding UTF8
Write-Host "Rapport: test-route-html-check.csv"
