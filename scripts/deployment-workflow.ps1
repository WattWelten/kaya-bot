# Automatisierter Deployment-Workflow
# Prueft Git-Status, bereinigt unnoetige Dateien, committet und deployed

Write-Host "🚀 Starte Deployment-Workflow..." -ForegroundColor Green

# 1. Git Status pruefen
Write-Host "`n📋 Schritt 1: Git Status pruefen..." -ForegroundColor Cyan
$gitStatus = git status --short
if ($gitStatus) {
    Write-Host "⚠️ Uncommitted Changes gefunden:" -ForegroundColor Yellow
    $gitStatus | ForEach-Object { Write-Host "  $_" }
} else {
    Write-Host "✅ Keine uncommitted Changes" -ForegroundColor Green
}

# 2. Unnoetige Dateien identifizieren
Write-Host "`n🧹 Schritt 2: Unnoetige Dateien identifizieren..." -ForegroundColor Cyan

# Patterns fuer unnoetige Dateien
$unnecessaryPatterns = @(
    "*.tmp",
    "*.temp",
    "*.log",
    "*.swp",
    "*.swo",
    "*~",
    ".DS_Store",
    "Thumbs.db",
    "desktop.ini",
    "*.bak",
    "*.backup",
    "node_modules/.cache",
    ".vscode/settings.json",
    ".idea/workspace.xml"
)

$unnecessaryFiles = @()
foreach ($pattern in $unnecessaryPatterns) {
    $files = Get-ChildItem -Path . -Recurse -Include $pattern -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch "node_modules|\.git" }
    $unnecessaryFiles += $files
}

if ($unnecessaryFiles.Count -gt 0) {
    Write-Host "⚠️ Unnoetige Dateien gefunden:" -ForegroundColor Yellow
    $unnecessaryFiles | ForEach-Object { Write-Host "  $($_.FullName)" }
    
    # Frage ob geloescht werden soll (in automatisiertem Modus: automatisch loeschen)
    Write-Host "🗑️ Loesche unnoetige Dateien..." -ForegroundColor Yellow
    $unnecessaryFiles | Remove-Item -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Unnoetige Dateien geloescht" -ForegroundColor Green
} else {
    Write-Host "✅ Keine unnoetigen Dateien gefunden" -ForegroundColor Green
}

# 3. Pruefe ob wichtige Dateien fehlen
Write-Host "`n✅ Schritt 3: Pruefe wichtige Dateien..." -ForegroundColor Cyan
$importantFiles = @(
    "kaya-api/Dockerfile",
    "kaya-api/railway.toml",
    "kaya-api/package.json",
    "kaya-frontend/Dockerfile",
    "kaya-frontend/railway.toml",
    "kaya-frontend/package.json",
    ".github/workflows/deploy-kaya-api.yml",
    ".github/workflows/deploy-kaya-frontend.yml"
)

$missingFiles = @()
foreach ($file in $importantFiles) {
    if (-not (Test-Path $file)) {
        $missingFiles += $file
        Write-Host "❌ Fehlt: $file" -ForegroundColor Red
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "⚠️ WICHTIG: Fehlende Dateien gefunden!" -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ Alle wichtigen Dateien vorhanden" -ForegroundColor Green
}

# 4. Pruefe ob Dateien in .gitignore sind, die committed sein sollten
Write-Host "`n📝 Schritt 4: Pruefe .gitignore..." -ForegroundColor Cyan
$gitignoreContent = Get-Content .gitignore -ErrorAction SilentlyContinue
if ($gitignoreContent) {
    Write-Host "✅ .gitignore vorhanden" -ForegroundColor Green
} else {
    Write-Host "⚠️ .gitignore fehlt" -ForegroundColor Yellow
}

# 5. Pruefe ob grosse Dateien committed sind
Write-Host "`n📦 Schritt 5: Pruefe grosse Dateien..." -ForegroundColor Cyan
$largeFiles = Get-ChildItem -Path . -Recurse -File -ErrorAction SilentlyContinue | 
    Where-Object { 
        $_.Length -gt 10MB -and 
        $_.FullName -notmatch "node_modules|\.git|dist|build|\.glb" 
    } | 
    Select-Object FullName, @{Name="SizeMB";Expression={[math]::Round($_.Length/1MB,2)}}

if ($largeFiles) {
    Write-Host "⚠️ Grosse Dateien gefunden (>10MB):" -ForegroundColor Yellow
    $largeFiles | ForEach-Object { Write-Host "  $($_.FullName) - $($_.SizeMB) MB" }
} else {
    Write-Host "✅ Keine ungewoehnlich grossen Dateien" -ForegroundColor Green
}

# 6. Pruefe ob Aenderungen committed werden muessen
Write-Host "`n💾 Schritt 6: Pruefe ob Commit noetig..." -ForegroundColor Cyan
$gitStatus = git status --short
if ($gitStatus) {
    Write-Host "📝 Aenderungen gefunden - bereite Commit vor..." -ForegroundColor Yellow
    
    # Pruefe ob es Deployment-relevante Aenderungen sind
    $deploymentRelevant = $gitStatus | Where-Object { 
        $_ -match "kaya-api|kaya-frontend|\.github|Dockerfile|railway\.toml|\.dockerignore|\.railwayignore" 
    }
    
    if ($deploymentRelevant) {
        Write-Host "✅ Deployment-relevante Aenderungen gefunden" -ForegroundColor Green
        Write-Host "💡 Hinweis: Diese sollten committed werden" -ForegroundColor Cyan
    } else {
        Write-Host "ℹ️ Keine deployment-relevanten Aenderungen" -ForegroundColor Gray
    }
} else {
    Write-Host "✅ Keine Aenderungen zum Committen" -ForegroundColor Green
}

# 7. Pruefe geloeschte Dateien (D) - sollten committed werden
Write-Host "`n🗑️ Schritt 7: Pruefe geloeschte Dateien..." -ForegroundColor Cyan
$deletedFiles = git status --short | Where-Object { $_ -match "^D " }
if ($deletedFiles) {
    Write-Host "⚠️ Gelöschte Dateien gefunden (bereits aus Git entfernt):" -ForegroundColor Yellow
    $deletedFiles | ForEach-Object { Write-Host "  $_" }
    Write-Host "💡 Diese sollten committed werden" -ForegroundColor Cyan
} else {
    Write-Host "✅ Keine gelöschten Dateien" -ForegroundColor Green
}

# 8. Pruefe neue Dateien (??) - sollten geprueft werden
Write-Host "`n📄 Schritt 8: Pruefe neue Dateien..." -ForegroundColor Cyan
$newFiles = git status --short | Where-Object { $_ -match "^\?\? " }
if ($newFiles) {
    Write-Host "⚠️ Neue Dateien gefunden:" -ForegroundColor Yellow
    $newFiles | ForEach-Object { Write-Host "  $_" }
    
    # Pruefe ob neue Dateien deployment-relevant sind
    $relevantNewFiles = $newFiles | Where-Object { 
        $_ -match "kaya-api|kaya-frontend|\.github|Dockerfile|railway\.toml|\.dockerignore|\.railwayignore|scripts/" 
    }
    
    if ($relevantNewFiles) {
        Write-Host "✅ Deployment-relevante neue Dateien gefunden" -ForegroundColor Green
        Write-Host "💡 Diese sollten committed werden" -ForegroundColor Cyan
    } else {
        Write-Host "ℹ️ Neue Dateien sind nicht deployment-relevant" -ForegroundColor Gray
    }
} else {
    Write-Host "✅ Keine neuen Dateien" -ForegroundColor Green
}

Write-Host "`n✅ Deployment-Workflow-Vorbereitung abgeschlossen!" -ForegroundColor Green

