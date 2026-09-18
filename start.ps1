# One-click startup for Talk to Strangers India
# Starts both the Node.js WebSocket backend and Next.js frontend

Write-Host "══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   Talk to Strangers India — One-Click Startup" -ForegroundColor Cyan
Write-Host "══════════════════════════════════════════════════════════════" -ForegroundColor Cyan

# Colors
$host.UI.RawUI.ForegroundColor = ConsoleColor.Cyan
$host.UI.RawUI.BackgroundColor = "Black"

function Start-Backend {
    Write-Host "└▶ Starting Backend (Node.js + Socket.io)..." -NoNewline
    $proc = Start-Process powershell -ArgumentList "cd `"`$pwd`\server` && npm install 2>$null; node index.js" -NoNewWindow -PassThru
    # Try to start in current window with job, fallback to new window
    Start-Sleep -Seconds 2
    # Check if port 3001 is listening
    for ($i=0; $i -lt 15; $i++) {
        $health = Invoke-RestMethod -Uri "http://localhost:3001/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($health) {
            Write-Host " ✓ Running on :3001" -ForegroundColor Green
            return $true
        }
        Start-Sleep -Seconds 1
    }
    Write-Host " ✗ Failed to start backend." -ForegroundColor Red
    return $false
}

function Start-Frontend {
    Write-Host "└▶ Starting Frontend (Next.js)..." -NoNewline
    $proc = Start-Process powershell -ArgumentList "cd `"`$pwd`\web` && npm install 2>$null; next dev" -NoNewWindow -PassThru
    Start-Sleep -Seconds 3
    # Open browser to http://localhost:3000
    Write-Host " ✓ Starting Next.js dev server..." -ForegroundColor Yellow
    Start-Sleep -Seconds 2
    Write-Host "└▶ Opening browser at http://localhost:3000" -ForegroundColor Green
    Invoke-Expression "start http://localhost:3000"
}

Write-Host "`nChecking prerequisites..." -NoNewline
if (-not (Test-Path "server\index.js")) {
    Write-Host "✗ server\index.js not found.`n       Please run this from the project root." -ForegroundColor Red
    return
}
if (-not (Test-Path "web\package.json")) {
    Write-Host "✗ web\package.json not found.`n       Please run this from the project root." -ForegroundColor Red
    return
}

# Ensure .env files exist
if (-not (Test-Path "server\.env")) { Write-Host "⚠ server\.env missing — using defaults" -ForegroundColor Yellow }
if (-not (Test-Path "web\.env.local")) { Write-Host "⚠ web\.env.local missing — using defaults" -ForegroundColor Yellow }

Write-Host "`n" -ForegroundColor Cyan

# Start backend in background, frontend in foreground + browser
$backendOK = Start-Backend
if ($backendOK) {
    Start-Frontend
} else {
    Write-Host "Backend failed to start. Check server/ directory and dependencies." -ForegroundColor Red
    Read-Host "Press Enter to exit"
}