# KAYA Production Test Script
# Automatisierte Tests für Backend-API

$baseUrl = "https://api.kaya.wattweiser.com"
$results = @()

Write-Host "KAYA Production Tests starten..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "Test 1: Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET
    if ($response.status -eq "healthy") {
        Write-Host "Health Check erfolgreich" -ForegroundColor Green
        $results += "Health Check: PASS"
    } else {
        Write-Host "Health Check fehlgeschlagen" -ForegroundColor Red
        $results += "Health Check: FAIL"
    }
    Write-Host "Response: $($response | ConvertTo-Json)" -ForegroundColor Gray
} catch {
    Write-Host "Health Check Error: $_" -ForegroundColor Red
    $results += "Health Check: ERROR"
}
Write-Host ""

# Test 2: Chat - Begruessung
Write-Host "Test 2: Chat - Begruessung (Moin)..." -ForegroundColor Yellow
try {
    $body = @{message = "Hallo"} | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$baseUrl/chat" -Method POST -ContentType "application/json" -Body $body
    if ($response.response -match "Moin") {
        Write-Host "Begruessung mit 'Moin' erkannt" -ForegroundColor Green
        $results += "Character Conformity (Begruessung): PASS"
    } else {
        Write-Host "'Moin' nicht in Antwort gefunden" -ForegroundColor Yellow
        $results += "Character Conformity (Begruessung): PARTIAL"
    }
    Write-Host "Response: $($response.response)" -ForegroundColor Gray
} catch {
    Write-Host "Chat Error: $_" -ForegroundColor Red
    $results += "Chat (Begruessung): ERROR"
}
Write-Host ""

# Test 3: Agent Routing - Buergerdienste
Write-Host "Test 3: Agent Routing - Buergerdienste..." -ForegroundColor Yellow
try {
    $body = @{message = "Ich brauche eine Meldebescheinigung"} | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$baseUrl/chat" -Method POST -ContentType "application/json" -Body $body
    if ($response.agent -eq "buergerdienste" -or $response.response -match "Meldebescheinigung") {
        Write-Host "Agent Routing: Buergerdienste erkannt" -ForegroundColor Green
        $results += "Agent Routing (Buergerdienste): PASS"
    } else {
        Write-Host "Buergerdienste-Routing unklar" -ForegroundColor Yellow
        $results += "Agent Routing (Buergerdienste): PARTIAL"
    }
    Write-Host "Response: $($response.response)" -ForegroundColor Gray
} catch {
    Write-Host "Routing Error: $_" -ForegroundColor Red
    $results += "Agent Routing: ERROR"
}
Write-Host ""

# Test 4: Empathetic Response
Write-Host "Test 4: Empathetic Response - Verzweiflung..." -ForegroundColor Yellow
try {
    $body = @{message = "Ich bin verzweifelt, ich weiss nicht weiter"} | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$baseUrl/chat" -Method POST -ContentType "application/json" -Body $body
    if ($response.response -match "helfen|unterstuetzen|verstehen|gemeinsam") {
        Write-Host "Empathische Antwort erkannt" -ForegroundColor Green
        $results += "Empathetic Response: PASS"
    } else {
        Write-Host "Empathische Antwort unklar" -ForegroundColor Yellow
        $results += "Empathetic Response: PARTIAL"
    }
    Write-Host "Response: $($response.response)" -ForegroundColor Gray
} catch {
    Write-Host "Empathy Test Error: $_" -ForegroundColor Red
    $results += "Empathetic Response: ERROR"
}
Write-Host ""

# Test 5: Language Switching
Write-Host "Test 5: Language Switching - English..." -ForegroundColor Yellow
try {
    $body = @{message = "Hello, can you help me?"} | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$baseUrl/chat" -Method POST -ContentType "application/json" -Body $body
    if ($response.response -match "Hello|help|assist|service") {
        Write-Host "Sprachwechsel zu Englisch erkannt" -ForegroundColor Green
        $results += "Language Switching: PASS"
    } else {
        Write-Host "Sprachwechsel unklar" -ForegroundColor Yellow
        $results += "Language Switching: PARTIAL"
    }
    Write-Host "Response: $($response.response)" -ForegroundColor Gray
} catch {
    Write-Host "Language Test Error: $_" -ForegroundColor Red
    $results += "Language Switching: ERROR"
}
Write-Host ""

# Test 6: Response Time
Write-Host "Test 6: Response Time (Performance)..." -ForegroundColor Yellow
try {
    $body = @{message = "Wie geht's?"} | ConvertTo-Json
    $startTime = Get-Date
    $response = Invoke-RestMethod -Uri "$baseUrl/chat" -Method POST -ContentType "application/json" -Body $body
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalSeconds
    
    if ($duration -lt 2) {
        Write-Host "Response Time: ${duration}s (< 2s)" -ForegroundColor Green
        $results += "Performance: PASS"
    } elseif ($duration -lt 5) {
        Write-Host "Response Time: ${duration}s (< 5s)" -ForegroundColor Yellow
        $results += "Performance: ACCEPTABLE"
    } else {
        Write-Host "Response Time: ${duration}s (> 5s)" -ForegroundColor Red
        $results += "Performance: SLOW"
    }
} catch {
    Write-Host "Performance Test Error: $_" -ForegroundColor Red
    $results += "Performance: ERROR"
}
Write-Host ""

# Zusammenfassung
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test-Zusammenfassung:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
foreach ($result in $results) {
    Write-Host $result
}
Write-Host ""
Write-Host "Naechste Schritte:" -ForegroundColor Cyan
Write-Host "1. Browser oeffnen: https://kaya.wattweiser.com" -ForegroundColor White
Write-Host "2. Frontend-Tests manuell durchfuehren" -ForegroundColor White
Write-Host "3. WebSocket-Verbindung in DevTools pruefen" -ForegroundColor White
Write-Host ""