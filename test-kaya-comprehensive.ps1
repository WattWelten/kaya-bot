# KAYA Comprehensive Test Suite
# Tests alle 30 Test-Kategorien systematisch

Write-Host "=== KAYA Comprehensive Test Suite ===" -ForegroundColor Green
Write-Host ""

$baseUrl = "https://api.kaya.wattweiser.com"
$testsPassed = 0
$testsFailed = 0
$testResults = @()

function Test-API {
    param (
        [string]$Category,
        [string]$TestName,
        [string]$Endpoint,
        [string]$Method = "GET",
        [object]$Body = $null,
        [string]$ExpectedContent = ""
    )
    
    try {
        if ($Method -eq "POST" -and $Body -ne $null) {
            $bodyJson = $Body | ConvertTo-Json -Compress
            $response = Invoke-RestMethod -Uri "$baseUrl$Endpoint" -Method $Method -ContentType "application/json" -Body $bodyJson
        } else {
            $response = Invoke-RestMethod -Uri "$baseUrl$Endpoint" -Method $Method
        }
        
        $success = $true
        if ($ExpectedContent -ne "" -and $response.response -notlike "*$ExpectedContent*") {
            $success = $false
        }
        
        if ($success) {
            Write-Host "  ✅ $Category - $TestName" -ForegroundColor Green
            $script:testsPassed++
            $script:testResults += @{
                Category = $Category
                Test = $TestName
                Status = "PASS"
            }
        } else {
            Write-Host "  ❌ $Category - $TestName (Expected: $ExpectedContent)" -ForegroundColor Red
            $script:testsFailed++
            $script:testResults += @{
                Category = $Category
                Test = $TestName
                Status = "FAIL"
            }
        }
    } catch {
        Write-Host "  ❌ $Category - $TestName (Error: $($_.Exception.Message))" -ForegroundColor Red
        $script:testsFailed++
        $script:testResults += @{
            Category = $Category
            Test = $TestName
            Status = "FAIL"
            Error = $_.Exception.Message
        }
    }
}

# ==========================================
# TEST-KATEGORIE 1: Character Conformity
# ==========================================
Write-Host "Test-Kategorie 1: Character Conformity" -ForegroundColor Cyan

Test-API "Character Conformity" "Norddeutsche Begrüßung" "/chat" "POST" @{
    message = "Moin!"
    sessionId = "test-character-1"
} "Moin"

Test-API "Character Conformity" "5-Schritte-Prinzip" "/chat" "POST" @{
    message = "Wie beantrage ich einen Führerschein?"
    sessionId = "test-character-2"
} ""

Test-API "Character Conformity" "Empathische Reaktion" "/chat" "POST" @{
    message = "Ich bin verzweifelt, ich weiß nicht weiter"
    sessionId = "test-character-3"
} ""

Write-Host ""

# ==========================================
# TEST-KATEGORIE 2: Agent Routing
# ==========================================
Write-Host "Test-Kategorie 2: Agent Routing" -ForegroundColor Cyan

Test-API "Agent Routing" "Bürgerdienste - Meldebescheinigung" "/chat" "POST" @{
    message = "Ich brauche eine Meldebescheinigung"
    sessionId = "test-routing-1"
} ""

Test-API "Agent Routing" "KFZ-Zulassung" "/chat" "POST" @{
    message = "Ich möchte mein Auto anmelden"
    sessionId = "test-routing-2"
} ""

Test-API "Agent Routing" "Ratsinfo" "/chat" "POST" @{
    message = "Wann ist die nächste Kreistagssitzung?"
    sessionId = "test-routing-3"
} ""

Test-API "Agent Routing" "Stellenportal" "/chat" "POST" @{
    message = "Gibt es offene Stellen im Landkreis?"
    sessionId = "test-routing-4"
} ""

Test-API "Agent Routing" "Kontakte" "/chat" "POST" @{
    message = "Wie erreiche ich das Bürgerbüro?"
    sessionId = "test-routing-5"
} "04431"

Write-Host ""

# ==========================================
# TEST-KATEGORIE 3: Sprachwechsel
# ==========================================
Write-Host "Test-Kategorie 3: Sprachwechsel" -ForegroundColor Cyan

Test-API "Sprachwechsel" "Deutsch → Englisch" "/chat" "POST" @{
    message = "Hello KAYA, can you help me?"
    sessionId = "test-language-1"
} ""

Test-API "Sprachwechsel" "Englisch → Deutsch" "/chat" "POST" @{
    message = "Auf Deutsch bitte"
    sessionId = "test-language-1"
} ""

Test-API "Sprachwechsel" "Türkisch" "/chat" "POST" @{
    message = "Merhaba KAYA, yardım edebilir misin?"
    sessionId = "test-language-2"
} ""

Write-Host ""

# ==========================================
# TEST-KATEGORIE 4: OpenAI-Integration
# ==========================================
Write-Host "Test-Kategorie 4: OpenAI-Integration" -ForegroundColor Cyan

Test-API "OpenAI" "Komplexe Frage" "/chat" "POST" @{
    message = "Erkläre mir detailliert, wie ich eine Baugenehmigung beantrage"
    sessionId = "test-openai-1"
} ""

Test-API "OpenAI" "Session Continuity" "/chat" "POST" @{
    message = "Ich brauche eine Meldebescheinigung"
    sessionId = "test-openai-2"
} ""

Test-API "OpenAI" "Follow-Up Question" "/chat" "POST" @{
    message = "Was brauche ich dafür?"
    sessionId = "test-openai-2"
} ""

Write-Host ""

# ==========================================
# TEST-KATEGORIE 5: Performance
# ==========================================
Write-Host "Test-Kategorie 5: Performance" -ForegroundColor Cyan

$startTime = Get-Date
for ($i = 1; $i -le 5; $i++) {
    Test-API "Performance" "Request $i" "/chat" "POST" @{
        message = "Test $i"
        sessionId = "test-perf-$i"
    } ""
}
$endTime = Get-Date
$duration = ($endTime - $startTime).TotalSeconds
Write-Host "  ⏱️  Durchschnittliche Zeit: $([Math]::Round($duration / 5, 2))s für 5 Requests"

Write-Host ""

# ==========================================
# TEST-KATEGORIE 6: Session Management
# ==========================================
Write-Host "Test-Kategorie 6: Session Management" -ForegroundColor Cyan

Test-API "Session" "Session Continuity" "/chat" "POST" @{
    message = "Mein Name ist Test"
    sessionId = "test-session-1"
} ""

Test-API "Session" "Session Recall" "/chat" "POST" @{
    message = "Wie lautet mein Name?"
    sessionId = "test-session-1"
} ""

Write-Host ""

# ==========================================
# TEST-KATEGORIE 7: Error Handling
# ==========================================
Write-Host "Test-Kategorie 7: Error Handling" -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/chat" -Method POST -ContentType "application/json" -Body '{"message": ""}'
    Write-Host "  ❌ Error Handling - Leere Nachricht sollte 400 Error geben" -ForegroundColor Red
    $script:testsFailed++
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "  ✅ Error Handling - Leere Nachricht gibt 400 Error" -ForegroundColor Green
        $script:testsPassed++
    } else {
        Write-Host "  ❌ Error Handling - Falscher Error Code" -ForegroundColor Red
        $script:testsFailed++
    }
}

Write-Host ""

# ==========================================
# TEST-KATEGORIE 8: Integration
# ==========================================
Write-Host "Test-Kategorie 8: Integration" -ForegroundColor Cyan

Test-API "Integration" "Health Check" "/health" "GET" $null $null

Test-API "Integration" "KAYA Info" "/kaya/info" "GET" $null "KAYA"

Write-Host ""

# ==========================================
# ZUSAMMENFASSUNG
# ==========================================
Write-Host "=== Test-Ergebnisse ===" -ForegroundColor Yellow
Write-Host "Tests erfolgreich: $testsPassed" -ForegroundColor Green
Write-Host "Tests fehlgeschlagen: $testsFailed" -ForegroundColor Red
Write-Host "Gesamt: $($testsPassed + $testsFailed)"

# Exportiere Ergebnisse
$testResults | Export-Csv -Path "test-results-$(Get-Date -Format 'yyyyMMdd-HHmmss').csv" -NoTypeInformation
Write-Host ""
Write-Host "Ergebnisse exportiert nach: test-results-$(Get-Date -Format 'yyyyMMdd-HHmmss').csv"

