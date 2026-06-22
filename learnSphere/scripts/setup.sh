#!/bin/bash

# LearnSphere Quick Start Script

echo "🚀 LearnSphere - Setup Script"
echo "================================"

# Check if .env exists
if [ ! -f .env ]; then
    echo "📋 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please update .env with your configuration (especially API keys)"
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi

echo "✓ Node.js version: $(node -v)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm run install:all

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env with your OpenAI API key"
echo "2. Run 'npm run dev' to start development servers"
echo "3. Or run 'docker-compose up --build' for containerized setup"
echo ""
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:5000"
echo "API Docs: Check Postman_Collection.json"
