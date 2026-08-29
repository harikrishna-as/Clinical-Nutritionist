@echo off
REM ============================================================
REM  Clinical Nutrition DSS — Backend Only (for Vercel Frontend)
REM  Run this BEFORE opening https://frontend-ten-omega-33.vercel.app
REM  The frontend on Vercel will then use this backend if you set
REM  VITE_API_BASE, otherwise it uses its built-in mock API.
REM ============================================================
setlocal EnableDelayedExpansion

echo.
echo  ============================================================
echo   Clinical Nutrition DSS — Backend (Separate)
echo  ============================================================
echo.

REM --- Check Python ---
python --version >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Python not found. Install Python 3.12 from https://python.org
  pause
  exit /b 1
)

REM --- Install backend deps (first run only) ---
if not exist "%~dp0backend\.venv" (
  echo [1/3] Creating virtual env...
  python -m venv "%~dp0backend\.venv"
)
echo [1/3] Checking backend dependencies...
call "%~dp0backend\.venv\Scripts\activate.bat" 2>nul
pip --version >nul 2>&1
if errorlevel 1 set "PIP=python -m pip" else set "PIP=pip"
%PIP% install -q -r "%~dp0backend\requirements.txt"
if errorlevel 1 (
  echo [WARN] pip install had warnings, continuing...
)

echo [2/3] Checking frontend build (for local fallback)...
if not exist "%~dp0frontend\dist\index.html" (
  echo        Frontend dist not found — Vercel frontend will be used.
  echo        To build locally: cd frontend ^&^& npm run build
)

echo [3/3] Starting Flask backend...
echo.
echo   Local API  : http://localhost:5000/api/health
echo   Local App  : http://localhost:5000/  (if frontend/dist exists)
echo   Vercel App : https://frontend-ten-omega-33.vercel.app
echo.
echo   Keep this window OPEN while you use the Vercel frontend.
echo   Press Ctrl+C to stop the backend.
echo.

REM --- Run backend (serves API + frontend/dist if present) ---
cd /d "%~dp0backend"
if exist "%~dp0backend\.venv\Scripts\python.exe" (
  "%~dp0backend\.venv\Scripts\python.exe" app.py
) else (
  python app.py
)

pause
