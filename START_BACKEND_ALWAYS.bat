@echo off
title CapScribe AI Permanent Backend Engine
echo ========================================================
echo   CapScribe AI - Persistent Auto-Restart Server
echo ========================================================
echo.
cd /d "%~dp0\backend"

:loop
echo [%date% %time%] Starting CapScribe AI Backend on port 8000...
start /b "" "%~dp0\bin\cloudflared.exe" tunnel --url http://127.0.0.1:8000
python -m uvicorn main:app --host 127.0.0.1 --port 8000

echo.
echo [WARNING] Server stopped. Auto-restarting in 3 seconds...
timeout /t 3 /nobreak >nul
goto loop
