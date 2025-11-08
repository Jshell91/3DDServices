# Production startup script for 3DDServices (PowerShell)
Write-Host "🚀 Starting 3DDServices in Production Mode..." -ForegroundColor Green

# Set environment variables
$env:NODE_ENV = "production"
$env:PORT = "3000"

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ Error: .env file not found" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Environment file found" -ForegroundColor Green

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install --production
}

# Start the server
Write-Host "🌟 Starting server on port $($env:PORT)..." -ForegroundColor Cyan
Write-Host "📊 Dashboard available at: http://localhost:$($env:PORT)/admin" -ForegroundColor White
Write-Host "🔗 Server info at: http://localhost:$($env:PORT)/api/info" -ForegroundColor White

# Check if PM2 is available
try {
    $pm2Version = pm2 --version 2>$null
    if ($pm2Version) {
        Write-Host "🔄 Using PM2 for process management..." -ForegroundColor Magenta
        pm2 start ecosystem.config.js --env production
    } else {
        throw "PM2 not found"
    }
} catch {
    Write-Host "🎯 Starting with Node.js directly..." -ForegroundColor Blue
    node index.js
}
