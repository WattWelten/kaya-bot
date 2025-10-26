# Intensives Testing mit verschiedenen Bürger-Personas und Dialog-Stilen

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "=== INTENSIVE KAYA PERSONA-TESTS ===" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ========================================
# TEST-GRUPPE 1: SENIOR BÜRGER (65+)
# ========================================
Write-Host "`n--- TEST-GRUPPE 1: SENIOR BÜRGER (65+) ---" -ForegroundColor Yellow

# Test 1.1: Klara (78, einfache Sprache, viel Unterstützung)
Write-Host "`n> Test 1.1: Klara (78 J.)" -ForegroundColor Magenta
$body = @{message="Hallo, ich bin Klara und bin 78 Jahre";sessionId="persona-senior-klara"} | ConvertTo-Json
$r = Invoke-WebRequest -Uri https://api.kaya.wattweiser.com/chat -Method POST -Headers @{"Content-Type"="application/json"} -Body $body | ConvertFrom-Json
Write-Host "KAYA: $($r.response)`n" -ForegroundColor Cyan

$body = @{message="Ich brauche einen neuen Ausweis";sessionId="persona-senior-klara"} | ConvertTo-Json
$r = Invoke-WebRequest -Uri https://api.kaya.wattweiser.com/chat -Method POST -Headers @{"Content-Type"="application/json"} -Body $body | ConvertFrom-Json
Write-Host "KAYA: $($r.response)`n" -ForegroundColor Cyan

$body = @{message="Was brauche ich denn alles? Ich komme ja schlecht hin";sessionId="persona-senior-klara"} | ConvertTo-Json
$r = Invoke-WebRequest -Uri https://api.kaya.wattweiser.com/chat -Method POST -Headers @{"Content-Type"="application/json"} -Body $body | ConvertFrom-Json
Write-Host "KAYA: $($r.response)`n" -ForegroundColor Cyan

# Test 1.2: Wilhelm (82, Plattdeutsch, sehr formal)
Write-Host "`n> Test 1.2: Wilhelm (82 J., Plattdeutsch)" -ForegroundColor Magenta
$body = @{message="Moin, ik heit Wilhelm";sessionId="persona-senior-wilhelm"} | ConvertTo-Json
$r = Invoke-WebRequest -Uri https://api.kaya.wattweiser.com/chat -Method POST -Headers @{"Content-Type"="application/json"} -Body $body | ConvertFrom-Json
Write-Host "KAYA: $($r.response)`n" -ForegroundColor Cyan

# ========================================
# TEST-GRUPPE 2: JUNGE ELTERN (25-35)
# ========================================
Write-Host "`n--- TEST-GRUPPE 2: JUNGE ELTERN (25-35) ---" -ForegroundColor Yellow

# Test 2.1: Sarah & Tom (32/30, erstes Kind)
Write-Host "`n> Test 2.1: Sarah & Tom (32/30, erstes Kind)" -ForegroundColor Magenta
$body = @{message="Moin, ich bin Sarah. Wir haben gerade unser erstes Kind bekommen";sessionId="persona-parents-01"} | ConvertTo-Json
$r = Invoke-WebRequest -Uri https://api.kaya.wattweiser.com/chat -Method POST -Headers @{"Content-Type"="application/json"} -Body $body | ConvertFrom-Json
Write-Host "KAYA: $($r.response)`n" -ForegroundColor Cyan

$body = @{message="Was müssen wir denn alles machen?";sessionId="persona-parents-01"} | ConvertTo-Json
$r = Invoke-WebRequest -Uri https://api.kaya.wattweiser.com/chat -Method POST -Headers @{"Content-Type"="application/json"} -Body $body | ConvertFrom-Json
Write-Host "KAYA: $($r.response)`n" -ForegroundColor Cyan

$body = @{message="Wie viel kostet das alles?";sessionId="persona-parents-01"} | ConvertTo-Json
$r = Invoke-WebRequest -Uri https://api.kaya.wattweiser.com/chat -Method POST -Headers @{"Content-Type"="application/json"} -Body $body | ConvertFrom-Json
Write-Host "KAYA: $($r.response)`n" -ForegroundColor Cyan

# ========================================
# TEST-GRUPPE 3: ARBEITSLOSE / BÜRGERGELD
# ========================================
Write-Host "`n--- TEST-GRUPPE 3: ARBEITSLOSE / BÜRGERGELD ---" -ForegroundColor Yellow

# Test 3.1: Michael (45, 6 Monate arbeitslos)
Write-Host "`n> Test 3.1: Michael (45 J., arbeitslos)" -ForegroundColor Magenta
$body = @{message="Ich heiße Michael und bin seit 6 Monaten arbeitslos";sessionId="persona-unemployed-01"} | ConvertTo-Json
$r = Invoke-WebRequest -Uri https://api.kaya.wattweiser.com/chat -Method POST -Headers @{"Content-Type"="application/json"} -Body $body | ConvertFrom-Json
Write-Host "KAYA: $($r.response)`n" -ForegroundColor Cyan

$body = @{message="Bekomme ich Bürgergeld?";sessionId="persona-unemployed-01"} | ConvertTo-Json
$r = Invoke-WebRequest -Uri https://api.kaya.wattweiser.com/chat -Method POST -Headers @{"Content-Type"="application/json"} -Body $body | ConvertFrom-Json
Write-Host "KAYA: $($r.response)`n" -ForegroundColor Cyan

$body = @{message="Wie lange dauert das mit dem Antrag?";sessionId="persona-unemployed-01"} | ConvertTo-Json
$r = Invoke-WebRequest -Uri https://api.kaya.wattweiser.com/chat -Method POST -Headers @{"Content-Type"="application/json"} -Body $body | ConvertFrom-Json
Write-Host "KAYA: $($r.response)`n" -ForegroundColor Cyan

# ========================================
# TEST-GRUPPE 4: GRÜNDER/UNTERNEHMER
# ========================================
Write-Host "`n--- TEST-GRUPPE 4: GRÜNDER/UNTERNEHMER ---" -ForegroundColor Yellow

# Test 4.1: Lisa (28, Gründerin)
Write-Host "`n> Test 4.1: Lisa (28 J., Gründerin)" -ForegroundColor Magenta
$body = @{message="Moin, ich bin Lisa und will ein Café eröffnen";sessionId="persona-founder-01"} | ConvertTo-Json
$r = Invoke-WebRequest -Uri https://api.kaya.wattweiser.com/chat -Method POST -Headers @{"Content-Type"="application/json"} -Body $body | ConvertFrom-Json
Write-Host "KAYA: $($r.response)`n" -ForegroundColor Cyan

$body = @{message="Welche Gewerbeanmeldung brauche ich?";sessionId="persona-founder-01"} | ConvertTo-Json
$r = Invoke-WebRequest -Uri https://api.kaya.wattweiser.com/chat -Method POST -Headers @{"Content-Type"="application/json"} -Body $body | ConvertFrom-Json
Write-Host "KAYA: $($r.response)`n" -ForegroundColor Cyan

# ========================================
# TEST-GRUPPE 5: ZUGEZOGEN / MIGRANT
# ========================================
Write-Host "`n--- TEST-GRUPPE 5: ZUGEZOGEN / MIGRANT ---" -ForegroundColor Yellow

# Test 5.1: Fatma (35, vor 3 Monaten zugezogen, türkisch)
Write-Host "`n> Test 5.1: Fatma (35 J., zugezogen, einfach Sprache)" -ForegroundColor Magenta
$body = @{message="Hallo, ich heiße Fatma und bin neu hier";sessionId="persona-migrant-01"} | ConvertTo-Json
$r = Invoke-WebRequest -Uri https://api.kaya.wattweiser.com/chat -Method POST -Headers @{"Content-Type"="application/json"} -Body $body | ConvertFrom-Json
Write-Host "KAYA: $($r.response)`n" -ForegroundColor Cyan

$body = @{message="Ich brauche einen Führerschein";sessionId="persona-migrant-01"} | ConvertTo-Json
$r = Invoke-WebRequest -Uri https://api.kaya.wattweiser.com/chat -Method POST -Headers @{"Content-Type"="application/json"} -Body $body | ConvertFrom-Json
Write-Host "KAYA: $($r.response)`n" -ForegroundColor Cyan

# ========================================
# TEST-GRUPPE 6: STUDENT
# ========================================
Write-Host "`n--- TEST-GRUPPE 6: STUDENT ---" -ForegroundColor Yellow

# Test 6.1: Jonas (22, Student Uni Oldenburg)
Write-Host "`n> Test 6.1: Jonas (22 J., Student)" -ForegroundColor Magenta
$body = @{message="Ich bin Jonas, Student an der Uni";sessionId="persona-student-01"} | ConvertTo-Json
$r = Invoke-WebRequest -Uri https://api.kaya.wattweiser.com/chat -Method POST -Headers @{"Content-Type"="application/json"} -Body $body | ConvertFrom-Json
Write-Host "KAYA: $($r.response)`n" -ForegroundColor Cyan

$body = @{message="Brauche ich ein Semesterticket für den Landkreis?";sessionId="persona-student-01"} | ConvertTo-Json
$r = Invoke-WebRequest -Uri https://api.kaya.wattweiser.com/chat -Method POST -Headers @{"Content-Type"="application/json"} -Body $body | ConvertFrom-Json
Write-Host "KAYA: $($r.response)`n" -ForegroundColor Cyan

# ========================================
# TEST-GRUPPE 7: KRISEN / NOTFALL
# ========================================
Write-Host "`n--- TEST-GRUPPE 7: KRISEN / NOTFALL ---" -ForegroundColor Yellow

# Test 7.1: Sandra (40, häusliche Gewalt)
Write-Host "`n> Test 7.1: Sandra (40 J., häusliche Gewalt - SENSIBEL!)" -ForegroundColor Magenta
$body = @{message="Ich brauche dringend Hilfe";sessionId="persona-crisis-01"} | ConvertTo-Json
$r = Invoke-WebRequest -Uri https://api.kaya.wattweiser.com/chat -Method POST -Headers @{"Content-Type"="application/json"} -Body $body | ConvertFrom-Json
Write-Host "KAYA: $($r.response)`n" -ForegroundColor Cyan

$body = @{message="Mein Partner wird gewalttätig";sessionId="persona-crisis-01"} | ConvertTo-Json
$r = Invoke-WebRequest -Uri https://api.kaya.wattweiser.com/chat -Method POST -Headers @{"Content-Type"="application/json"} -Body $body | ConvertFrom-Json
Write-Host "KAYA: $($r.response)`n" -ForegroundColor Cyan

# ========================================
# TEST-GRUPPE 8: HANDWERKER
# ========================================
Write-Host "`n--- TEST-GRUPPE 8: HANDWERKER ---" -ForegroundColor Yellow

# Test 8.1: Markus (38, Elektriker)
Write-Host "`n> Test 8.1: Markus (38 J., Elektriker)" -ForegroundColor Magenta
$body = @{message="Ich bin Markus, selbstständiger Elektriker";sessionId="persona-handwerk-01"} | ConvertTo-Json
$r = Invoke-WebRequest -Uri https://api.kaya.wattweiser.com/chat -Method POST -Headers @{"Content-Type"="application/json"} -Body $body | ConvertFrom-Json
Write-Host "KAYA: $($r.response)`n" -ForegroundColor Cyan

$body = @{message="Brauche ich eine Gewerbeanmeldung?";sessionId="persona-handwerk-01"} | ConvertTo-Json
$r = Invoke-WebRequest -Uri https://api.kaya.wattweiser.com/chat -Method POST -Headers @{"Content-Type"="application/json"} -Body $body | ConvertFrom-Json
Write-Host "KAYA: $($r.response)`n" -ForegroundColor Cyan

# ========================================
# TEST-GRUPPE 9: LANDWIRT
# ========================================
Write-Host "`n--- TEST-GRUPPE 9: LANDWIRT ---" -ForegroundColor Yellow

# Test 9.1: Heinrich (55, Milchbauer)
Write-Host "`n> Test 9.1: Heinrich (55 J., Milchbauer)" -ForegroundColor Magenta
$body = @{message="Ich heiße Heinrich und habe einen Milchviehbetrieb";sessionId="persona-farmer-01"} | ConvertTo-Json
$r = Invoke-WebRequest -Uri https://api.kaya.wattweiser.com/chat -Method POST -Headers @{"Content-Type"="application/json"} -Body $body | ConvertFrom-Json
Write-Host "KAYA: $($r.response)`n" -ForegroundColor Cyan

$body = @{message="Gibt es Förderungen für Umweltschutz?";sessionId="persona-farmer-01"} | ConvertTo-Json
$r = Invoke-WebRequest -Uri https://api.kaya.wattweiser.com/chat -Method POST -Headers @{"Content-Type"="application/json"} -Body $body | ConvertFrom-Json
Write-Host "KAYA: $($r.response)`n" -ForegroundColor Cyan

# ========================================
# TEST-GRUPPE 10: BEHINDERUNG / TEILHABE
# ========================================
Write-Host "`n--- TEST-GRUPPE 10: BEHINDERUNG / TEILHABE ---" -ForegroundColor Yellow

# Test 10.1: Peter (45, Rollstuhlfahrer)
Write-Host "`n> Test 10.1: Peter (45 J., Rollstuhlfahrer)" -ForegroundColor Magenta
$body = @{message="Ich bin Peter und sitze im Rollstuhl";sessionId="persona-disability-01"} | ConvertTo-Json
$r = Invoke-WebRequest -Uri https://api.kaya.wattweiser.com/chat -Method POST -Headers @{"Content-Type"="application/json"} -Body $body | ConvertFrom-Json
Write-Host "KAYA: $($r.response)`n" -ForegroundColor Cyan

$body = @{message="Wie beantrage ich einen Schwerbehindertenausweis?";sessionId="persona-disability-01"} | ConvertTo-Json
$r = Invoke-WebRequest -Uri https://api.kaya.wattweiser.com/chat -Method POST -Headers @{"Content-Type"="application/json"} -Body $body | ConvertFrom-Json
Write-Host "KAYA: $($r.response)`n" -ForegroundColor Cyan

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "=== ALLE TESTS ABGESCHLOSSEN! ===" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green


