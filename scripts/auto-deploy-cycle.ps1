# Automatisierter Deployment-Zyklus
# Integriert Git-Status-Prüfung, Bereinigung, Commits und Railway-Deployment

$ErrorActionPreference = "Continue"

function Invoke-FullDeploymentCycle {
    param(
        [int]$MaxIterations = 10,
        [int]$WaitSeconds = 240
    )
    
    $iteration = 0
    
    while ($iteration -lt $MaxIterations) {
        $iteration++
        Write-Host "`n🔄 Iteration $iteration von $MaxIterations" -ForegroundColor Cyan
        Write-Host "=" * 80 -ForegroundColor Gray
        
        # 1. Git-Status prüfen und bereinigen
        Write-Host "`n📋 Schritt 1: Git-Status prüfen und bereinigen..." -ForegroundColor Cyan
        & "$PSScriptRoot/deployment-workflow.ps1"
        
        # Prüfe ob Änderungen vorhanden sind
        $gitStatus = git status --short
        if ($gitStatus) {
            $deploymentRelevant = $gitStatus | Where-Object { 
                $_ -match "kaya-api|kaya-frontend|\.github|Dockerfile|railway\.toml|\.dockerignore|\.railwayignore|scripts/" 
            }
            
            if ($deploymentRelevant) {
                Write-Host "`n💾 Committe deployment-relevante Änderungen..." -ForegroundColor Yellow
                git add -A
                $commitMessage = "chore: Automatische Bereinigung und Deployment-Updates (Iteration $iteration)"
                git commit -m $commitMessage
                git push
                Write-Host "✅ Änderungen committed und gepusht" -ForegroundColor Green
            }
        }
        
        # 2. GitHub Actions Status prüfen
        Write-Host "`n🔍 Schritt 2: GitHub Actions Status prüfen..." -ForegroundColor Cyan
        $runs = gh run list --limit 3 --json conclusion,displayTitle,createdAt --jq '.[] | "\(.conclusion)|\(.displayTitle)|\(.createdAt)"' 2>$null
        if ($runs) {
            $runs | ForEach-Object {
                $parts = $_ -split '\|'
                $status = $parts[0]
                $title = $parts[1]
                if ($status -eq "failure") {
                    Write-Host "❌ Fehlgeschlagen: $title" -ForegroundColor Red
                } elseif ($status -eq "success") {
                    Write-Host "✅ Erfolgreich: $title" -ForegroundColor Green
                } else {
                    Write-Host "⏳ Läuft: $title" -ForegroundColor Yellow
                }
            }
        }
        
        # 3. Railway Logs abrufen
        Write-Host "`n📊 Schritt 3: Railway Logs abrufen..." -ForegroundColor Cyan
        try {
            railway service kaya-api 2>$null | Out-Null
            $apiLogs = railway logs --build --lines 50 2>$null
            if ($apiLogs -match "unpacking archive, complete") {
                Write-Host "⚠️ kaya-api: Snapshot entpackt, aber keine Docker-Build-Logs" -ForegroundColor Yellow
            } elseif ($apiLogs -match "Step|FROM|RUN") {
                Write-Host "✅ kaya-api: Docker-Build läuft" -ForegroundColor Green
            }
            
            railway service kaya-frontend 2>$null | Out-Null
            $frontendLogs = railway logs --build --lines 50 2>$null
            if ($frontendLogs -match "unpacking archive, complete") {
                Write-Host "⚠️ kaya-frontend: Snapshot entpackt, aber keine Docker-Build-Logs" -ForegroundColor Yellow
            } elseif ($frontendLogs -match "Step|FROM|RUN") {
                Write-Host "✅ kaya-frontend: Docker-Build läuft" -ForegroundColor Green
            }
        } catch {
            Write-Host "⚠️ Railway CLI nicht verfügbar oder nicht authentifiziert" -ForegroundColor Yellow
        }
        
        # 4. Prüfe ob alles erfolgreich ist
        $allSuccessful = $true
        if ($runs) {
            $failedRuns = $runs | Where-Object { $_ -match "^failure\|" }
            if ($failedRuns) {
                $allSuccessful = $false
                Write-Host "`n❌ Fehler gefunden - analysiere..." -ForegroundColor Red
                
                # Analysiere fehlgeschlagene Runs
                $runIds = gh run list --limit 3 --json databaseId,conclusion --jq '.[] | select(.conclusion == "failure") | .databaseId' 2>$null
                foreach ($runId in $runIds) {
                    Write-Host "`n📋 Analysiere Run $runId..." -ForegroundColor Cyan
                    $errorLogs = gh run view $runId --log-failed 2>$null | Select-Object -Last 20
                    if ($errorLogs) {
                        $errorLogs | Select-String -Pattern "error|Error|ERROR|fail|Fail|FAIL|unauthorized|Unauthorized" | Select-Object -First 5
                    }
                }
            }
        }
        
        if ($allSuccessful -and -not $gitStatus) {
            Write-Host "`n✅ Alle Checks erfolgreich - Deployment-Zyklus abgeschlossen!" -ForegroundColor Green
            break
        }
        
        # 5. Warte 4 Minuten vor nächster Iteration
        if ($iteration -lt $MaxIterations) {
            Write-Host "`n⏳ Warte $WaitSeconds Sekunden vor nächster Iteration..." -ForegroundColor Cyan
            Start-Sleep -Seconds $WaitSeconds
        }
    }
    
    Write-Host "`n🏁 Deployment-Zyklus beendet nach $iteration Iterationen" -ForegroundColor Cyan
}

# Führe Deployment-Zyklus aus
Invoke-FullDeploymentCycle -MaxIterations 10 -WaitSeconds 240

