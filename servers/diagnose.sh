#!/bin/bash
# Network diagnostics for 3DDServices connection issues

echo "🔍 3DDServices Connection Diagnostics"
echo "====================================="

# Check if server is running
echo "1. Checking if server is responding..."
curl -s http://157.230.112.247:3000/health && echo "✅ Server health check OK" || echo "❌ Server health check FAILED"

echo ""
echo "2. Testing API endpoint..."
curl -s http://157.230.112.247:3000/api/info && echo "✅ API endpoint OK" || echo "❌ API endpoint FAILED"

echo ""
echo "3. Testing static files..."
curl -s -I http://157.230.112.247:3000/dashboard/styles.css | head -n 5
echo ""
curl -s -I http://157.230.112.247:3000/dashboard/dashboard.js | head -n 5

echo ""
echo "4. Checking PM2 status..."
pm2 status

echo ""
echo "5. Recent logs (last 20 lines)..."
pm2 logs 3ddservices --lines 20

echo ""
echo "6. Server resource usage..."
pm2 monit --no-color | head -n 10

echo ""
echo "7. Network connections..."
netstat -an | grep :3000 | head -n 10

echo ""
echo "Diagnostics complete. Check above for any issues."
