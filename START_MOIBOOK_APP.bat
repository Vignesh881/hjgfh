@echo off
setlocal enabledelayedexpansion
REM MoiBook2025 Portable App Launcher (Windows)
REM Prevent multiple Python servers using a lock file

cd /d "%~dp0"

REM Use a lock file to prevent multiple servers
set "LOCKFILE=moibook8080.lock"
if exist "%LOCKFILE%" (
    echo MoiBook2025 server already running (lock file found). Not starting another server.
    start "" "http://localhost:8080"
    goto :end
)

REM Create lock file
echo MoiBook2025 server started > "%LOCKFILE%"

REM Detect Python 3 executable (python or python3) - NO NESTED PARENTHESES
set "PYTHON_CMD="
where python >nul 2>nul
if %errorlevel%==0 goto setpython
where python3 >nul 2>nul
if %errorlevel%==0 goto setpython3
echo ERROR: Python 3.x not found in PATH. Please install Python 3 and try again.
pause
del "%LOCKFILE%"
goto :end

:setpython
set "PYTHON_CMD=python"
goto startserver

:setpython3
set "PYTHON_CMD=python3"
goto startserver

:startserver
REM Start Python HTTP server on port 8080 (requires Python 3.x)
start "MoiBook2025 Server" cmd /c "%PYTHON_CMD% -m http.server 8080 --directory build & del \"%LOCKFILE%\""

REM Wait for server to start
ping 127.0.0.1 -n 3 > nul

REM Open default browser to the app (maximum compatibility)
rundll32 url.dll,FileProtocolHandler http://localhost:8080
if errorlevel 1 goto browser_error

goto :end

:browser_error
echo [ERROR] Unable to open browser automatically. Please open http://localhost:8080 manually.
pause

:end
pause