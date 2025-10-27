# KAYA Intensive Testing - 10 Personas, 15 Agenten, Belastungstests
# Professional Testing Suite für v1.0 Production Readiness

$API_URL = "https://api.kaya.wattweiser.com"
$FRONTEND_URL = "https://app.kaya.wattweiser.com"

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "KAYA v1.0 - Intensive Testing Suite" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Test-Ergebnisse
$results = @()

# Hilfsfunktion: Test durchführen
function Test-KAYAQuery {
    param(
        [string]$Query,
        [string]$Persona,
        [string]$Agent,
        [string]$ExpectedKeywords
    )
    
    try {
        $body = @{
            message = $Query
            sessionId = "test-$(Get-Date -Format 'yyyyMMddHHmmss')"
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "$API_URL/api/chat" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 30
        
        $success = $true
        $keywords = $ExpectedKeywords -split ','
        foreach ($keyword in $keywords) {
            if ($response.response -notlike "*$keyword*") {
                $success = $false
            }
        }
        
        return @{
            Persona = $Persona
            Agent = $Agent
            Query = $Query
            Success = $success
            Response = $response.response.Substring(0, [Math]::Min(100, $response.response.Length))
            Timestamp = Get-Date
        }
    }
    catch {
        return @{
            Persona = $Persona
            Agent = $Agent
            Query = $Query
            Success = $false
            Response = "ERROR: $($_.Exception.Message)"
            Timestamp = Get-Date
        }
    }
}

Write-Host "Phase 1: Persona-Testing (10 Personas)" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow

# Persona 1: Senior (75 Jahre)
Write-Host "`n[1/10] Testing Persona: Senior (75 Jahre)..." -ForegroundColor Green
$results += Test-KAYAQuery -Query "Ich brauche einen neuen Ausweis. Wie geht das?" -Persona "Senior" -Agent "Bürgerdienste" -ExpectedKeywords "Ausweis,Termin,Unterlagen"
$results += Test-KAYAQuery -Query "KFZ ummelden nach Umzug" -Persona "Senior" -Agent "KFZ" -ExpectedKeywords "KFZ,Termin,Straßenverkehrsamt"

# Persona 2: Berufspendler (35 Jahre, gestresst)
Write-Host "[2/10] Testing Persona: Berufspendler (gestresst)..." -ForegroundColor Green
$results += Test-KAYAQuery -Query "Schnell: Termin KFZ Zulassung heute noch?" -Persona "Berufspendler" -Agent "KFZ" -ExpectedKeywords "Termin,KFZ,04431"
$results += Test-KAYAQuery -Query "Welche Unterlagen KFZ?" -Persona "Berufspendler" -Agent "KFZ" -ExpectedKeywords "Unterlagen,Fahrzeugschein"

# Persona 3: Migrant (Englisch)
Write-Host "[3/10] Testing Persona: Migrant (Englisch)..." -ForegroundColor Green
$results += Test-KAYAQuery -Query "I need help with registration" -Persona "Migrant" -Agent "Bürgerdienste" -ExpectedKeywords "registration,Melde,Termin"

# Persona 4: Student (20 Jahre, techaffin)
Write-Host "[4/10] Testing Persona: Student (techaffin)..." -ForegroundColor Green
$results += Test-KAYAQuery -Query "BAföG-Antrag und gleichzeitig Jobcenter-Leistungen - geht das?" -Persona "Student" -Agent "Soziales" -ExpectedKeywords "BAföG,Jobcenter"
$results += Test-KAYAQuery -Query "Online-Zulassung für KFZ möglich?" -Persona "Student" -Agent "KFZ" -ExpectedKeywords "Online,KFZ"

# Persona 5: Eltern (Kita-Anmeldung)
Write-Host "[5/10] Testing Persona: Eltern (Kleinkind)..." -ForegroundColor Green
$results += Test-KAYAQuery -Query "Kita-Platz anmelden, Kind 2 Jahre" -Persona "Eltern" -Agent "Jugend" -ExpectedKeywords "Kita,Kinderbetreuung"
$results += Test-KAYAQuery -Query "Kindergeld beantragen" -Persona "Eltern" -Agent "Jugend" -ExpectedKeywords "Kindergeld"

# Persona 6: Unternehmer
Write-Host "[6/10] Testing Persona: Unternehmer..." -ForegroundColor Green
$results += Test-KAYAQuery -Query "Gewerbe anmelden, was brauche ich?" -Persona "Unternehmer" -Agent "Gewerbe" -ExpectedKeywords "Gewerbe,Anmeldung,Formular"
$results += Test-KAYAQuery -Query "Bauantrag für Firmenerweiterung" -Persona "Unternehmer" -Agent "Bau" -ExpectedKeywords "Bauantrag,Formular"

# Persona 7: Politiker/Journalist
Write-Host "[7/10] Testing Persona: Politiker/Journalist..." -ForegroundColor Green
$results += Test-KAYAQuery -Query "Wann ist die nächste Kreistagssitzung?" -Persona "Politiker" -Agent "Politik" -ExpectedKeywords "Kreistag,Sitzung"
$results += Test-KAYAQuery -Query "Sitzungsvorlagen Kreistag abrufen" -Persona "Politiker" -Agent "Politik" -ExpectedKeywords "Vorlagen,Ratsinfo"

# Persona 8: Tourist
Write-Host "[8/10] Testing Persona: Tourist..." -ForegroundColor Green
$results += Test-KAYAQuery -Query "Sehenswürdigkeiten im Landkreis Oldenburg" -Persona "Tourist" -Agent "Tourismus" -ExpectedKeywords "Sehensw,Landkreis"

# Persona 9: Troll (provozierend)
Write-Host "[9/10] Testing Persona: Troll..." -ForegroundColor Green
$results += Test-KAYAQuery -Query "Ihr seid alle unfähig!" -Persona "Troll" -Agent "Allgemein" -ExpectedKeywords "helfen,Frage"
$results += Test-KAYAQuery -Query "asdfghjkl" -Persona "Troll" -Agent "Allgemein" -ExpectedKeywords "verstanden,helfen"

# Persona 10: Power-User
Write-Host "[10/10] Testing Persona: Power-User..." -ForegroundColor Green
$results += Test-KAYAQuery -Query "KFZ-Zulassung: Kosten, Dauer, Online-Option, Öffnungszeiten, Parkplätze?" -Persona "Power-User" -Agent "KFZ" -ExpectedKeywords "KFZ,Kosten,Termin"

Write-Host "`nPhase 2: Agenten-Penetration (15 Agenten)" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow

# Agent-Tests
$agentTests = @(
    @{ Agent="KFZ"; Query="Auto zulassen Termin"; Keywords="KFZ,Termin,Straßenverkehrsamt" },
    @{ Agent="Bürgerdienste"; Query="Meldebescheinigung beantragen"; Keywords="Meldebescheinigung,Termin" },
    @{ Agent="Jobcenter"; Query="Bürgergeld Antrag stellen"; Keywords="Bürgergeld,Jobcenter,Antrag" },
    @{ Agent="Politik"; Query="Kreistag Fraktionen"; Keywords="Kreistag,Fraktionen" },
    @{ Agent="Bau"; Query="Bauantrag Formulare"; Keywords="Bauantrag,Formular" },
    @{ Agent="Gewerbe"; Query="Gewerbe anmelden"; Keywords="Gewerbe,Anmeldung" },
    @{ Agent="Jugend"; Query="Kita Anmeldung"; Keywords="Kita,Kinderbetreuung" },
    @{ Agent="Soziales"; Query="Wohngeld beantragen"; Keywords="Wohngeld,Sozial" },
    @{ Agent="Gesundheit"; Query="Gesundheitsamt Impfberatung"; Keywords="Gesundheitsamt,Impf" },
    @{ Agent="Bildung"; Query="Weiterbildung Kurse"; Keywords="Bildung,Weiterbildung" },
    @{ Agent="Umwelt"; Query="Müll entsorgen"; Keywords="Müll,Abfall,Umwelt" },
    @{ Agent="Landwirtschaft"; Query="Landwirtschaft Förderung"; Keywords="Landwirtschaft,Förderung" },
    @{ Agent="Handwerk"; Query="Handwerkskammer Ausbildung"; Keywords="Handwerk,Ausbildung" },
    @{ Agent="Tourismus"; Query="Hotels Landkreis Oldenburg"; Keywords="Hotel,Tourismus,Landkreis" },
    @{ Agent="Lieferanten"; Query="Rechnung einreichen Landkreis"; Keywords="Rechnung,Lieferant" }
)

$i = 1
foreach ($test in $agentTests) {
    Write-Host "[$i/15] Testing Agent: $($test.Agent)..." -ForegroundColor Green
    $results += Test-KAYAQuery -Query $test.Query -Persona "Agent-Test" -Agent $test.Agent -ExpectedKeywords $test.Keywords
    $i++
}

Write-Host "`nPhase 3: Belastungstests" -ForegroundColor Yellow
Write-Host "=========================" -ForegroundColor Yellow

# Test 1: Rapid-Fire
Write-Host "[1/5] Belastungstest: Rapid-Fire (10 Nachrichten schnell)..." -ForegroundColor Green
for ($i = 1; $i -le 10; $i++) {
    $results += Test-KAYAQuery -Query "Test $i: KFZ Zulassung" -Persona "Belastungstest" -Agent "Rapid-Fire" -ExpectedKeywords "KFZ"
    Start-Sleep -Milliseconds 100
}

# Test 2: Lange Nachricht
Write-Host "[2/5] Belastungstest: Lange Nachricht (500+ Wörter)..." -ForegroundColor Green
$longMessage = "Ich habe mehrere Fragen: Erstens möchte ich mein Auto zulassen und brauche dafür alle Informationen zu Terminen, Kosten und Unterlagen. " * 20
$results += Test-KAYAQuery -Query $longMessage -Persona "Belastungstest" -Agent "Lange-Nachricht" -ExpectedKeywords "KFZ"

# Test 3: Edge Cases
Write-Host "[3/5] Belastungstest: Edge Cases..." -ForegroundColor Green
$results += Test-KAYAQuery -Query "" -Persona "Belastungstest" -Agent "Edge-Case" -ExpectedKeywords ""
$results += Test-KAYAQuery -Query "😀😁😂🤣" -Persona "Belastungstest" -Agent "Edge-Case" -ExpectedKeywords "helfen"
$results += Test-KAYAQuery -Query "!@#$%^&*()" -Persona "Belastungstest" -Agent "Edge-Case" -ExpectedKeywords "helfen"

# Test 4: Frontend Check
Write-Host "[4/5] Belastungstest: Frontend erreichbar..." -ForegroundColor Green
try {
    $frontendResponse = Invoke-WebRequest -Uri $FRONTEND_URL -TimeoutSec 10 -UseBasicParsing
    Write-Host "✓ Frontend erreichbar (Status: $($frontendResponse.StatusCode))" -ForegroundColor Green
}
catch {
    Write-Host "✗ Frontend NICHT erreichbar: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: API Health
Write-Host "[5/5] Belastungstest: API Health Check..." -ForegroundColor Green
try {
    $healthResponse = Invoke-RestMethod -Uri "$API_URL/health" -TimeoutSec 10
    Write-Host "✓ API Health OK" -ForegroundColor Green
}
catch {
    Write-Host "✗ API Health FEHLER: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n==================================" -ForegroundColor Cyan
Write-Host "Test-Zusammenfassung" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

$totalTests = $results.Count
$successfulTests = ($results | Where-Object { $_.Success -eq $true }).Count
$failedTests = $totalTests - $successfulTests
$successRate = [math]::Round(($successfulTests / $totalTests) * 100, 2)

Write-Host "Total Tests: $totalTests" -ForegroundColor White
Write-Host "Erfolgreich: $successfulTests" -ForegroundColor Green
Write-Host "Fehlgeschlagen: $failedTests" -ForegroundColor Red
Write-Host "Erfolgsquote: $successRate%" -ForegroundColor $(if ($successRate -ge 90) { "Green" } elseif ($successRate -ge 75) { "Yellow" } else { "Red" })

# Fehlgeschlagene Tests anzeigen
if ($failedTests -gt 0) {
    Write-Host "`nFehlgeschlagene Tests:" -ForegroundColor Red
    $results | Where-Object { $_.Success -eq $false } | ForEach-Object {
        Write-Host "  - [$($_.Persona)] $($_.Agent): $($_.Query)" -ForegroundColor Red
        Write-Host "    Response: $($_.Response)" -ForegroundColor Gray
    }
}

# Ergebnisse in Datei speichern
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$reportFile = "test-results-$timestamp.json"
$results | ConvertTo-Json -Depth 10 | Out-File $reportFile
Write-Host "`n✓ Test-Ergebnisse gespeichert: $reportFile" -ForegroundColor Green

Write-Host "`n==================================" -ForegroundColor Cyan
Write-Host "Testing abgeschlossen!" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan



