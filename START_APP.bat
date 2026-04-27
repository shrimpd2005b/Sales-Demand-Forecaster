@echo off
title Sales Demand Forecaster - Launcher
color 0A

echo.
echo ================================================
echo   SALES DEMAND FORECASTER - STARTING...
echo ================================================
echo.
echo Starting Flask backend on http://localhost:5000
echo Starting Angular frontend on http://localhost:4200
echo.
echo Two windows will open - do NOT close them.
echo Your browser will open automatically in ~15 seconds.
echo.

REM ── Start Flask in a new window ───────────────────
start "Flask Backend (DO NOT CLOSE)" cmd /k "cd /d "%~dp0backend" && call venv\Scripts\activate.bat && python app.py"

REM ── Wait 4 seconds for Flask to boot ─────────────
timeout /t 4 /nobreak >nul

REM ── Start Angular in a new window ────────────────
start "Angular Frontend (DO NOT CLOSE)" cmd /k "cd /d "%~dp0frontend\sales-forecaster" && ng serve --open"

echo Both servers are starting...
echo.
echo If your browser doesn't open automatically,
echo go to: http://localhost:4200
echo.
echo Press any key to close this launcher window.
pause >nul
