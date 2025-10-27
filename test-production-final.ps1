# Final Production Test mit mehreren Versuchen

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "KAYA Production - Final Test" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Warte 3 Sekunden auf CDN-Propagation..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

$productionUrl = "https://app.kaya.wattweiser.com"
$maxAttempts = 3
$attempt = 0

while ($attempt -lt $maxAttempts) {
    $attempt++
    Write-Host "`nVersuch $attempt von $maxAttempts..." -ForegroundColor Cyan
    
    try {
        $response = Invoke-WebRequest -Uri $productionUrl -Method Get -UseBasicParsing -TimeoutSec 10
        
        Write-Host "  HTTP Status: $($response.StatusCode)" -ForegroundColor Green
        
        $content = $response.Content
        
        # Pruefe Hash
        if ($content -match 'index-([0-9a-f]{8})\.js') {
            $currentHash = $matches[1]
            Write-Host "  Hash gefunden: $currentHash" -ForegroundColor Cyan
            
            if ($currentHash -eq '6a455d98') {
                Write-Host "`n  ✅ NEUER BUILD AKTIV!" -ForegroundColor Green
                Write-Host "  ✅ Hash: $currentHash korrekt" -ForegroundColor Green
            } elseif ($currentHash -eq 'f609b524') {
                Write-Host "`n  ❌ ALTER BUILD NOCH AKTIV!" -ForegroundColor Red
                Write-Host "  Warte 10 Sekunden und wiederhole..." -ForegroundColor Yellow
                if ($attempt -lt $maxAttempts) {
                    Start-Sleep -Seconds 10
                    continue
                }
            } else {
                Write-Host "  ⚠️  Unbekannter Hash: $currentHash" -ForegroundColor Yellow
            }
        } else {
            Write-Host "  ⚠️  Kein Hash gefunden" -ForegroundColor Yellow
        }
        
        # Pruefe Unity-Code
        if ($content -match 'unity|createUnityInstance') {
            Write-Host "  ⚠️  Unity-Code noch vorhanden" -ForegroundColor Yellow
        } else {
            Write-Host "  ✅ Unity-Code entfernt" -ForegroundColor Green
        }
        
        # Pruefe Three.js
        if ($content -match 'three|react-three') {
            Write-Host "  ✅ Three.js Code vorhanden" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Three.js Code nicht gefunden" -ForegroundColor Red
        }
        
        break
        
    } catch {
        Write-Host "  ❌ FEHLER: $($_.Exception.Message)" -ForegroundColor Red
        if ($attempt -lt $maxAttempts) {
            Write-Host "  Warte 5 Sekunden und wiederhole..." -ForegroundColor Yellow
            Start-Sleep -Seconds 5
        }
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Test abgeschlossen" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

