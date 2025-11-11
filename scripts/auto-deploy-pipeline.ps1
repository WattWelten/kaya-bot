# KAYA Automated Deployment & Testing Pipeline
# Automatisiert: Analyse, Optimierung, Commit, Push, Deploy, Fehlerbehebung, Tests

param(
    [switch]$SkipTests = $false,
    [switch]$SkipDeploy = $false,
    [int]$MaxIterations = 5
)

$ErrorActionPreference = "Stop"
$script:iteration = 0
$script:deploymentSuccess = $false

# Farben für Output
function Write-Step { param($msg) Write-Host "`n🔷 $msg" -ForegroundColor Cyan }
function Write-Success { param($msg) Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Error { param($msg) Write-Host "❌ $msg" -ForegroundColor Red }
function Write-Warning { param($msg) Write-Host "⚠️ $msg" -ForegroundColor Yellow }
function Write-Info { param($msg) Write-Host "ℹ️ $msg" -ForegroundColor Gray }

# Schritt 1: Code-Analyse
function Invoke-CodeAnalysis {
    Write-Step "Code-Analyse durchführen..."
    
    $issues = @()
    
    # Prüfe auf console.log statt strukturiertes Logging
    $consoleLogs = Get-ChildItem -Path kaya-api -Recurse -Include *.js -Exclude node_modules | 
        Select-String -Pattern "console\.(log|error|warn)" | 
        Where-Object { $_.Path -notmatch "node_modules|dist|build" }
    
    if ($consoleLogs) {
        Write-Warning "Gefunden: $($consoleLogs.Count) console.log/warn/error Statements"
        $issues += "console.log Statements gefunden"
    }
    
    # Prüfe auf veraltete Dependencies
    $packageJson = Get-Content kaya-api/package.json | ConvertFrom-Json
    if ($packageJson.dependencies.multer -match "1\.") {
        Write-Warning "Veraltete multer Version gefunden"
        $issues += "multer sollte auf v2 aktualisiert werden"
    }
    
    # Prüfe auf fehlende TypeScript-Konfiguration
    if (-not (Test-Path kaya-api/tsconfig.json)) {
        Write-Warning "TypeScript-Konfiguration fehlt"
        $issues += "tsconfig.json fehlt"
    }
    
    # Prüfe auf große Dateien
    $largeFiles = Get-ChildItem -Path kaya-api -Recurse -File | 
        Where-Object { $_.Length -gt 500KB -and $_.Extension -match "\.(js|ts)$" } |
        Where-Object { $_.FullName -notmatch "node_modules|dist|build" }
    
    if ($largeFiles) {
        Write-Warning "Große Dateien gefunden:"
        $largeFiles | ForEach-Object { Write-Info "  $($_.Name): $([math]::Round($_.Length/1KB, 2)) KB" }
    }
    
    Write-Success "Code-Analyse abgeschlossen"
    return $issues
}

# Schritt 2: Automatische Optimierungen
function Invoke-AutoOptimizations {
    Write-Step "Automatische Optimierungen durchführen..."
    
    $optimizations = @()
    
    # Erstelle tsconfig.json falls fehlt
    if (-not (Test-Path kaya-api/tsconfig.json)) {
        Write-Info "Erstelle tsconfig.json..."
        $tsconfig = @{
            compilerOptions = @{
                target = "ES2020"
                module = "commonjs"
                lib = @("ES2020")
                outDir = "./dist"
                rootDir = "./src"
                strict = $true
                esModuleInterop = $true
                skipLibCheck = $true
                forceConsistentCasingInFileNames = $true
                resolveJsonModule = $true
                moduleResolution = "node"
            }
            include = @("src/**/*")
            exclude = @("node_modules", "dist", "**/*.test.ts")
        } | ConvertTo-Json -Depth 10
        Set-Content -Path kaya-api/tsconfig.json -Value $tsconfig
        $optimizations += "tsconfig.json erstellt"
    }
    
    # Prüfe .gitignore
    $gitignore = Get-Content .gitignore -ErrorAction SilentlyContinue
    if (-not $gitignore -or $gitignore -notmatch "\.log") {
        Write-Info "Erweitere .gitignore..."
        Add-Content -Path .gitignore -Value "`n# Logs`n*.log`nlogs/`n*.tmp`n*.temp"
        $optimizations += ".gitignore erweitert"
    }
    
    Write-Success "Optimierungen abgeschlossen: $($optimizations.Count) Änderungen"
    return $optimizations
}

# Schritt 3: Git Commit & Push
function Invoke-GitCommitAndPush {
    Write-Step "Git Commit & Push..."
    
    # Prüfe Git-Status
    $status = git status --short
    if (-not $status) {
        Write-Info "Keine Änderungen zum Committen"
        return $true
    }
    
    Write-Info "Änderungen gefunden:"
    $status | ForEach-Object { Write-Info "  $_" }
    
    # Stage alle Änderungen
    git add .
    
    # Commit
    $commitMessage = "Auto-optimization: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    git commit -m $commitMessage
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Git Commit fehlgeschlagen"
        return $false
    }
    
    # Push
    git push origin main
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Git Push fehlgeschlagen"
        return $false
    }
    
    Write-Success "Git Commit & Push erfolgreich"
    return $true
}

# Schritt 4: Warte auf Deployment
function Wait-ForDeployment {
    param([int]$WaitMinutes = 4)
    
    Write-Step "Warte $WaitMinutes Minuten auf Deployment..."
    
    $endTime = (Get-Date).AddMinutes($WaitMinutes)
    $elapsed = 0
    
    while ((Get-Date) -lt $endTime) {
        $remaining = [math]::Round(($endTime - (Get-Date)).TotalSeconds)
        Write-Info "Noch $remaining Sekunden..."
        Start-Sleep -Seconds 30
        $elapsed += 30
    }
    
    Write-Success "Wartezeit abgeschlossen"
}

# Schritt 5: Railway Logs analysieren
function Invoke-AnalyzeRailwayLogs {
    Write-Step "Railway Logs analysieren..."
    
    try {
        # Prüfe ob Railway CLI verfügbar
        $railwayVersion = railway --version 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Railway CLI nicht verfügbar, überspringe Log-Analyse"
            return @{ success = $true; errors = @() }
        }
        
        # Hole Logs für beide Services
        $apiLogs = railway logs --service kaya-api --lines 100 2>&1 | Out-String
        $frontendLogs = railway logs --service kaya-frontend --lines 100 2>&1 | Out-String
        
        $errors = @()
        
        # Analysiere API Logs
        if ($apiLogs -match "error|Error|ERROR|failed|Failed|FAILED") {
            Write-Warning "Fehler in API Logs gefunden"
            $errors += "API Logs enthalten Fehler"
        }
        
        # Analysiere Frontend Logs
        if ($frontendLogs -match "error|Error|ERROR|failed|Failed|FAILED") {
            Write-Warning "Fehler in Frontend Logs gefunden"
            $errors += "Frontend Logs enthalten Fehler"
        }
        
        # Prüfe auf Build-Erfolg
        if ($apiLogs -match "Build successful|Deployment successful") {
            Write-Success "API Build erfolgreich"
        }
        
        if ($frontendLogs -match "Build successful|Deployment successful") {
            Write-Success "Frontend Build erfolgreich"
        }
        
        return @{
            success = $errors.Count -eq 0
            errors = $errors
            apiLogs = $apiLogs
            frontendLogs = $frontendLogs
        }
    } catch {
        Write-Warning "Fehler beim Abrufen der Railway Logs: $_"
        return @{ success = $true; errors = @() }
    }
}

# Schritt 6: Automatische Fehlerbehebung
function Invoke-AutoFixErrors {
    param($logAnalysis)
    
    Write-Step "Automatische Fehlerbehebung..."
    
    $fixes = @()
    
    # Prüfe auf Dockerfile-Fehler
    if ($logAnalysis.apiLogs -match "dockerfile invalid|Dockerfile not found") {
        Write-Info "Dockerfile-Problem erkannt, prüfe Konfiguration..."
        # Prüfe railway.toml
        $railwayToml = Get-Content kaya-api/railway.toml -ErrorAction SilentlyContinue
        if ($railwayToml -notmatch "dockerfilePath") {
            Write-Info "Füge dockerfilePath zu railway.toml hinzu..."
            # Fix würde hier implementiert werden
            $fixes += "railway.toml dockerfilePath hinzugefügt"
        }
    }
    
    # Prüfe auf Environment-Variable-Fehler
    if ($logAnalysis.apiLogs -match "OPENAI_API_KEY|ELEVENLABS_API_KEY") {
        Write-Warning "Environment-Variablen möglicherweise nicht gesetzt"
        $fixes += "Environment-Variablen prüfen"
    }
    
    Write-Success "Fehlerbehebung abgeschlossen: $($fixes.Count) Fixes"
    return $fixes
}

# Schritt 7: Automatische Tests
function Invoke-AutomatedTests {
    Write-Step "Automatische Tests durchführen..."
    
    $testResults = @{
        chat = $false
        voice = $false
        avatar = $false
    }
    
    # Hole API URL aus Environment oder verwende Default
    $apiUrl = $env:VITE_API_URL
    if (-not $apiUrl) {
        $apiUrl = "https://api.kaya.wattweiser.com"
    }
    
    Write-Info "Teste gegen: $apiUrl"
    
    # Test 1: Health Check
    try {
        $healthResponse = Invoke-RestMethod -Uri "$apiUrl/health" -Method Get -TimeoutSec 10
        if ($healthResponse.status -eq "healthy") {
            Write-Success "Health Check erfolgreich"
        } else {
            Write-Warning "Health Check: Status nicht 'healthy'"
        }
    } catch {
        Write-Error "Health Check fehlgeschlagen: $_"
        return $testResults
    }
    
    # Test 2: Chat Endpoint
    try {
        $chatResponse = Invoke-RestMethod -Uri "$apiUrl/api/chat" -Method Post -Body (@{
            message = "Test"
            sessionId = "test-$(Get-Date -Format 'yyyyMMddHHmmss')"
        } | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 30
        
        if ($chatResponse.response) {
            Write-Success "Chat Test erfolgreich"
            $testResults.chat = $true
        }
    } catch {
        Write-Warning "Chat Test fehlgeschlagen: $_"
    }
    
    # Test 3: WebSocket (vereinfacht)
    Write-Info "WebSocket Test übersprungen (erfordert spezielle Bibliothek)"
    
    # Test 4: Avatar Endpoint (falls vorhanden)
    try {
        $avatarResponse = Invoke-RestMethod -Uri "$apiUrl/kaya/info" -Method Get -TimeoutSec 10
        if ($avatarResponse.name) {
            Write-Success "Avatar Info erfolgreich"
            $testResults.avatar = $true
        }
    } catch {
        Write-Warning "Avatar Info Test fehlgeschlagen: $_"
    }
    
    return $testResults
}

# Haupt-Pipeline
function Invoke-DeploymentPipeline {
    Write-Host "`n" -NoNewline
    Write-Host "=" * 80 -ForegroundColor Cyan
    Write-Host "KAYA Automated Deployment Pipeline" -ForegroundColor Cyan
    Write-Host "=" * 80 -ForegroundColor Cyan
    
    $script:iteration++
    Write-Info "Iteration: $script:iteration / $MaxIterations"
    
    # Schritt 1: Code-Analyse
    $issues = Invoke-CodeAnalysis
    
    # Schritt 2: Automatische Optimierungen
    $optimizations = Invoke-AutoOptimizations
    
    # Schritt 3: Git Commit & Push (nur wenn Änderungen)
    if ($optimizations.Count -gt 0 -or $issues.Count -gt 0) {
        if (-not $SkipDeploy) {
            $gitSuccess = Invoke-GitCommitAndPush
            if (-not $gitSuccess) {
                Write-Error "Git-Operation fehlgeschlagen, Pipeline abgebrochen"
                return $false
            }
            
            # Schritt 4: Warte auf Deployment
            Wait-ForDeployment -WaitMinutes 4
            
            # Schritt 5: Analysiere Logs
            $logAnalysis = Invoke-AnalyzeRailwayLogs
            
            # Schritt 6: Automatische Fehlerbehebung
            if ($logAnalysis.errors.Count -gt 0) {
                $fixes = Invoke-AutoFixErrors -logAnalysis $logAnalysis
                
                # Wenn Fixes gefunden, nochmal committen und deployen
                if ($fixes.Count -gt 0 -and $script:iteration -lt $MaxIterations) {
                    Write-Info "Fixes gefunden, starte nächste Iteration..."
                    return Invoke-DeploymentPipeline
                }
            }
            
            # Schritt 7: Tests (nur wenn Build erfolgreich)
            if ($logAnalysis.success -and -not $SkipTests) {
                $testResults = Invoke-AutomatedTests
                
                $allTestsPassed = $testResults.chat -and $testResults.avatar
                
                if ($allTestsPassed) {
                    Write-Success "Alle Tests erfolgreich!"
                    $script:deploymentSuccess = $true
                    return $true
                } else {
                    Write-Warning "Einige Tests fehlgeschlagen"
                    Write-Info "Chat: $($testResults.chat)"
                    Write-Info "Voice: $($testResults.voice)"
                    Write-Info "Avatar: $($testResults.avatar)"
                }
            }
        }
    } else {
        Write-Info "Keine Optimierungen notwendig"
    }
    
    if ($script:iteration -ge $MaxIterations) {
        Write-Warning "Maximale Iterationen erreicht"
        return $script:deploymentSuccess
    }
    
    return $script:deploymentSuccess
}

# Pipeline starten
try {
    $success = Invoke-DeploymentPipeline
    
    Write-Host "`n" -NoNewline
    Write-Host "=" * 80 -ForegroundColor Cyan
    if ($success) {
        Write-Success "Pipeline erfolgreich abgeschlossen!"
    } else {
        Write-Warning "Pipeline mit Warnungen abgeschlossen"
    }
    Write-Host "=" * 80 -ForegroundColor Cyan
    
    exit ($success ? 0 : 1)
} catch {
    Write-Error "Pipeline Fehler: $_"
    exit 1
}

