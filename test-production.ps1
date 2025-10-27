# Phase 3: Production-Tests (Railway)
$BackendUrl = "https://api.kaya.wattweiser.com"
$FrontendUrl = "https://app.kaya.wattweiser.com"

Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "   Phase 3: Production-Tests (Railway)" -ForegroundColor Yellow
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host ""

# Helper
function Test-Endpoint {
    param([string]$Url, [string]$Method = "GET")
    try {
        $response = Invoke-RestMethod -Uri $Url -Method $Method -TimeoutSec 10
        return @{ success = $true; response = $response }
    } catch {
        return @{ success = $false; error = $_.Exception.Message }
    }
}

function Send-Chat {
    param([string]$Message)
    try {
        $body = @{ message = $Message } | ConvertTo-Json
        $response = Invoke-RestMethod -Uri "$BackendUrl/chat" -Method POST -ContentType "application/json" -Body $body -TimeoutSec 30
        return @{ success = $true; response = $response }
    } catch {
        return @{ success = $false; error = $_.Exception.Message }
    }
}

$results = @{}

# 3.1 Production-Deployment pruefen
Write-Host "3.1 Production-Deployment pruefen" -ForegroundColor Yellow
Write-Host "────────────────────────────────────────────────────" -ForegroundColor Gray

# Backend Health
Write-Host "  Backend Health:" -ForegroundColor Cyan
$healthBackend = Test-Endpoint -Url "$BackendUrl/health"
if ($healthBackend.success) {
    Write-Host "    [OK] Backend erreichbar" -ForegroundColor Green
    $results["BackendHealth"] = "PASSED"
} else {
    Write-Host "    [FAIL] Backend nicht erreichbar: $($healthBackend.error)" -ForegroundColor Red
    $results["BackendHealth"] = "FAILED"
}

# Frontend erreichbar
Write-Host "  Frontend erreichbar:" -ForegroundColor Cyan
$healthFrontend = Test-Endpoint -Url "$FrontendUrl"
if ($healthFrontend.success) {
    Write-Host "    [OK] Frontend erreichbar" -ForegroundColor Green
    $results["FrontendReachable"] = "PASSED"
} else {
    Write-Host "    [FAIL] Frontend nicht erreichbar: $($healthFrontend.error)" -ForegroundColor Red
    $results["FrontendReachable"] = "FAILED"
}

# 3.2 Production Chat-Tests
Write-Host "`n3.2 Production Chat-Tests (5 Fragen)" -ForegroundColor Yellow
Write-Host "────────────────────────────────────────────────────" -ForegroundColor Gray

$chatQuestions = @(
    "Ich moechte mein Auto zulassen.",
    "Ich moechte meinen Wohnsitz anmelden.",
    "Ich moechte mein Kind fuer die Kita anmelden.",
    "Ich moechte ein Gewerbe anmelden.",
    "Wann ist die naechste Kreistagssitzung?"
)

$chatPassed = 0
$chatTotal = $chatQuestions.Count

foreach ($q in $chatQuestions) {
    Write-Host "  Q: $q" -ForegroundColor White
    $startTime = Get-Date
    $r = Send-Chat -Message $q
    $duration = ((Get-Date) - $startTime).TotalSeconds
    
    if ($r.success) {
        $durationRounded = [math]::Round($duration, 2)
        Write-Host "    [OK] Antwort erhalten ($durationRounded s)" -ForegroundColor Green
        $chatPassed++
    } else {
        Write-Host "    [FAIL] Fehler: $($r.error)" -ForegroundColor Red
    }
    Start-Sleep -Milliseconds 500
}

$results["ChatTests"] = "$chatPassed/$chatTotal"

# 3.3 Response-Zeit
Write-Host "`n3.3 Response-Zeit messen" -ForegroundColor Yellow
Write-Host "────────────────────────────────────────────────────" -ForegroundColor Gray

$responseTimes = @()
for ($i = 1; $i -le 5; $i++) {
    $startTime = Get-Date
    $r = Send-Chat -Message "Test $i"
    $duration = ((Get-Date) - $startTime).TotalSeconds
    $responseTimes += $duration
    Write-Host "  Test $i : $([math]::Round($duration, 2))s" -ForegroundColor Gray
}

$avgTime = [math]::Round(($responseTimes | Measure-Object -Average).Average, 2)
$maxTime = [math]::Round(($responseTimes | Measure-Object -Maximum).Maximum, 2)

Write-Host "  Durchschnitt: $avgTime s" -ForegroundColor $(if ($avgTime -lt 3) { "Green" } else { "Yellow" })
Write-Host "  Maximum: $maxTime s" -ForegroundColor $(if ($maxTime -lt 5) { "Green" } else { "Yellow" })

$results["ResponseTime"] = "Durchschn: ${avgTime}s, Max: ${maxTime}s"

# 3.4 CORS Test (simuliert)
Write-Host "`n3.4 CORS Test" -ForegroundColor Yellow
Write-Host "────────────────────────────────────────────────────" -ForegroundColor Gray
Write-Host "  Info: CORS muss manuell im Browser getestet werden" -ForegroundColor Gray
$results["CORSTest"] = "MANUAL"

# Summary
Write-Host "`n========================================================================" -ForegroundColor Cyan
Write-Host "   SUMMARY - Production Tests" -ForegroundColor Yellow
Write-Host "========================================================================" -ForegroundColor Cyan

foreach ($test in $results.Keys | Sort-Object) {
    Write-Host "  $test : $($results[$test])" -ForegroundColor $(if ($results[$test] -like "*FAILED*") { "Red" } else { "Green" })
}

$results | ConvertTo-Json -Depth 5 | Out-File -FilePath "phase3-production-results.json" -Encoding UTF8

Write-Host "`n  Ergebnisse gespeichert: phase3-production-results.json" -ForegroundColor Gray
Write-Host "  Frontend URL: $FrontendUrl" -ForegroundColor Cyan
Write-Host "  Backend URL: $BackendUrl" -ForegroundColor Cyan
Write-Host "========================================================================" -ForegroundColor Cyan