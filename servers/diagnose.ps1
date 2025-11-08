# Network diagnostics for 3DDServices connection issues (PowerShell)

Write-Host "🔍 3DDServices Connection Diagnostics" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Check if server is responding
Write-Host "`n1. Checking if server is responding..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://157.230.112.247:3000/health" -TimeoutSec 10
    Write-Host "✅ Server health check OK" -ForegroundColor Green
    Write-Host "   Status: $($health.status)" -ForegroundColor White
    Write-Host "   Uptime: $([math]::Round($health.uptime, 2)) seconds" -ForegroundColor White
} catch {
    Write-Host "❌ Server health check FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n2. Testing API endpoint..." -ForegroundColor Yellow
try {
    $api = Invoke-RestMethod -Uri "http://157.230.112.247:3000/api/info" -TimeoutSec 10
    Write-Host "✅ API endpoint OK" -ForegroundColor Green
    Write-Host "   Server: $($api.server)" -ForegroundColor White
    Write-Host "   Version: $($api.version)" -ForegroundColor White
    Write-Host "   Environment: $($api.environment)" -ForegroundColor White
} catch {
    Write-Host "❌ API endpoint FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n3. Testing static files..." -ForegroundColor Yellow
try {
    $css = Invoke-WebRequest -Uri "http://157.230.112.247:3000/dashboard/styles.css" -Method Head -TimeoutSec 10
    Write-Host "✅ CSS file accessible - Status: $($css.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ CSS file FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

try {
    $js = Invoke-WebRequest -Uri "http://157.230.112.247:3000/dashboard/dashboard.js" -Method Head -TimeoutSec 10
    Write-Host "✅ JS file accessible - Status: $($js.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ JS file FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n4. Checking PM2 status..." -ForegroundColor Yellow
try {
    pm2 status
} catch {
    Write-Host "❌ PM2 status check failed" -ForegroundColor Red
}

Write-Host "`n5. Recent logs..." -ForegroundColor Yellow
try {
    pm2 logs 3ddservices --lines 10
} catch {
    Write-Host "❌ Could not retrieve logs" -ForegroundColor Red
}

Write-Host "`n6. Network connections on port 3000..." -ForegroundColor Yellow
try {
    netstat -an | findstr :3000
} catch {
    Write-Host "❌ Could not check network connections" -ForegroundColor Red
}

Write-Host "`nDiagnostics complete. Check above for any issues." -ForegroundColor Magenta
