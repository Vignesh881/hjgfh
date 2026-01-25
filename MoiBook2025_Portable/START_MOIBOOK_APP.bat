@echo off
REM MoiBook2025 Portable Launcher (static build)
REM Runs a lightweight HTTP server for the built UI and opens the browser.

setlocal
set PORT=3000
set SRCDIR=%~dp0

echo.
echo ====================================================
echo   MOIBOOK2025 PORTABLE - STARTING UI (PORT %PORT%)
echo ====================================================
echo  Path : %SRCDIR%
echo  Build: %SRCDIR%build
echo  URL  : http://localhost:%PORT%/
echo ----------------------------------------------------

REM Validate build folder
if not exist "%SRCDIR%build\index.html" (
	echo [ERROR] build folder not found. Please run "npm run build" in the main project and copy the build/ here.
	pause
	exit /b 1
)

REM Check Python availability
where python >nul 2>nul
if errorlevel 1 (
	echo [ERROR] Python not found. Install Python or run from a machine with Python 3 available.
	pause
	exit /b 1
)

REM Start static server in a minimized window
echo Starting static server... (Ctrl+C in that window to stop)
start "MOIBOOK_STATIC" /min cmd /c "cd /d %SRCDIR% && python -m http.server %PORT% --directory build"

REM Wait a moment for server to come up
ping -n 3 127.0.0.1 >nul

REM Open default browser
start http://localhost:%PORT%/

echo.
echo If you want mobile/tablet/laptop access without Wi-Fi, share your PC hotspot or USB tether; hit http://<your-ip>:%PORT%/ from clients.
echo.
echo Server window title: MOIBOOK_STATIC (close it to stop the app)
echo.
pause

endlocal
  