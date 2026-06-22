@echo off
REM LearnSphere Quick Start Script for Windows

echo.
echo 🚀 LearnSphere - Setup Script
echo ================================
echo.

REM Check if .env exists
if not exist .env (
    echo 📋 Creating .env file from .env.example...
    copy .env.example .env
    echo ⚠️  Please update .env with your configuration (especially API keys)
)

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed
    pause
    exit /b 1
)

echo ✓ Node.js installed

REM Install dependencies
echo.
echo 📦 Installing dependencies...
call npm run install:all

echo.
echo ✅ Setup complete!
echo.
echo Next steps:
echo 1. Update .env with your OpenAI API key
echo 2. Run 'npm run dev' to start development servers
echo 3. Or run 'docker-compose up --build' for containerized setup
echo.
echo Frontend: http://localhost:3000
echo Backend: http://localhost:5000
echo API Docs: Check Postman_Collection.json
echo.
pause
