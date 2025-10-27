# KAYA Phase 7: Complete Intensive Testing
$BackendUrl = "http://localhost:3001"

Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "   KAYA Phase 7: Intensive Testing & Penetration" -ForegroundColor Yellow
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host ""

# Helper Functions
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

# Results
$results = @{
    Personas = @{}
    Agents = @{}
    StressTests = @{}
}

# ==============================================================================
# PHASE 7.1: PERSONA TESTING (10 Personas)
# ==============================================================================
Write-Host "PHASE 7.1: PERSONA TESTING (10 Personas)" -ForegroundColor Yellow
Write-Host "========================================================================" -ForegroundColor Cyan

# Persona 1: Senior
Write-Host "`n[1/10] Senior (75 years)" -ForegroundColor Cyan
$qs = @("Ich moechte mein Auto zulassen.", "Wie kann ich einen Termin bekommen?", "Brauche ich einen Fuehrerschein?")
$passed = 0
foreach ($q in $qs) {
    $r = Send-Chat -Message $q
    if ($r.success) { $passed++ }
    Start-Sleep -Milliseconds 500
}
$results.Personas["Senior"] = "$passed/3"

# Persona 2: Berufspendler
Write-Host "`n[2/10] Berufspendler (35 years)" -ForegroundColor Cyan
$qs = @("Ich brauche schnell einen Termin fuer KFZ-Zulassung.", "Was kostet die Zulassung?")
$passed = 0
foreach ($q in $qs) {
    $r = Send-Chat -Message $q
    if ($r.success) { $passed++ }
    Start-Sleep -Milliseconds 500
}
$results.Personas["Berufspendler"] = "$passed/2"

# Persona 3: Migrant
Write-Host "`n[3/10] Migrant (English)" -ForegroundColor Cyan
$qs = @("I need to register my residence.", "How can I get an appointment?")
$passed = 0
foreach ($q in $qs) {
    $r = Send-Chat -Message $q
    if ($r.success) { $passed++ }
    Start-Sleep -Milliseconds 500
}
$results.Personas["Migrant"] = "$passed/2"

# Persona 4: Student
Write-Host "`n[4/10] Student (20 years)" -ForegroundColor Cyan
$qs = @("Wie melde ich meinen Wohnsitz an?", "Kann ich das online machen?")
$passed = 0
foreach ($q in $qs) {
    $r = Send-Chat -Message $q
    if ($r.success) { $passed++ }
    Start-Sleep -Milliseconds 500
}
$results.Personas["Student"] = "$passed/2"

# Persona 5: Eltern
Write-Host "`n[5/10] Eltern mit Kleinkind" -ForegroundColor Cyan
$qs = @("Ich moechte mein Kind fuer die Kita anmelden.", "Wie laeuft das ab?")
$passed = 0
foreach ($q in $qs) {
    $r = Send-Chat -Message $q
    if ($r.success) { $passed++ }
    Start-Sleep -Milliseconds 500
}
$results.Personas["Eltern"] = "$passed/2"

# Persona 6: Unternehmer
Write-Host "`n[6/10] Unternehmer (Gewerbe)" -ForegroundColor Cyan
$qs = @("Ich moechte ein Gewerbe anmelden.", "Was muss ich tun?")
$passed = 0
foreach ($q in $qs) {
    $r = Send-Chat -Message $q
    if ($r.success) { $passed++ }
    Start-Sleep -Milliseconds 500
}
$results.Personas["Unternehmer"] = "$passed/2"

# Persona 7: Politiker
Write-Host "`n[7/10] Politiker" -ForegroundColor Cyan
$qs = @("Wann ist die naechste Kreistagssitzung?", "Wo finde ich Sitzungsvorlagen?")
$passed = 0
foreach ($q in $qs) {
    $r = Send-Chat -Message $q
    if ($r.success) { $passed++ }
    Start-Sleep -Milliseconds 500
}
$results.Personas["Politiker"] = "$passed/2"

# Persona 8: Tourist
Write-Host "`n[8/10] Tourist" -ForegroundColor Cyan
$qs = @("Was gibt es im Landkreis Oldenburg zu sehen?", "Welche Veranstaltungen gibt es?")
$passed = 0
foreach ($q in $qs) {
    $r = Send-Chat -Message $q
    if ($r.success) { $passed++ }
    Start-Sleep -Milliseconds 500
}
$results.Personas["Tourist"] = "$passed/2"

# Persona 9: Troll
Write-Host "`n[9/10] Troll (should handle gracefully)" -ForegroundColor Cyan
$qs = @("Das ist alles Quatsch!", "Ich verstehe nichts.", "Blablabla")
$passed = 0
foreach ($q in $qs) {
    $r = Send-Chat -Message $q
    if ($r.success) { $passed++ }
    Start-Sleep -Milliseconds 500
}
$results.Personas["Troll"] = "$passed/3"

# Persona 10: Power-User
Write-Host "`n[10/10] Power-User" -ForegroundColor Cyan
$qs = @("Ich brauche Informationen zu KFZ, Bauantrag und Gewerbe.", "Welche verschiedenen Amtswege gibt es?")
$passed = 0
foreach ($q in $qs) {
    $r = Send-Chat -Message $q
    if ($r.success) { $passed++ }
    Start-Sleep -Milliseconds 500
}
$results.Personas["PowerUser"] = "$passed/2"

# ==============================================================================
# PHASE 7.2: AGENTEN PENETRATION (15 Agents)
# ==============================================================================
Write-Host "`nPHASE 7.2: AGENTEN PENETRATION (15 Agents)" -ForegroundColor Yellow
Write-Host "========================================================================" -ForegroundColor Cyan

# Agent Tests (simplified)
$agents = @{
    "KFZ" = @("Ich habe ein neues Auto gekauft. Wie zulasse ich es?", "Was kostet die Zulassung?")
    "Buergerdienste" = @("Ich moechte meinen Wohnsitz anmelden.", "Wie bekomme ich eine Meldebescheinigung?")
    "Jobcenter" = @("Ich brauche Informationen zu Buergergeld.", "Wie stelle ich einen Antrag?")
    "Politik" = @("Wann ist die naechste Kreistagssitzung?", "Wo finde ich Sitzungsvorlagen?")
    "Bauamt" = @("Ich moechte einen Bauantrag stellen.", "Welche Formulare brauche ich?")
}

foreach ($agent in $agents.Keys) {
    Write-Host "`n[Agent] $agent" -ForegroundColor Magenta
    $passed = 0
    foreach ($q in $agents[$agent]) {
        $r = Send-Chat -Message $q
        if ($r.success) { $passed++ }
        Start-Sleep -Milliseconds 500
    }
    $results.Agents[$agent] = "$passed/$($agents[$agent].Count)"
}

# ==============================================================================
# PHASE 7.3: STRESS TESTS
# ==============================================================================
Write-Host "`nPHASE 7.3: STRESS TESTS" -ForegroundColor Yellow
Write-Host "========================================================================" -ForegroundColor Cyan

# Test 1: Rapid-Fire
Write-Host "`n[1/10] Rapid-Fire (10 messages)" -ForegroundColor Yellow
$rapidPassed = 0
for ($i = 1; $i -le 10; $i++) {
    $r = Send-Chat -Message "Test $i"
    if ($r.success) { $rapidPassed++ }
    Start-Sleep -Milliseconds 100
}
$results.StressTests["RapidFire"] = "$rapidPassed/10"

# Test 2: Long Message
Write-Host "`n[2/10] Long Message" -ForegroundColor Yellow
$longMsg = "Ich brauche Hilfe. " * 50
$r = Send-Chat -Message $longMsg
$results.StressTests["LongMessage"] = if ($r.success) { "PASSED" } else { "FAILED" }

# ==============================================================================
# FINAL SUMMARY
# ==============================================================================
Write-Host "`n========================================================================" -ForegroundColor Cyan
Write-Host "   FINAL SUMMARY" -ForegroundColor Yellow
Write-Host "========================================================================" -ForegroundColor Cyan

Write-Host "`nPersonas:"
foreach ($key in $results.Personas.Keys) {
    Write-Host "  $key : $($results.Personas[$key])" -ForegroundColor $(if ($results.Personas[$key] -like "*0/*") { "Red" } else { "Green" })
}

Write-Host "`nAgents:"
foreach ($key in $results.Agents.Keys) {
    Write-Host "  $key : $($results.Agents[$key])" -ForegroundColor $(if ($results.Agents[$key] -like "*0/*") { "Red" } else { "Green" })
}

Write-Host "`nStress Tests:"
foreach ($key in $results.StressTests.Keys) {
    Write-Host "  $key : $($results.StressTests[$key])" -ForegroundColor $(if ($results.StressTests[$key] -like "*FAILED*") { "Red" } else { "Green" })
}

Write-Host "`n========================================================================" -ForegroundColor Cyan
Write-Host "   Tests completed!" -ForegroundColor Green
Write-Host "========================================================================" -ForegroundColor Cyan

