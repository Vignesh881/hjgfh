@echo off
REM ====================================================
REM MoiBook2025 - Development Server Launcher
REM Double-click this file to start in development mode
REM ====================================================

echo.
echo ====================================================
echo    MOIBOOK2025 DEVELOPMENT MODE STARTING...
echo ====================================================
echo.

REM Change to the application directory
cd /d "%~dp0"

echo Starting development server...
echo This may take 30-60 seconds to compile...
echo.
echo Application will open automatically in your browser.
echo.
echo.
echo ====================================================
echo   Press Ctrl+C to stop the server
echo ====================================================
echo.

REM Start npm development server
npm start

pause
