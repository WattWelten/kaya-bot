# Production URL Test Script
# Testet app.kaya.wattweiser.com auf korrekten Deploy

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "KAYA Production Test" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$productionUrl = "https://app.kaya.wattweiser.com"

# Test 1: Erreichbarkeit
Write-Host "Test 1: Erreichbarkeit..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $productionUrl -Method Get -UseBasicParsing -TimeoutSec 10
    Write-Host "  HTTP Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "  Content-Length: $($response.RawContentLength) bytes" -ForegroundColor Green
    
    # Test 2: Alter Unity-Hash vorhanden?
    $content = $response.Content
    if ($content -match 'index-f609b524\.js') {
        Write-Host "`n  ALTER HASH GEFUNDEN!" -ForegroundColor Red
        Write-Host "  Railway hat NICHT neu gebaut!" -ForegroundColor Red
        Write-Host "  Loesung: NO_CACHE=1 Variable setzen" -ForegroundColor Yellow
    } else {
        Write-Host "`n  Alter Hash NICHT gefunden (gut!)" -ForegroundColor Green
    }
    
    # Test 3: Unity-Referenzen vorhanden?
    if ($content -match 'unity|createUnityInstance') {
        Write-Host "  Unity-Code NOCH VORHANDEN!" -ForegroundColor Red
    } else {
        Write-Host "  Unity-Code entfernt (gut!)" -ForegroundColor Green
    }
    
    # Test 4: Three.js vorhanden?
    if ($content -match 'three|react-three') {
        Write-Host "  Three.js Code gefunden (gut!)" -ForegroundColor Green
    } else {
        Write-Host "  Three.js Code NICHT gefunden!" -ForegroundColor Red
    }
    
    # Test 5: Build-ID prüfen
    if ($content -match 'build-id.*content="([^"]+)"') {
        $buildId = $matches[1]
        Write-Host "  Build-ID: $buildId" -ForegroundColor Cyan
    }
    
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "Test abgeschlossen" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
    
} catch {
    Write-Host "  FEHLER: $($_.Exception.Message)" -ForegroundColor Red
}

