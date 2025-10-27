# Phase 1.1: Alle 15 Agenten testen (75 Fragen)
$BackendUrl = "http://localhost:3001"

Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "   Phase 1.1: Alle 15 Agenten testen (75 Fragen)" -ForegroundColor Yellow
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
$totalPassed = 0
$totalFailed = 0

# Agent 1: KFZ-Zulassung
Write-Host "[1/15] KFZ-Zulassung" -ForegroundColor Magenta
$qs = @(
    "Ich habe ein neues Auto gekauft. Wie zulasse ich es?",
    "Was kostet die KFZ-Zulassung?",
    "Welche Unterlagen brauche ich fuer die Zulassung?",
    "Kann ich online zulassen?",
    "Wie bekomme ich einen Termin fuer die KFZ-Zulassung?"
)
$passed = 0
foreach ($q in $qs) {
    $r = Send-Chat -Message $q
    if ($r.success) { $passed++ ; $totalPassed++ } else { $totalFailed++ }
    Start-Sleep -Milliseconds 500
}
$results["KFZ"] = "$passed/5"

# Agent 2: Buergerdienste
Write-Host "[2/15] Buergerdienste" -ForegroundColor Magenta
$qs = @(
    "Ich moechte meinen Wohnsitz anmelden.",
    "Wie bekomme ich eine Meldebescheinigung?",
    "Wo kann ich einen Termin fuer Buergerdienste buchen?",
    "Was kostet das Online-Kreishaus?",
    "Wie funktioniert die Online-Terminbuchung?"
)
$passed = 0
foreach ($q in $qs) {
    $r = Send-Chat -Message $q
    if ($r.success) { $passed++ ; $totalPassed++ } else { $totalFailed++ }
    Start-Sleep -Milliseconds 500
}
$results["Buergerdienste"] = "$passed/5"

# Agent 3: Jobcenter
Write-Host "[3/15] Jobcenter" -ForegroundColor Magenta
$qs = @(
    "Ich brauche Informationen zu Buergergeld.",
    "Wie stelle ich einen Antrag auf Buergergeld?",
    "Wo ist das Jobcenter im Landkreis?",
    "Welche Unterlagen brauche ich fuer den Buergergeld-Antrag?",
    "Gibt es eine Online-Beratung?"
)
$passed = 0
foreach ($q in $qs) {
    $r = Send-Chat -Message $q
    if ($r.success) { $passed++ ; $totalPassed++ } else { $totalFailed++ }
    Start-Sleep -Milliseconds 500
}
$results["Jobcenter"] = "$passed/5"

# Agent 4: Politik
Write-Host "[4/15] Politik" -ForegroundColor Magenta
$qs = @(
    "Wann ist die naechste Kreistagssitzung?",
    "Wo finde ich Sitzungsvorlagen des Kreistags?",
    "Wer ist der aktuelle Landrat?",
    "Wie kann ich an einer Sitzung teilnehmen?",
    "Wo finde ich Ratsinformationen?"
)
$passed = 0
foreach ($q in $qs) {
    $r = Send-Chat -Message $q
    if ($r.success) { $passed++ ; $totalPassed++ } else { $totalFailed++ }
    Start-Sleep -Milliseconds 500
}
$results["Politik"] = "$passed/5"

# Agent 5: Bauamt
Write-Host "[5/15] Bauamt" -ForegroundColor Magenta
$qs = @(
    "Ich moechte einen Bauantrag stellen.",
    "Welche Formulare brauche ich fuer einen Bauantrag?",
    "Was kostet ein Bauantrag?",
    "Wo bekomme ich Beratung zum Bauen?",
    "Wie lange dauert die Bearbeitung?"
)
$passed = 0
foreach ($q in $qs) {
    $r = Send-Chat -Message $q
    if ($r.success) { $passed++ ; $totalPassed++ } else { $totalFailed++ }
    Start-Sleep -Milliseconds 500
}
$results["Bauamt"] = "$passed/5"

# Agent 6: Gewerbe
Write-Host "[6/15] Gewerbe" -ForegroundColor Magenta
$qs = @(
    "Ich moechte ein Gewerbe anmelden.",
    "Wie melde ich ein Gewerbe an?",
    "Was kostet eine Gewerbeanmeldung?",
    "Welche Unterlagen brauche ich?",
    "Wo ist die Gewerbeabteilung?"
)
$passed = 0
foreach ($q in $qs) {
    $r = Send-Chat -Message $q
    if ($r.success) { $passed++ ; $totalPassed++ } else { $totalFailed++ }
    Start-Sleep -Milliseconds 500
}
$results["Gewerbe"] = "$passed/5"

# Agent 7: Jugend & Familie
Write-Host "[7/15] Jugend & Familie" -ForegroundColor Magenta
$qs = @(
    "Ich moechte mein Kind fuer die Kita anmelden.",
    "Wie laeuft die Kita-Anmeldung ab?",
    "Gibt es Beratung fuer Eltern?",
    "Was ist Jugendschutz?",
    "Wo ist das Jugendamt?"
)
$passed = 0
foreach ($q in $qs) {
    $r = Send-Chat -Message $q
    if ($r.success) { $passed++ ; $totalPassed++ } else { $totalFailed++ }
    Start-Sleep -Milliseconds 500
}
$results["Jugend"] = "$passed/5"

# Agent 8: Soziales
Write-Host "[8/15] Soziales" -ForegroundColor Magenta
$qs = @(
    "Ich brauche Wohngeld.",
    "Wie beantrage ich Wohngeld?",
    "Welche Unterlagen brauche ich?",
    "Wo ist das Sozialamt?",
    "Gibt es finanzielle Hilfe?"
)
$passed = 0
foreach ($q in $qs) {
    $r = Send-Chat -Message $q
    if ($r.success) { $passed++ ; $totalPassed++ } else { $totalFailed++ }
    Start-Sleep -Milliseconds 500
}
$results["Soziales"] = "$passed/5"

# Agent 9: Gesundheit
Write-Host "[9/15] Gesundheit" -ForegroundColor Magenta
$qs = @(
    "Wie bekomme ich eine Impfung?",
    "Was macht das Gesundheitsamt?",
    "Gibt es Gesundheitsberatung?",
    "Wo ist das Gesundheitsamt?",
    "Welche Gesundheitsangebote gibt es?"
)
$passed = 0
foreach ($q in $qs) {
    $r = Send-Chat -Message $q
    if ($r.success) { $passed++ ; $totalPassed++ } else { $totalFailed++ }
    Start-Sleep -Milliseconds 500
}
$results["Gesundheit"] = "$passed/5"

# Agent 10: Bildung
Write-Host "[10/15] Bildung" -ForegroundColor Magenta
$qs = @(
    "Welche Schulen gibt es im Landkreis?",
    "Gibt es Weiterbildungsangebote?",
    "Wie kann ich mich anmelden?",
    "Was kostet die Fortbildung?",
    "Wo ist die Bildungsabteilung?"
)
$passed = 0
foreach ($q in $qs) {
    $r = Send-Chat -Message $q
    if ($r.success) { $passed++ ; $totalPassed++ } else { $totalFailed++ }
    Start-Sleep -Milliseconds 500
}
$results["Bildung"] = "$passed/5"

# Agent 11: Umwelt
Write-Host "[11/15] Umwelt" -ForegroundColor Magenta
$qs = @(
    "Wie entsorge ich Sondermuell?",
    "Was ist mit Recycling?",
    "Gibt es Beratung zu Umweltschutz?",
    "Wo ist das Umweltamt?",
    "Wie kann ich umweltfreundlich leben?"
)
$passed = 0
foreach ($q in $qs) {
    $r = Send-Chat -Message $q
    if ($r.success) { $passed++ ; $totalPassed++ } else { $totalFailed++ }
    Start-Sleep -Milliseconds 500
}
$results["Umwelt"] = "$passed/5"

# Agent 12: Landwirtschaft
Write-Host "[12/15] Landwirtschaft" -ForegroundColor Magenta
$qs = @(
    "Gibt es Foerderung fuer Landwirte?",
    "Wie beantrage ich Landwirtschaftsfoerderung?",
    "Gibt es Beratung fuer Landwirte?",
    "Wo ist das Landwirtschaftsamt?",
    "Welche Programme gibt es?"
)
$passed = 0
foreach ($q in $qs) {
    $r = Send-Chat -Message $q
    if ($r.success) { $passed++ ; $totalPassed++ } else { $totalFailed++ }
    Start-Sleep -Milliseconds 500
}
$results["Landwirtschaft"] = "$passed/5"

# Agent 13: Handwerk
Write-Host "[13/15] Handwerk" -ForegroundColor Magenta
$qs = @(
    "Wie kann ich mich als Handwerker anmelden?",
    "Was ist die Handwerkskammer?",
    "Gibt es Foerderung fuer Handwerker?",
    "Wo ist die Handwerkskammer?",
    "Welche Anforderungen gibt es?"
)
$passed = 0
foreach ($q in $qs) {
    $r = Send-Chat -Message $q
    if ($r.success) { $passed++ ; $totalPassed++ } else { $totalFailed++ }
    Start-Sleep -Milliseconds 500
}
$results["Handwerk"] = "$passed/5"

# Agent 14: Tourismus
Write-Host "[14/15] Tourismus" -ForegroundColor Magenta
$qs = @(
    "Was gibt es im Landkreis zu sehen?",
    "Welche Veranstaltungen gibt es?",
    "Wo kann ich uebernachten?",
    "Wie komme ich in den Landkreis?",
    "Welche Sehenswuerdigkeiten gibt es?"
)
$passed = 0
foreach ($q in $qs) {
    $r = Send-Chat -Message $q
    if ($r.success) { $passed++ ; $totalPassed++ } else { $totalFailed++ }
    Start-Sleep -Milliseconds 500
}
$results["Tourismus"] = "$passed/5"

# Agent 15: Lieferanten
Write-Host "[15/15] Lieferanten" -ForegroundColor Magenta
$qs = @(
    "Wie erhalte ich meine Rechnung fuer Lieferungen?",
    "Wie wird gezahlt?",
    "Wo ist der Kontakt fuer Lieferanten?",
    "Was sind die Zahlungsbedingungen?",
    "Wie laeuft die Abrechnung ab?"
)
$passed = 0
foreach ($q in $qs) {
    $r = Send-Chat -Message $q
    if ($r.success) { $passed++ ; $totalPassed++ } else { $totalFailed++ }
    Start-Sleep -Milliseconds 500
}
$results["Lieferanten"] = "$passed/5"

# Summary
Write-Host "`n========================================================================" -ForegroundColor Cyan
Write-Host "   SUMMARY - 15 Agents, 75 Questions" -ForegroundColor Yellow
Write-Host "========================================================================" -ForegroundColor Cyan

foreach ($agent in $results.Keys | Sort-Object) {
    Write-Host "  $agent : $($results[$agent])" -ForegroundColor $(if ($results[$agent] -like "*0/*") { "Red" } else { "Green" })
}

Write-Host "`n  TOTAL: $totalPassed passed, $totalFailed failed" -ForegroundColor $(if ($totalFailed -eq 0) { "Green" } else { "Yellow" })

$results | ConvertTo-Json -Depth 5 | Out-File -FilePath "phase1-agents-results.json" -Encoding UTF8

Write-Host "`n  Ergebnisse gespeichert: phase1-agents-results.json" -ForegroundColor Gray
Write-Host "========================================================================" -ForegroundColor Cyan
