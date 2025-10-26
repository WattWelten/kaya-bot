# Test-Validierung für die 3 Fixes: Name-Extraction, Urgency-Detection, Context-References

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "=== VALIDIERUNG DER 3 FIXES ===" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ========================================
# TEST: Fix 1 - Name-Extraction
# ========================================
Write-Host "`n--- FIX 1: NAME-EXTRACTION ---" -ForegroundColor Yellow

Write-Host "`n> Test: 'ich bin Klara und bin 78 Jahre'" -ForegroundColor Magenta
$body = @{message="Hallo, ich bin Klara und bin 78 Jahre";sessionId="test-name-klara"} | ConvertTo-Json
$r = Invoke-WebRequest -Uri https://api.kaya.wattweiser.com/chat -Method POST -Headers @{"Content-Type"="application/json"} -Body $body | ConvertFrom-Json
Write-Host "Antwort 1: $($r.response)" -ForegroundColor Cyan

$body = @{message="Wie heiße ich?";sessionId="test-name-klara"} | ConvertTo-Json
$r = Invoke-WebRequest -Uri https://api.kaya.wattweiser.com/chat -Method POST -Headers @{"Content-Type"="application/json"} -Body $body | ConvertFrom-Json
Write-Host "Antwort 2 (sollte 'Klara' erwähnen): $($r.response)" -ForegroundColor Cyan
if ($r.response -match "Klara") {
    Write-Host "✅ NAME ERKANNT!" -ForegroundColor Green
} else {
    Write-Host "❌ Name nicht erwähnt" -ForegroundColor Red
}

Start-Sleep -Seconds 2

Write-Host "`n> Test: 'mein Name ist Michael'" -ForegroundColor Magenta
$body = @{message="mein Name ist Michael";sessionId="test-name-michael"} | ConvertTo-Json
$r = Invoke-WebRequest -Uri https://api.kaya.wattweiser.com/chat -Method POST -Headers @{"Content-Type"="application/json"} -Body $body | ConvertFrom-Json
Write-Host "Antwort 1: $($r.response)" -ForegroundColor Cyan

$body = @{message="Brauche Bürgergeld";sessionId="test-name-michael"} | ConvertTo-Json
$r = Invoke-WebRequest -Uri https://api.kaya.wattweiser.com/chat -Method POST -Headers @{"Content-Type"="application/json"} -Body $body | ConvertFrom-Json
Write-Host "Antwort 2 (sollte 'Michael' erwähnen): $($r.response)" -ForegroundColor Cyan
if ($r.response -match "Michael") {
    Write-Host "✅ NAME ERKANNT!" -ForegroundColor Green
} else {
    Write-Host "❌ Name nicht erwähnt" -ForegroundColor Red
}

# ========================================
# TEST: Fix 2 - Urgency-Detection (Krisen)
# ========================================
Write-Host "`n`n--- FIX 2: URGENCY-DETECTION (KRISEN) ---" -ForegroundColor Yellow

Write-Host "`n> Test: 'Mein Partner schlägt mich' (CRITICAL)" -ForegroundColor Magenta
$body = @{message="Hilfe, mein Partner schlägt mich";sessionId="test-crisis-01"} | ConvertTo-Json
$r = Invoke-WebRequest -Uri https://api.kaya.wattweiser.com/chat -Method POST -Headers @{"Content-Type"="application/json"} -Body $body | ConvertFrom-Json
Write-Host "Antwort (sollte SOFORT 110/112 erwähnen): $($r.response)" -ForegroundColor Cyan
if ($r.response -match "110|112|sofort" -or $r.response -match "Polizei") {
    Write-Host "✅ KRISEN-ERKENNUNG!" -ForegroundColor Green
} else {
    Write-Host "⚠️ Krisen-Erkennung zu schwach" -ForegroundColor Yellow
}

Start-Sleep -Seconds 2

Write-Host "`n> Test: 'ich brauche dringend hilfe'" -ForegroundColor Magenta
$body = @{message="ich brauche dringend hilfe";sessionId="test-crisis-02"} | ConvertTo-Json
$r = Invoke-WebRequest -Uri https://api.kaya.wattweiser.com/chat -Method POST -Headers @{"Content-Type"="application/json"} -Body $body | ConvertFrom-Json
Write-Host "Antwort (DRINGEND?): $($r.response)" -ForegroundColor Cyan

# ========================================
# TEST: Fix 3 - Context-References
# ========================================
Write-Host "`n`n--- FIX 3: CONTEXT-REFERENCES ---" -ForegroundColor Yellow

Write-Host "`n> Test: Multi-Turn Dialog (Sarah + Kind)" -ForegroundColor Magenta
$body = @{message="Ich bin Sarah und wir haben ein Kind bekommen";sessionId="test-context-01"} | ConvertTo-Json
$r = Invoke-WebRequest -Uri https://api.kaya.wattweiser.com/chat -Method POST -Headers @{"Content-Type"="application/json"} -Body $body | ConvertFrom-Json
Write-Host "Antwort 1: $($r.response)" -ForegroundColor Cyan

$body = @{message="Geht das genauer?";sessionId="test-context-01"} | ConvertTo-Json
$r = Invoke-WebRequest -Uri https://api.kaya.wattweiser.com/chat -Method POST -Headers @{"Content-Type"="application/json"} -Body $body | ConvertFrom-Json
Write-Host "Antwort 2 (sollte auf 'Kind' referenzieren): $($r.response)" -ForegroundColor Cyan
if ($r.response -match "Kind|Kindes|Geburt|Anmeldung" -and $r.response -match "Sarah") {
    Write-Host "✅ CONTEXT + NAME!" -ForegroundColor Green
} elseif ($r.response -match "Kind|Kindes|Geburt|Anmeldung") {
    Write-Host "⚠️ Context ja, Name nein" -ForegroundColor Yellow
} else {
    Write-Host "❌ Context fehlt" -ForegroundColor Red
}

Start-Sleep -Seconds 2

Write-Host "`n> Test: Kein 'Moin!' in Follow-ups" -ForegroundColor Magenta
$body = @{message="Grundstück gekauft";sessionId="test-nogreet-01"} | ConvertTo-Json
$r = Invoke-WebRequest -Uri https://api.kaya.wattweiser.com/chat -Method POST -Headers @{"Content-Type"="application/json"} -Body $body | ConvertFrom-Json
Write-Host "Antwort 1: $($r.response)" -ForegroundColor Cyan

$body = @{message="Welche Unterlagen?";sessionId="test-nogreet-01"} | ConvertTo-Json
$r = Invoke-WebRequest -Uri https://api.kaya.wattweiser.com/chat -Method POST -Headers @{"Content-Type"="application/json"} -Body $body | ConvertFrom-Json
Write-Host "Antwort 2 (KEIN 'Moin!'): $($r.response)" -ForegroundColor Cyan
if ($r.response -notmatch "Moin!") {
    Write-Host "✅ KEINE REDUNDANTE BEGRÜSSUNG!" -ForegroundColor Green
} else {
    Write-Host "❌ 'Moin!' ist noch da" -ForegroundColor Red
}

# ========================================
# FINAL SUMMARY
# ========================================
Write-Host "`n`n========================================" -ForegroundColor Cyan
Write-Host "=== TEST-VALIDIERUNG ABGESCHLOSSEN! ===" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan


