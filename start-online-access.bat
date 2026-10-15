@echo off
title Smart Expense Tracker AI - Local Development Tunnel
echo =====================================================================
echo    Permanent 24/7 Cloud URL:
echo    👉 https://smart-expense-tracker-ai-production.up.railway.app
echo.
echo    Temporary local tunnel (active only while this window stays open):
echo =====================================================================
echo.
echo Starting local development server on port 5000...
echo.
cd /d "%~dp0"

echo [1/2] Starting Backend Server on port 5000...
start /b node Backend/server.js

timeout /t 2 /nobreak >nul

echo [2/2] Connecting to Cloudflare Global Edge Network...
echo ---------------------------------------------------------------------
echo Look for your temporary trycloudflare.com link below:
echo ---------------------------------------------------------------------
echo.

npx.cmd -y cloudflared tunnel --url http://127.0.0.1:5000
pause
