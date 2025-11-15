#!/bin/bash
set -e

echo "🐳 Life Tracker Docker Setup"
echo "=============================="
echo ""

# Check if Docker is running
echo "Checking Docker..."
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running!"
    echo ""
    echo "Please start Docker:"
    echo "  • If using Rancher Desktop: Open Rancher Desktop app"
    echo "  • If using Docker Desktop: Open Docker Desktop app"
    echo "  Wait for it to fully start, then run this script again"
    echo ""
    echo "To restart Rancher Desktop Docker:"
    echo "  rdctl shutdown && rdctl start --container-engine moby"
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Check .env file
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from .env.example..."
    cp .env.example .env
    echo "📝 Please edit .env and add your GEMINI_API_KEY"
    echo ""
fi

# Show current config
echo "Current configuration:"
echo "---------------------"
if grep -q "PLACEHOLDER" .env 2>/dev/null; then
    echo "⚠️  GEMINI_API_KEY: Not configured (using PLACEHOLDER)"
    echo "   Get your key from: https://aistudio.google.com/apikey"
else
    echo "✅ GEMINI_API_KEY: Configured"
fi

if grep -q "^DATABASE_URL=" .env 2>/dev/null && ! grep -q "^#.*DATABASE_URL=" .env; then
    echo "✅ DATABASE_URL: Configured (Cloud Sync enabled)"
else
    echo "ℹ️  DATABASE_URL: Not configured (Cloud Sync disabled - optional)"
    echo "   Get it from: https://neon.tech"
fi
echo ""

# Build and start
echo "🚀 Building and starting containers..."
echo "This may take a few minutes on first run..."
echo ""

docker compose up --build
