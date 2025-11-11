# KAYA Quick Start - Automated Pipeline
# Einfacher Start für die komplette Automatisierung

Write-Host "`n🚀 KAYA Automated Pipeline" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan

Write-Host "`nVerfügbare Skripte:" -ForegroundColor Yellow
Write-Host "  1. scripts/complete-automation.ps1  - Komplette Pipeline (Deploy + Tests)" -ForegroundColor White
Write-Host "  2. scripts/auto-deploy-pipeline.ps1  - Nur Deployment Pipeline" -ForegroundColor White
Write-Host "  3. scripts/auto-test-suite.ps1       - Nur Tests" -ForegroundColor White

Write-Host "`nBeispiel:" -ForegroundColor Yellow
Write-Host "  .\scripts\complete-automation.ps1" -ForegroundColor Green
Write-Host "  .\scripts\complete-automation.ps1 -SkipTests" -ForegroundColor Green
Write-Host "  .\scripts\auto-test-suite.ps1 -ApiUrl 'https://api.kaya.wattweiser.com'" -ForegroundColor Green

Write-Host "`n" -NoNewline

