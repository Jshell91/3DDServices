#!/bin/bash
# Production startup script for 3DDServices

echo "🚀 Starting 3DDServices in Production Mode..."

# Set environment variables
export NODE_ENV=production
export PORT=3000

# Check if required environment variables are set
if [ -z "$API_KEY" ]; then
    echo "❌ Error: API_KEY not set in environment"
    exit 1
fi

if [ -z "$PGHOST" ]; then
    echo "❌ Error: PostgreSQL configuration missing"
    exit 1
fi

echo "✅ Environment variables validated"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --production
fi

# Start the server
echo "🌟 Starting server on port $PORT..."
echo "📊 Dashboard available at: http://localhost:$PORT/admin"
echo "🔗 Server info at: http://localhost:$PORT/api/info"

# Use PM2 if available, otherwise use node directly
if command -v pm2 &> /dev/null; then
    echo "🔄 Using PM2 for process management..."
    pm2 start ecosystem.config.js --env production
else
    echo "🎯 Starting with Node.js directly..."
    node index.js
fi
