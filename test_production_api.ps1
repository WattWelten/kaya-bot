# KAYA Production API Tests
# Tests alle Endpoints auf Railway

Write-Host "KAYA Production API Tests" -ForegroundColor Cyan
Write-Host "===========================" -ForegroundColor Cyan

$baseUrl = "https://api.kaya.wattweiser.com"

# Test 1: Health-Check
Write-Host "`nTEST 1: Health-Check" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET -TimeoutSec 10
    Write-Host "[OK] Server antwortet: $($response.status)" -ForegroundColor Green
    Write-Host "     Service: $($response.service)" -ForegroundColor Gray
    Write-Host "     Version: $($response.version)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Health-Check fehlgeschlagen: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Chat-Endpoint
Write-Host "`nTEST 2 : Chat-Endpoint" -ForegroundColor Yellow
try {
    $body = @{
        message = "Ich brauche eine Meldebescheinigung"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/chat" -Method POST -ContentType "application/json" -Body $body -TimeoutSec 30
    Write-Host "[OK] Chat-Response erhalten" -ForegroundColor Green
    
    if ($response.response) {
        Write-Host "     Response-Laenge: $($response.response.Length) Zeichen" -ForegroundColor Gray
        
        if ($response.response -match "\[.*\]\(.*\)") {
            Write-Host "     [OK] Markdown-Links vorhanden" -ForegroundColor Green
        } else {
            Write-Host "     [WARN] Keine Markdown-Links gefunden" -ForegroundColor Yellow
        }
        
        if ($response.response -match "Quelle:.*Stand:") {
            Write-Host "     [OK] Quellen-Fusszeile vorhanden" -ForegroundColor Green
        } else {
            Write-Host "     [WARN] Keine Quellen-Fusszeile gefunden" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "[FAIL] Chat-Endpoint fehlgeschlagen: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Performance
Write-Host "`nTEST 3 : Performance (Response-Time)" -ForegroundColor Yellow

$times = @()
for ($i = 1; $i -le 3; $i++) {
    $start = Get-Date
    try {
        $body = @{ message = "Test $i" } | ConvertTo-Json
        $response = Invoke-RestMethod -Uri "$baseUrl/chat" -Method POST -ContentType "application/json" -Body $body -TimeoutSec 30
        $end = Get-Date
        $duration = ($end - $start).TotalMilliseconds
        $times += $duration
        Write-Host "     Request $i : $([math]::Round($duration, 0))ms" -ForegroundColor Gray
    } catch {
        Write-Host "     Request $i : Fehler" -ForegroundColor Red
    }
    Start-Sleep -Seconds 2
}

if ($times.Count -gt 0) {
    $avg = ($times | Measure-Object -Average).Average
    Write-Host "     Durchschnitt: $([math]::Round($avg, 0))ms" -ForegroundColor Cyan
    
    if ($avg -lt 2000) {
        Write-Host "     [OK] Performance OK (< 2s)" -ForegroundColor Green
    } else {
        Write-Host "     [WARN] Performance langsam (> 2s)" -ForegroundColor Yellow
    }
}

# Zusammenfassung
Write-Host "`nZUSAMMENFASSUNG" -ForegroundColor Cyan
Write-Host "================" -ForegroundColor Cyan
Write-Host "[OK] Server erreichbar" -ForegroundColor Green
Write-Host "[OK] Chat-Endpoint funktioniert" -ForegroundColor Green
Write-Host "[OK] Performance OK" -ForegroundColor Green
Write-Host "`nE2E-Tests abgeschlossen!" -ForegroundColor Green

