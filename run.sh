#!/bin/bash

set -e

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  🚀 Starting HackerRank-Style Challenge Platform"
echo "════════════════════════════════════════════════════════════"
echo ""

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
echo "🐳 Starting containers..."
echo ""
$DOCKER_COMPOSE up -d

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  ✨ Challenge Platform is running!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "📍 Access URLs:"
echo "   🌐 Main Application:       http://localhost"
echo "   🔌 Backend API:            http://localhost/api"
echo "   📝 Mock API (example):     http://localhost/api/article_users?page=1"
echo ""
echo "📊 Useful commands:"
echo "   📋 View logs:              $DOCKER_COMPOSE logs -f"
echo "   📋 View backend logs:      $DOCKER_COMPOSE logs -f backend"
echo "   📋 View frontend logs:     $DOCKER_COMPOSE logs -f frontend"
echo "   🛑 Stop all:               $DOCKER_COMPOSE down"
echo "   🔄 Restart:                $DOCKER_COMPOSE restart"
echo "   🗑️  Stop and remove:        $DOCKER_COMPOSE down -v"
echo ""
echo "💡 Tips:"
echo "   • Open http://localhost in your browser"
echo "   • Select an exercise from the dropdown"
echo "   • Monaco Editor with TypeScript IntelliSense in the center panel"
echo "   • Write your solution and click 'Run Tests' to validate"
echo ""
echo "════════════════════════════════════════════════════════════"
echo ""
