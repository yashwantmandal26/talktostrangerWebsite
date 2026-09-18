@echo off
title Talk to Strangers India — One-Click Startup
cls
echo ═════════════════════════════════════════════════════════════
echo   Talk to Strangers India — One-Click Startup
echo ═════════════════════════════════════════════════════════════
echo.

:: Ensure we're in the project root
cd /d "%~dp0"

:: Check prerequisites
if not exist server\index.js (
    echo ✗ server\index.js not found.
    echo Please run this from the IndianTalkToStranger project root.
    pause
    exit /b 1
)

if not exist web\package.json (
    echo ✗ web\package.json not found.
    echo Please run this from the project root.
    pause
    exit /b 1
)

:: Ensure .env files exist (create from examples if missing)
if not exist server\.env (
    echo ⚠ server\.env missing — copying from .env.example ...
    if exist server\.env.example copy server\.env.example server\.env
)

if not exist web\.env.local (
    echo ⚠ web\.env.local missing — copying from .env.example ...
    if exist web\.env.example copy web\.env.example web\.env.local
)

echo.
echo ▶ Starting Backend (Node.js + Socket.io) on port 3001 ...
cd server
if not exist node_modules (
    echo   Installing dependencies...
    npm install >nul 2>&1
)
start "" node index.js
cd ..

timeout /t 2 >nul

echo ▶ Starting Frontend (Next.js) on http://localhost:3000 ...
cd web
if not exist node_modules (
    echo   Installing dependencies...
    npm install >nul 2>&1
)
start "" npm run dev

timeout /t 3 >nul

echo.
echo ▶ Opening browser to http://localhost:3000
start "" http://localhost:3000

echo.
echo ══════════════════════════════════════════════════════════════
echo   Talk to Strangers India is now running !
echo   • Open http://localhost:3000 in your browser
echo   • Accept the 18+ age gate
echo   • Click "Start Chatting"
echo ══════════════════════════════════════════════════════════════
pause