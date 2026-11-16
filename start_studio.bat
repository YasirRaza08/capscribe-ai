@echo off
title CapScribe AI - Launcher
echo ============================================================
echo   CapScribe AI - AI Video Captioning SaaS
echo ============================================================
echo Starting Backend (FastAPI on http://127.0.0.1:8000)...
start "CapScribe AI - Backend" cmd /k "run_backend.bat"

timeout /t 3 /nobreak >nul

echo Starting Frontend (Next.js on http://localhost:3000)...
start "CapScribe AI - Frontend" cmd /k "run_frontend.bat"

echo.
echo Both servers have been launched!
echo Open your browser and navigate to: http://localhost:3000
echo Backend API Docs: http://127.0.0.1:8000/docs
echo ============================================================
pause
