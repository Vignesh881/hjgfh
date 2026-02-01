@echo off
REM ====================================================
REM MoiBook2025 - Full App Launcher (PlanetScale)
REM Starts API + UI with one double-click
REM ====================================================

echo.
echo ====================================================
echo    MOIBOOK2025 FULL APP (PlanetScale) STARTING...
echo ====================================================
echo.

REM Change to the application directory
cd /d "%~dp0"

REM Basic checks
where npm >nul 2>&1
if errorlevel 1 (
  echo ERROR: npm not found. Please install Node.js (LTS) and retry.
  pause
  exit /b 1
)

if not exist package.json (
  echo ERROR: package.json not found in %CD%
  echo Make sure this .bat is inside the project root folder.
  pause
  exit /b 1
)

echo Checking dependencies...
if not exist node_modules\ (
  echo node_modules not found. Running npm install (first-time setup)...
  npm install
  if errorlevel 1 (
    echo ERROR: npm install failed.
    pause
    exit /b 1
  )
)

echo.
echo NOTE: Ensure server\.env has PLANETSCALE_* values.
echo You can run PLANETSCALE_SETUP.bat to generate it.
echo.
echo Starting API server (port 3001)...
start "MOIBOOK_API" powershell -NoExit -Command "npm run server"

echo Waiting for API to initialize...
timeout /t 5 /nobreak >nul

echo Starting UI (port 3000)...
start "MOIBOOK_UI" powershell -NoExit -Command "npm start"

echo Opening browser...
timeout /t 6 /nobreak >nul
start "" "http://localhost:3000/"

echo.
echo ====================================================
echo   Both servers are running in separate windows.
echo   Close those windows to stop the app.
echo ====================================================
echo.

echo.
echo Press any key to close this launcher window.
pause >nul
