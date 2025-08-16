# Run VR3DDSOCIALWORLDServer with parameters
# ===============================================
# Manual execution (uncomment to use):
# ./VR3DDSOCIALWORLDServer.exe 01_MAINWORLD -port=8080 -log
# ./VR3DDSOCIALWORLDServer.exe ART_EXHIBITIONSARTLOBBY -port=8081 -log
# ./VR3DDSOCIALWORLDServer.exe ART_EXHIBITIONS_AIArtists -port=8082 -log
# ./VR3DDSOCIALWORLDServer.exe ART_EXHIBITIONS_STRANGEWORLDS_ -port=8083 -log
# ./VR3DDSOCIALWORLDServer.exe ART_EXHIBITIONS_4Deya -port=8084 -log
# ./VR3DDSOCIALWORLDServer.exe ART_EXHIBITIONS_SHEisAI -port=8085 -log

# ===============================================
# AUTOMATIC STARTUP SCRIPT (10 seconds delay between each server)
# ===============================================
Write-Host "🚀 Starting VR3DDSOCIALWORLD Servers..." -ForegroundColor Green
Write-Host "⏱️  10 seconds delay between each server startup" -ForegroundColor Yellow
Write-Host "❌ Excluding: ART_EXHIBITIONS_4Deya" -ForegroundColor Red
Write-Host ""

# Server 1: Main World
Write-Host "[1/5] 🌍 Starting 01_MAINWORLD on port 8080..." -ForegroundColor Cyan
Start-Process -FilePath ".\VR3DDSOCIALWORLDServer.exe" -ArgumentList "01_MAINWORLD", "-port=8080", "-log" -PassThru
Write-Host "✅ 01_MAINWORLD started successfully!" -ForegroundColor Green
Start-Sleep -Seconds 10

# Server 2: Art Exhibitions Lobby
Write-Host "[2/5] 🎨 Starting ART_EXHIBITIONSARTLOBBY on port 8081..." -ForegroundColor Cyan
Start-Process -FilePath ".\VR3DDSOCIALWORLDServer.exe" -ArgumentList "ART_EXHIBITIONSARTLOBBY", "-port=8081", "-log" -PassThru
Write-Host "✅ ART_EXHIBITIONSARTLOBBY started successfully!" -ForegroundColor Green
Start-Sleep -Seconds 10

# Server 3: AI Artists Exhibition
Write-Host "[3/5] 🤖 Starting ART_EXHIBITIONS_AIArtists on port 8082..." -ForegroundColor Cyan
Start-Process -FilePath ".\VR3DDSOCIALWORLDServer.exe" -ArgumentList "ART_EXHIBITIONS_AIArtists", "-port=8082", "-log" -PassThru
Write-Host "✅ ART_EXHIBITIONS_AIArtists started successfully!" -ForegroundColor Green
Start-Sleep -Seconds 10

# Server 4: Strange Worlds Exhibition
Write-Host "[4/5] 🌌 Starting ART_EXHIBITIONS_STRANGEWORLDS_ on port 8083..." -ForegroundColor Cyan
Start-Process -FilePath ".\VR3DDSOCIALWORLDServer.exe" -ArgumentList "ART_EXHIBITIONS_STRANGEWORLDS_", "-port=8083", "-log" -PassThru
Write-Host "✅ ART_EXHIBITIONS_STRANGEWORLDS_ started successfully!" -ForegroundColor Green
Start-Sleep -Seconds 10

# Server 5: SHE is AI Exhibition
Write-Host "[5/5] 🎭 Starting ART_EXHIBITIONS_SHEisAI on port 8085..." -ForegroundColor Cyan
Start-Process -FilePath ".\VR3DDSOCIALWORLDServer.exe" -ArgumentList "ART_EXHIBITIONS_SHEisAI", "-port=8085", "-log" -PassThru
Write-Host "✅ ART_EXHIBITIONS_SHEisAI started successfully!" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 All servers started successfully!" -ForegroundColor Green
Write-Host "📊 Active servers:" -ForegroundColor Yellow
Write-Host "   • 01_MAINWORLD (Port 8080)" -ForegroundColor White
Write-Host "   • ART_EXHIBITIONSARTLOBBY (Port 8081)" -ForegroundColor White
Write-Host "   • ART_EXHIBITIONS_AIArtists (Port 8082)" -ForegroundColor White
Write-Host "   • ART_EXHIBITIONS_STRANGEWORLDS_ (Port 8083)" -ForegroundColor White
Write-Host "   • ART_EXHIBITIONS_SHEisAI (Port 8085)" -ForegroundColor White
Write-Host ""
Write-Host "💡 Tip: Use 'Get-Process VR3DDSOCIALWORLDServer' to check running servers" -ForegroundColor Magenta

# IDEAS FOR FUTURE IMPROVEMENTS
# =============================
# 1. Web admin panel for stats, likes, users, and logs.
# 2. Notifications/webhooks for events (email, Discord, Slack).
# 3. User authentication system (OAuth, JWT).
# 4. Activity history and analytics (graphs, daily likes, active users).
# 5. Automated tests and CI/CD integration.
# 6. Interactive API documentation (Swagger/OpenAPI).
# 7. Internationalization (multi-language support).
# 8. Monitoring and alerts (Prometheus, Grafana, cloud services).
# 9. Advanced security audit and access control.
# 10. Containerized deployment (Docker, Kubernetes, cloud).
