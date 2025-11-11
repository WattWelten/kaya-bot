# KAYA Complete Automation Pipeline
# Kombiniert Deployment-Pipeline und Test-Suite

param(
    [switch]$SkipTests = $false,
    [switch]$SkipDeploy = $false,
    [int]$MaxIterations = 5,
    [string]$ApiUrl = "https://api.kaya.wattweiser.com"
)

$ErrorActionPreference = "Stop"

Write-Host "`n" -NoNewline
Write-Host "╔" + ("═" * 78) + "╗" -ForegroundColor Cyan
Write-Host "║" + (" " * 20) + "KAYA Complete Automation Pipeline" + (" " * 26) + "║" -ForegroundColor Cyan
Write-Host "╚" + ("═" * 78) + "╝" -ForegroundColor Cyan

# Schritt 1: Deployment Pipeline
Write-Host "`n[PHASE 1] Deployment Pipeline" -ForegroundColor Yellow
& "$PSScriptRoot/auto-deploy-pipeline.ps1" -SkipTests:$SkipTests -SkipDeploy:$SkipDeploy -MaxIterations $MaxIterations

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Deployment Pipeline fehlgeschlagen" -ForegroundColor Red
    exit 1
}

# Schritt 2: Warte zusätzliche Zeit für vollständiges Deployment
Write-Host "`n[PHASE 2] Warte auf vollständiges Deployment..." -ForegroundColor Yellow
Start-Sleep -Seconds 60

# Schritt 3: Test Suite
if (-not $SkipTests) {
    Write-Host "`n[PHASE 3] Automated Test Suite" -ForegroundColor Yellow
    & "$PSScriptRoot/auto-test-suite.ps1" -ApiUrl $ApiUrl
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`n⚠️ Einige Tests fehlgeschlagen" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "`n" -NoNewline
Write-Host "╔" + ("═" * 78) + "╗" -ForegroundColor Green
Write-Host "║" + (" " * 30) + "Pipeline erfolgreich!" + (" " * 30) + "║" -ForegroundColor Green
Write-Host "╚" + ("═" * 78) + "╝" -ForegroundColor Green

exit 0

