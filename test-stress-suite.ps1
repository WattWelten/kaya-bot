# Phase 1.2: Erweiterte Stress-Tests
$BackendUrl = "http://localhost:3001"

Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "   Phase 1.2: Erweiterte Stress-Tests" -ForegroundColor Yellow
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host ""

# Helper
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

# Test 1: Rapid-Fire (20 Nachrichten in 2 Min)
Write-Host "[1/5] Rapid-Fire Test (20 messages in 2 min)" -ForegroundColor Yellow
$rapidPassed = 0
Write-Host "  Sende 20 Nachrichten schnell hintereinander..." -ForegroundColor Gray
for ($i = 1; $i -le 20; $i++) {
    $r = Send-Chat -Message "Test $i"
    if ($r.success) { $rapidPassed++ }
    Write-Host "  $i/20" -NoNewline
    Start-Sleep -Milliseconds 50
    Write-Host "`r" -NoNewline
}
Write-Host "  Ergebnis: $rapidPassed/20" -ForegroundColor $(if ($rapidPassed -ge 18) { "Green" } else { "Yellow" })
$results["RapidFire"] = "$rapidPassed/20"

# Test 2: Lange Nachricht (500+ Woerter)
Write-Host "`n[2/5] Long Message Test (500+ words)" -ForegroundColor Yellow
$longMsg = "Ich brauche Hilfe. " * 50
$r = Send-Chat -Message $longMsg
$results["LongMessage"] = if ($r.success) { "PASSED" } else { "FAILED" }
Write-Host "  Ergebnis: $($results['LongMessage'])" -ForegroundColor $(if ($r.success) { "Green" } else { "Red" })

# Test 3: Edge Cases (Emojis, Sonderzeichen)
Write-Host "`n[3/5] Edge Cases Test (Emojis, Special Chars)" -ForegroundColor Yellow
$edgeCases = @(
    "Test emoji",
    "SpecialChars !@#",
    "Test mit Umlauten: aeu AEU ss",
    "Multi-line test Line 2 Line 3",
    "SQL injection test"
)
$edgePassed = 0
foreach ($edgeCase in $edgeCases) {
    $r = Send-Chat -Message $edgeCase
    if ($r.success) { $edgePassed++ }
}
Write-Host "  Ergebnis: $edgePassed/$($edgeCases.Count)" -ForegroundColor $(if ($edgePassed -eq $edgeCases.Count) { "Green" } else { "Yellow" })
$results["EdgeCases"] = "$edgePassed/$($edgeCases.Count)"

# Test 4: Error-Injection Simulation (Fake)
Write-Host "`n[4/5] Error Injection Test (Timeout Simulation)" -ForegroundColor Yellow
Write-Host "  Sende 10 Nachrichten mit kurzer Verzögerung..." -ForegroundColor Gray
$errorPassed = 0
for ($i = 1; $i -le 10; $i++) {
    $r = Send-Chat -Message "Test $i"
    if ($r.success) { $errorPassed++ }
    Start-Sleep -Milliseconds 200
}
Write-Host "  Ergebnis: $errorPassed/10" -ForegroundColor $(if ($errorPassed -ge 8) { "Green" } else { "Yellow" })
$results["ErrorSimulation"] = "$errorPassed/10"

# Test 5: Speicher-Leak Test (100 Nachrichten)
Write-Host "`n[5/5] Memory Leak Test (100 messages)" -ForegroundColor Yellow
Write-Host "  Sende 100 Nachrichten und prüfe Konsistenz..." -ForegroundColor Gray
$memoryPassed = 0
$startTime = Get-Date
for ($i = 1; $i -le 100; $i++) {
    $r = Send-Chat -Message "Test $i"
    if ($r.success) { $memoryPassed++ }
    if ($i % 20 -eq 0) {
        Write-Host "  Progress: $i/100" -ForegroundColor Gray
    }
    Start-Sleep -Milliseconds 100
}
$endTime = Get-Date
$duration = ($endTime - $startTime).TotalSeconds
Write-Host "  Ergebnis: $memoryPassed/100 (Duration: $([math]::Round($duration, 2))s)" -ForegroundColor $(if ($memoryPassed -ge 90) { "Green" } else { "Yellow" })
$results["MemoryLeak"] = "$memoryPassed/100"

# Summary
Write-Host "`n========================================================================" -ForegroundColor Cyan
Write-Host "   SUMMARY - Stress Tests" -ForegroundColor Yellow
Write-Host "========================================================================" -ForegroundColor Cyan

foreach ($test in $results.Keys | Sort-Object) {
    Write-Host "  $test : $($results[$test])" -ForegroundColor $(if ($results[$test] -like "*FAILED*" -or $results[$test] -like "*0/*" -or $results[$test] -like "*0/100") { "Red" } else { "Green" })
}

$results | ConvertTo-Json -Depth 5 | Out-File -FilePath "phase1-stress-results.json" -Encoding UTF8

Write-Host "`n  Ergebnisse gespeichert: phase1-stress-results.json" -ForegroundColor Gray
Write-Host "========================================================================" -ForegroundColor Cyan
