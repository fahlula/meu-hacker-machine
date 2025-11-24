#!/bin/bash

set -e

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  🌐 Starting Challenge Platform with ngrok Hosting"
echo "════════════════════════════════════════════════════════════"
echo ""

# Check ngrok
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok not found. Please install ngrok."
    echo "   Visit: https://ngrok.com/download"
    exit 1
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker."
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ docker-compose not found. Please install docker-compose."
    exit 1
fi

# Detect docker compose command
if docker compose version &> /dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

echo "📦 Building Docker images in parallel..."
echo ""
$DOCKER_COMPOSE build --parallel

echo ""
echo "🐳 Starting containers (without PUBLIC_URL, will set it after ngrok starts)..."
echo ""
$DOCKER_COMPOSE up -d

echo ""
echo "⏳ Waiting for services to start..."
sleep 5

echo ""
echo "🌐 Starting ngrok tunnel..."
echo ""

# Start ngrok in background
ngrok http 80 --log=stdout > ngrok.log &
NGROK_PID=$!

# Wait for ngrok to start
sleep 3

# Get ngrok public URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | grep -o 'https://[^"]*' | head -1)

if [ -z "$NGROK_URL" ]; then
    echo "❌ Failed to get ngrok URL. Check if ngrok is running correctly."
    echo "   View ngrok logs: tail -f ngrok.log"
    exit 1
fi

echo ""
echo "🔄 Restarting backend and frontend with PUBLIC_URL=$NGROK_URL..."
echo ""

# Restart backend with PUBLIC_URL environment variable
$DOCKER_COMPOSE stop backend frontend
PUBLIC_URL=$NGROK_URL $DOCKER_COMPOSE up -d backend frontend

sleep 5

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  ✨ Challenge Platform is hosted publicly!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "📍 Public Access URL:"
echo "   🌐 Main Application:       $NGROK_URL"
echo "   🔌 Backend API:            $NGROK_URL/api"
echo "   📝 Mock API (example):     $NGROK_URL/api/article_users?page=1"
echo ""
echo "📍 Local Access URLs:"
echo "   🌐 Main Application:       http://localhost"
echo ""
echo "⚠️  IMPORTANT: The ngrok URL will be used by test runner for API calls"
echo ""
echo "📊 Useful commands:"
echo "   📋 View ngrok dashboard:   http://localhost:4040"
echo "   📋 View Docker logs:       $DOCKER_COMPOSE logs -f"
echo "   📋 View ngrok logs:        tail -f ngrok.log"
echo "   🛑 Stop all:               ./stop_host.sh"
echo ""
echo "💡 Tips:"
echo "   • Share the ngrok URL with others for remote access"
echo "   • ngrok tunnel will persist as long as this script runs"
echo "   • Press Ctrl+C to stop ngrok and keep Docker running"
echo "   • Use ./stop_host.sh to stop everything"
echo ""
echo "════════════════════════════════════════════════════════════"
echo ""
echo "ngrok is running... Press Ctrl+C to stop the tunnel"
echo ""

# Wait for ngrok process
wait $NGROK_PID
