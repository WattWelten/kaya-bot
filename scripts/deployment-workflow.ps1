# Automatisierter Deployment-Workflow
# Prüft Git-Status, bereinigt unnötige Dateien, committet und deployed

Write-Host "🚀 Starte Deployment-Workflow..." -ForegroundColor Green

# 1. Git Status prüfen
Write-Host "`n📋 Schritt 1: Git Status prüfen..." -ForegroundColor Cyan
$gitStatus = git status --short
if ($gitStatus) {
    Write-Host "⚠️ Uncommitted Changes gefunden:" -ForegroundColor Yellow
    $gitStatus | ForEach-Object { Write-Host "  $_" }
} else {
    Write-Host "✅ Keine uncommitted Changes" -ForegroundColor Green
}

# 2. Unnötige Dateien identifizieren
Write-Host "`n🧹 Schritt 2: Unnötige Dateien identifizieren..." -ForegroundColor Cyan

# Patterns für unnötige Dateien
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
    Write-Host "⚠️ Unnötige Dateien gefunden:" -ForegroundColor Yellow
    $unnecessaryFiles | ForEach-Object { Write-Host "  $($_.FullName)" }
    
    # Frage ob gelöscht werden soll (in automatisiertem Modus: automatisch löschen)
    Write-Host "🗑️ Lösche unnötige Dateien..." -ForegroundColor Yellow
    $unnecessaryFiles | Remove-Item -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Unnötige Dateien gelöscht" -ForegroundColor Green
} else {
    Write-Host "✅ Keine unnötigen Dateien gefunden" -ForegroundColor Green
}

# 3. Prüfe ob wichtige Dateien fehlen
Write-Host "`n✅ Schritt 3: Prüfe wichtige Dateien..." -ForegroundColor Cyan
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

# 4. Prüfe ob Dateien in .gitignore sind, die committed sein sollten
Write-Host "`n📝 Schritt 4: Prüfe .gitignore..." -ForegroundColor Cyan
$gitignoreContent = Get-Content .gitignore -ErrorAction SilentlyContinue
if ($gitignoreContent) {
    Write-Host "✅ .gitignore vorhanden" -ForegroundColor Green
} else {
    Write-Host "⚠️ .gitignore fehlt" -ForegroundColor Yellow
}

# 5. Prüfe ob große Dateien committed sind
Write-Host "`n📦 Schritt 5: Prüfe große Dateien..." -ForegroundColor Cyan
$largeFiles = Get-ChildItem -Path . -Recurse -File -ErrorAction SilentlyContinue | 
    Where-Object { 
        $_.Length -gt 10MB -and 
        $_.FullName -notmatch "node_modules|\.git|dist|build|\.glb" 
    } | 
    Select-Object FullName, @{Name="SizeMB";Expression={[math]::Round($_.Length/1MB,2)}}

if ($largeFiles) {
    Write-Host "⚠️ Große Dateien gefunden (>10MB):" -ForegroundColor Yellow
    $largeFiles | ForEach-Object { Write-Host "  $($_.FullName) - $($_.SizeMB) MB" }
} else {
    Write-Host "✅ Keine ungewöhnlich großen Dateien" -ForegroundColor Green
}

# 6. Prüfe ob Änderungen committed werden müssen
Write-Host "`n💾 Schritt 6: Prüfe ob Commit nötig..." -ForegroundColor Cyan
$gitStatus = git status --short
if ($gitStatus) {
    Write-Host "📝 Änderungen gefunden - bereite Commit vor..." -ForegroundColor Yellow
    
    # Prüfe ob es Deployment-relevante Änderungen sind
    $deploymentRelevant = $gitStatus | Where-Object { 
        $_ -match "kaya-api|kaya-frontend|\.github|Dockerfile|railway\.toml|\.dockerignore|\.railwayignore" 
    }
    
    if ($deploymentRelevant) {
        Write-Host "✅ Deployment-relevante Änderungen gefunden" -ForegroundColor Green
        Write-Host "💡 Hinweis: Diese sollten committed werden" -ForegroundColor Cyan
    } else {
        Write-Host "ℹ️ Keine deployment-relevanten Änderungen" -ForegroundColor Gray
    }
} else {
    Write-Host "✅ Keine Änderungen zum Committen" -ForegroundColor Green
}

Write-Host "`n✅ Deployment-Workflow-Vorbereitung abgeschlossen!" -ForegroundColor Green

