# KAYA Cache-Test - Phase 1
# Testet In-Memory-Cache für häufige Fragen

Write-Host "🔍 KAYA Cache-Test - Phase 1`n"

$apiUrl = "http://localhost:3001"

# Test 1: Häufige Frage (sollte gecacht werden)
Write-Host "Test 1: Häufige Frage - KFZ Zulassung"
$response1 = Invoke-WebRequest -Uri "$apiUrl/chat" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"message":"Ich möchte mein KFZ zulassen"}' -UseBasicParsing
$responseTime1 = $response1.Headers.'X-Response-Time'
Write-Host "Response 1: $($responseTime1)ms"

Start-Sleep -Seconds 2

# Test 2: IDENTISCHE Frage (sollte Cache-Hit sein!)
Write-Host "`nTest 2: IDENTISCHE Frage - Erwartung: Cache-Hit (<50ms)"
$response2 = Invoke-WebRequest -Uri "$apiUrl/chat" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"message":"Ich möchte mein KFZ zulassen"}' -UseBasicParsing
$responseTime2 = $response2.Headers.'X-Response-Time'
Write-Host "Response 2: $($responseTime2)ms"

if ($responseTime2 -lt ($responseTime1 * 0.3)) {
    Write-Host "✅ SUCCESS: Cache-Hit erkannt! ($responseTime2ms < $($responseTime1 * 0.3)ms)" -ForegroundColor Green
} else {
    Write-Host "⚠️  Cache-Hit nicht deutlich genug schneller" -ForegroundColor Yellow
}

# Test 3: Ähnliche Frage (fuzzy-match)
Write-Host "`nTest 3: Ähnliche Frage - Auto zulassen"
$response3 = Invoke-WebRequest -Uri "$apiUrl/chat" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"message":"Ich will mein Auto zulassen"}' -UseBasicParsing
$responseTime3 = $response3.Headers.'X-Response-Time'
Write-Host "Response 3: $($responseTime3)ms"

# Test 4: Andere häufige Frage
Write-Host "`nTest 4: Weitere häufige Frage - Wohnsitz"
$response4 = Invoke-WebRequest -Uri "$apiUrl/chat" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"message":"Ich möchte meinen Wohnsitz anmelden"}' -UseBasicParsing
$responseTime4 = $response4.Headers.'X-Response-Time'
Write-Host "Response 4: $($responseTime4)ms"

Start-Sleep -Seconds 2

# Test 5: IDENTISCHE Frage (Cache-Hit erwartet)
Write-Host "`nTest 5: IDENTISCHE Frage - Wohnsitz (Cache-Hit erwartet)"
$response5 = Invoke-WebRequest -Uri "$apiUrl/chat" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"message":"Ich möchte meinen Wohnsitz anmelden"}' -UseBasicParsing
$responseTime5 = $response5.Headers.'X-Response-Time'
Write-Host "Response 5: $($responseTime5)ms"

Write-Host "`n✅ Cache-Test abgeschlossen!"
Write-Host "Erwartete Verbesserung: 50-70% schneller bei Cache-Hits"

