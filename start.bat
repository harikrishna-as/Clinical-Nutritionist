@echo off
REM ============================================================
REM  Clinical Nutrition DSS — START BACKEND ONLY
REM  1. Double-click this file
REM  2. Wait for "Clinical Nutrition DSS is running"
REM  3. Open https://frontend-ten-omega-33.vercel.app in your browser
REM ============================================================
setlocal

echo.
echo  ============================================================
echo   Clinical Nutrition DSS — Backend Only
echo   (Frontend is already on Vercel)
echo  ============================================================
echo.

REM --- Check Python ---
python --version >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Python not found. Please install Python 3.12:
  echo         https://www.python.org/downloads/
  pause
  exit /b 1
)

REM --- Use venv if exists, else system python ---
if exist "%~dp0backend\.venv\Scripts\python.exe" (
  set "PY=%~dp0backend\.venv\Scripts\python.exe"
) else (
  set "PY=python"
)

REM --- Install deps if needed ---
if not exist "%~dp0backend\.venv" (
  echo [1/2] Creating virtual environment...
  python -m venv "%~dp0backend\.venv"
  set "PY=%~dp0backend\.venv\Scripts\python.exe"
)

echo [1/2] Installing backend requirements (first run may take a minute)...
call "%PY%" -m pip install -q -r "%~dp0backend\requirements.txt"
if errorlevel 1 echo [WARN] pip warnings — continuing...

echo [2/2] Starting backend...
echo.
echo   Backend API : http://localhost:5000/api/health
echo   Vercel Frontend (open this): https://frontend-ten-omega-33.vercel.app
echo                 Alias          : https://frontend-ten-omega-33.vercel.app
echo   Local Frontend (if built)  : http://localhost:5000/
echo.
echo   KEEP THIS WINDOW OPEN while you use the app.
echo   Press Ctrl+C to stop.
echo.

cd /d "%~dp0backend"
"%PY%" app.py

pause
