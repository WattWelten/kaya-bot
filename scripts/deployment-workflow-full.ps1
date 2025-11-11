# Automatisierter Deployment-Workflow - Vollständige Version
# Integriert in den Deployment-Zyklus

function Invoke-DeploymentWorkflow {
    param(
        [switch]$AutoCommit = $false,
        [switch]$AutoPush = $false
    )
    
    Write-Host "🚀 Starte Deployment-Workflow..." -ForegroundColor Green
    
    # 1. Git Status pruefen
    Write-Host "`n📋 Schritt 1: Git Status pruefen..." -ForegroundColor Cyan
    $gitStatus = git status --short
    if ($gitStatus) {
        Write-Host "⚠️ Uncommitted Changes gefunden:" -ForegroundColor Yellow
        $gitStatus | ForEach-Object { Write-Host "  $_" }
    } else {
        Write-Host "✅ Keine uncommitted Changes" -ForegroundColor Green
        return
    }
    
    # 2. Unnoetige Dateien identifizieren und loeschen
    Write-Host "`n🧹 Schritt 2: Unnoetige Dateien identifizieren..." -ForegroundColor Cyan
    $unnecessaryPatterns = @("*.tmp", "*.temp", "*.log", "*.swp", "*.swo", "*~", ".DS_Store", "Thumbs.db", "desktop.ini", "*.bak", "*.backup")
    $unnecessaryFiles = @()
    foreach ($pattern in $unnecessaryPatterns) {
        $files = Get-ChildItem -Path . -Recurse -Include $pattern -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch "node_modules|\.git" }
        $unnecessaryFiles += $files
    }
    if ($unnecessaryFiles.Count -gt 0) {
        Write-Host "🗑️ Loesche $($unnecessaryFiles.Count) unnoetige Dateien..." -ForegroundColor Yellow
        $unnecessaryFiles | Remove-Item -Force -ErrorAction SilentlyContinue
        Write-Host "✅ Unnoetige Dateien geloescht" -ForegroundColor Green
    }
    
    # 3. Pruefe wichtige Dateien
    Write-Host "`n✅ Schritt 3: Pruefe wichtige Dateien..." -ForegroundColor Cyan
    $importantFiles = @(
        "kaya-api/Dockerfile", "kaya-api/railway.toml", "kaya-api/package.json",
        "kaya-frontend/Dockerfile", "kaya-frontend/railway.toml", "kaya-frontend/package.json",
        ".github/workflows/deploy-kaya-api.yml", ".github/workflows/deploy-kaya-frontend.yml"
    )
    $missingFiles = $importantFiles | Where-Object { -not (Test-Path $_) }
    if ($missingFiles.Count -gt 0) {
        Write-Host "❌ Fehlende wichtige Dateien:" -ForegroundColor Red
        $missingFiles | ForEach-Object { Write-Host "  $_" }
        return
    }
    Write-Host "✅ Alle wichtigen Dateien vorhanden" -ForegroundColor Green
    
    # 4. Analysiere Git-Status
    Write-Host "`n📊 Schritt 4: Analysiere Git-Status..." -ForegroundColor Cyan
    $deletedFiles = git status --short | Where-Object { $_ -match "^D " }
    $newFiles = git status --short | Where-Object { $_ -match "^\?\? " }
    $modifiedFiles = git status --short | Where-Object { $_ -match "^M " }
    
    $deploymentRelevant = git status --short | Where-Object { 
        $_ -match "kaya-api|kaya-frontend|\.github|Dockerfile|railway\.toml|\.dockerignore|\.railwayignore|scripts/" 
    }
    
    if ($deletedFiles) {
        Write-Host "🗑️ Gelöschte Dateien: $($deletedFiles.Count)" -ForegroundColor Yellow
    }
    if ($newFiles) {
        Write-Host "📄 Neue Dateien: $($newFiles.Count)" -ForegroundColor Yellow
    }
    if ($modifiedFiles) {
        Write-Host "✏️ Geänderte Dateien: $($modifiedFiles.Count)" -ForegroundColor Yellow
    }
    
    if ($deploymentRelevant) {
        Write-Host "✅ Deployment-relevante Änderungen gefunden: $($deploymentRelevant.Count)" -ForegroundColor Green
        
        if ($AutoCommit) {
            Write-Host "`n💾 Schritt 5: Committe Änderungen..." -ForegroundColor Cyan
            git add -A
            $commitMessage = "chore: Automatische Bereinigung und Deployment-Updates"
            if ($deletedFiles) {
                $commitMessage += " - Gelöschte Dateien entfernt"
            }
            if ($newFiles) {
                $commitMessage += " - Neue Dateien hinzugefügt"
            }
            git commit -m $commitMessage
            Write-Host "✅ Änderungen committed" -ForegroundColor Green
            
            if ($AutoPush) {
                Write-Host "`n🚀 Schritt 6: Pushe Änderungen..." -ForegroundColor Cyan
                git push
                Write-Host "✅ Änderungen gepusht" -ForegroundColor Green
            }
        }
    } else {
        Write-Host "ℹ️ Keine deployment-relevanten Änderungen" -ForegroundColor Gray
    }
    
    Write-Host "`n✅ Deployment-Workflow-Vorbereitung abgeschlossen!" -ForegroundColor Green
}

# Exportiere Funktion für Verwendung in anderen Scripts
Export-ModuleMember -Function Invoke-DeploymentWorkflow

