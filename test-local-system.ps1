# KAYA Lokales Test-System
# Startet Backend + Frontend in separaten PowerShell-Fenstern

Write-Host "`n===========================================" -ForegroundColor Cyan
Write-Host "KAYA Lokales Test-System" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Pruefe ob Backend laeuft
Write-Host "Pruefe Backend-Status..." -ForegroundColor Yellow
$backendRunning = Test-NetConnection -ComputerName localhost -Port 3001 -InformationLevel Quiet -WarningAction SilentlyContinue

if ($backendRunning) {
    Write-Host "⚠️  Backend laeuft bereits auf Port 3001" -ForegroundColor Yellow
    Write-Host "   Ueberspringe Backend-Start" -ForegroundColor Gray
} else {
    Write-Host "🚀 Starte Backend (Port 3001)..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd D:\Landkreis\server; Write-Host 'Backend wird gestartet...' -ForegroundColor Cyan; npm start"
}

Start-Sleep -Seconds 6

# Pruefe ob Frontend laeuft
Write-Host "`nPruefe Frontend-Status..." -ForegroundColor Yellow
$frontendRunning = Test-NetConnection -ComputerName localhost -Port 5173 -InformationLevel Quiet -WarningAction SilentlyContinue

if ($frontendRunning) {
    Write-Host "⚠️  Frontend laeuft bereits auf Port 5173" -ForegroundColor Yellow
    Write-Host "   Ueberspringe Frontend-Start" -ForegroundColor Gray
} else {
    Write-Host "🚀 Starte Frontend (Port 5173)..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd D:\Landkreis\frontend; Write-Host 'Frontend wird gestartet...' -ForegroundColor Cyan; npm run dev"
}

Start-Sleep -Seconds 5

Write-Host "`n===========================================" -ForegroundColor Cyan
Write-Host "✅ System-Start abgeschlossen!" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 URLs:" -ForegroundColor Yellow
Write-Host "   Backend:  http://localhost:3001" -ForegroundColor White
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "📋 Test-Checkliste:" -ForegroundColor Cyan
Write-Host "   1. Chat-Nachrichten senden" -ForegroundColor White
Write-Host "   2. Audio-Aufnahme (Mikrofon)" -ForegroundColor White
Write-Host "   3. WebSocket-Verbindung" -ForegroundColor White
Write-Host "   4. Avatar-Animation (Three.js)" -ForegroundColor White
Write-Host "   5. Performance (React DevTools)" -ForegroundColor White
Write-Host ""
Write-Host "🛑 Beenden:" -ForegroundColor Yellow
Write-Host "   Schliesse beide geoeffneten PowerShell-Fenster" -ForegroundColor Gray
Write-Host ""
Write-Host "📊 Monitoring:" -ForegroundColor Cyan
Write-Host "   Backend-Logs:  http://localhost:3001/health" -ForegroundColor Gray
Write-Host "   DevTools:      F12 im Browser" -ForegroundColor Gray
Write-Host ""

