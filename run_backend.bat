@echo off
title CapScribe AI - Backend Server (FastAPI)
echo ============================================================
echo   CapScribe AI Studio - Starting Backend Server
echo ============================================================
cd /d "%~dp0\backend"
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
pause
