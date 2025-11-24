#!/bin/bash

set -e

echo ""
echo "🛑 Stopping Challenge Platform and ngrok..."
echo ""

# Detect docker compose command
if docker compose version &> /dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# Stop ngrok
if pgrep -f "ngrok http" > /dev/null; then
    echo "Stopping ngrok..."
    pkill -f "ngrok http"
fi

# Stop Docker containers
echo "Stopping Docker containers..."
$DOCKER_COMPOSE down

echo ""
echo "✅ All services stopped"
echo ""
