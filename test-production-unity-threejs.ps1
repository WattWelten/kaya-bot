# Production Test - Unity und Three.js Check

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "KAYA Production - Unity & Three.js Check" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$productionUrl = "https://app.kaya.wattweiser.com"
$jsFiles = @(
    "/assets/index-e4122021.js",
    "/assets/AvatarCanvas-c089f132.js",
    "/assets/react-vendor-dd0b204d.js"
)

foreach ($file in $jsFiles) {
    try {
        Write-Host "Checking: $file" -ForegroundColor Yellow
        $response = Invoke-WebRequest -Uri "$productionUrl$file" -Method Get -UseBasicParsing -TimeoutSec 15
        
        $content = $response.Content
        
        # Check for Unity
        if ($content -match 'unity|Unity|createUnityInstance') {
            Write-Host "  ❌ Unity code FOUND" -ForegroundColor Red
        } else {
            Write-Host "  ✅ No Unity code" -ForegroundColor Green
        }
        
        # Check for Three.js
        if ($content -match '@react-three|useFrame|useThree|THREE\.') {
            Write-Host "  ✅ Three.js code FOUND" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  Three.js code NOT FOUND" -ForegroundColor Yellow
        }
        
        Write-Host ""
    } catch {
        Write-Host "  ❌ Error: $_" -ForegroundColor Red
    }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

