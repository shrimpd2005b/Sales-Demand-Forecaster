@echo off
title Sales Demand Forecaster - Setup
color 0A

echo.
echo ================================================
echo   SALES DEMAND FORECASTER - FIRST TIME SETUP
echo ================================================
echo.

REM ── Check Python ──────────────────────────────────
echo [1/7] Checking Python...
python --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo ERROR: Python not found!
    echo Please download and install Python from https://python.org
    echo IMPORTANT: Tick "Add Python to PATH" during install!
    pause
    exit /b 1
)
echo       Python found OK

REM ── Check Node ────────────────────────────────────
echo [2/7] Checking Node.js...
node --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js not found!
    echo Please download and install Node.js from https://nodejs.org
    pause
    exit /b 1
)
echo       Node.js found OK

REM ── Backend setup ─────────────────────────────────
echo [3/7] Setting up Python virtual environment...
cd /d "%~dp0backend"
IF NOT EXIST "venv" (
    python -m venv venv
)
echo       Virtual environment ready

echo [4/7] Installing Python packages (this may take 2-3 minutes)...
call venv\Scripts\activate.bat
pip install -r requirements.txt --quiet
IF %ERRORLEVEL% NEQ 0 (
    echo ERROR: pip install failed. Check your internet connection.
    pause
    exit /b 1
)
echo       Python packages installed

echo [5/7] Generating sales data CSV...
python data_generator.py
echo       sales_data.csv created

REM ── Frontend setup ────────────────────────────────
echo [6/7] Installing Angular CLI and packages (this may take 3-5 minutes)...
cd /d "%~dp0frontend\sales-forecaster"
call npm install --silent
IF %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm install failed. Check your internet connection.
    pause
    exit /b 1
)
echo       Angular packages installed

echo [7/7] Setup complete!
echo.
echo ================================================
echo   SETUP DONE! Now run START_APP.bat to launch
echo ================================================
echo.
pause
