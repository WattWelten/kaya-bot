# KAYA Production-Test - Phase 1-4 Performance-Optimierungen
Write-Host "KAYA Production Performance-Test"
Write-Host ""

$backendUrl = "http://localhost:3001"
$times = @()

# Test 1: Erste Request (Cache-Miss erwartet)
Write-Host "Test 1: Erste Request (sollte gecacht werden)..."
$start = Get-Date
$response1 = Invoke-WebRequest -Uri "$backendUrl/chat" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"message":"Ich möchte mein KFZ zulassen"}' -UseBasicParsing
$end = Get-Date
$duration = ($end - $start).TotalMilliseconds
$times += $duration
Write-Host "Response-Zeit: $duration ms" -ForegroundColor Yellow

Start-Sleep -Seconds 1

# Test 2: IDENTISCHE Request (Cache-Hit erwartet!)
Write-Host ""
Write-Host "Test 2: IDENTISCHE Request (Cache-Hit erwartet)..."
$start = Get-Date
$response2 = Invoke-WebRequest -Uri "$backendUrl/chat" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"message":"Ich möchte mein KFZ zulassen"}' -UseBasicParsing
$end = Get-Date
$duration = ($end - $start).TotalMilliseconds
$times += $duration

if ($duration -lt 100) {
    Write-Host "[SUCCESS] Cache-Hit erkannt! ($duration ms)" -ForegroundColor Green
} else {
    Write-Host "[WARNING] Cache-Hit nicht erkannt ($duration ms)" -ForegroundColor Yellow
}

# Test 3: Weitere Request (Cache-Hit erwartet)
Write-Host ""
Write-Host "Test 3: Weitere Request..."
$start = Get-Date
$response3 = Invoke-WebRequest -Uri "$backendUrl/chat" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"message":"Ich möchte mein KFZ zulassen"}' -UseBasicParsing
$end = Get-Date
$duration = ($end - $start).TotalMilliseconds
$times += $duration
Write-Host "Response-Zeit: $duration ms"

# Durchschnitt berechnen
$average = ($times | Measure-Object -Average).Average
$min = ($times | Measure-Object -Minimum).Minimum
$max = ($times | Measure-Object -Maximum).Maximum

Write-Host ""
Write-Host "Statistiken:" -ForegroundColor Cyan
Write-Host "  - Durchschnitt: $([math]::Round($average, 2)) ms"
Write-Host "  - Minimum: $([math]::Round($min, 2)) ms"
Write-Host "  - Maximum: $([math]::Round($max, 2)) ms"
Write-Host "  - Cache-Hit-Rate: $([math]::Round((@($times | Where-Object {$_ -lt 100}).Count / $times.Count * 100), 1))%"

Write-Host ""
Write-Host "[SUCCESS] Cache-Tests abgeschlossen!" -ForegroundColor Green


