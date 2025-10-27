# Production Test - Check CURRENT deployed build

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "KAYA Production - Current Build Check" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$productionUrl = "https://app.kaya.wattweiser.com"

try {
    Write-Host "Fetching Production URL..." -ForegroundColor Yellow
    $response = Invoke-WebRequest -Uri $productionUrl -Method Get -UseBasicParsing -TimeoutSec 10
    
    Write-Host "  HTTP Status: $($response.StatusCode)" -ForegroundColor Green
    
    $content = $response.Content
    
    # Extract current hash
    if ($content -match 'index-([0-9a-f]{8})\.js') {
        $currentHash = $matches[1]
        Write-Host "`n  📦 Current Hash: $currentHash" -ForegroundColor Cyan
        
        # Extract all JS references
        $jsFiles = [regex]::Matches($content, 'index-[0-9a-f]{8}\.js')
        Write-Host "`n  📁 JS Files found:" -ForegroundColor Cyan
        foreach ($file in $jsFiles) {
            Write-Host "    - $($file.Value)" -ForegroundColor Gray
        }
    } else {
        Write-Host "  ⚠️  No hash found in HTML" -ForegroundColor Yellow
    }
    
    # Check Unity presence
    Write-Host "`n  🔍 Checking for Unity code..." -ForegroundColor Cyan
    if ($content -match 'unity|createUnityInstance') {
        Write-Host "    ⚠️  Unity code PRESENT" -ForegroundColor Red
    } else {
        Write-Host "    ✅ No Unity code found" -ForegroundColor Green
    }
    
    # Check Three.js presence
    Write-Host "`n  🔍 Checking for Three.js code..." -ForegroundColor Cyan
    if ($content -match '@react-three|useFrame|useThree') {
        Write-Host "    ✅ Three.js code PRESENT" -ForegroundColor Green
    } else {
        Write-Host "    ⚠️  Three.js code NOT FOUND" -ForegroundColor Red
    }
    
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "Test complete" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    
} catch {
    Write-Host "`n  ❌ Error: $_" -ForegroundColor Red
}

