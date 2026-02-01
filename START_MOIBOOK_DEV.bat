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
echo Application will open in FULL SCREEN mode.
echo.
echo.
echo ====================================================
echo   Press Ctrl+C to stop the server
echo ====================================================
echo.

REM Start npm development server (disable CRA auto-open)
set "BROWSER=none"
start "MOIBOOK_DEV" cmd /k "npm start"

REM Wait a bit for the dev server to compile
timeout /t 10 /nobreak >nul

set "APP_URL=http://localhost:3000"
REM Open in fullscreen (prefer Edge, then Chrome)
set "EDGE_EXE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE_EXE%" set "EDGE_EXE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
set "CHROME_EXE=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME_EXE%" set "CHROME_EXE=%ProgramFiles%\Google\Chrome\Application\chrome.exe"

if exist "%EDGE_EXE%" (
	powershell -NoProfile -ExecutionPolicy Bypass -Command "$p=Start-Process -FilePath '%EDGE_EXE%' -ArgumentList '--new-window','%APP_URL%' -PassThru; Start-Sleep -Seconds 2; $ws=New-Object -ComObject WScript.Shell; $null=$ws.AppActivate($p.Id); Start-Sleep -Milliseconds 400; Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('{F11}')"
) else if exist "%CHROME_EXE%" (
	powershell -NoProfile -ExecutionPolicy Bypass -Command "$p=Start-Process -FilePath '%CHROME_EXE%' -ArgumentList '--new-window','%APP_URL%' -PassThru; Start-Sleep -Seconds 2; $ws=New-Object -ComObject WScript.Shell; $null=$ws.AppActivate($p.Id); Start-Sleep -Milliseconds 400; Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('{F11}')"
) else (
	start "" "%APP_URL%"
)

pause
