@echo off
REM MoiBook 2025 - Desktop Shortcut Creator
REM Creates a desktop shortcut with custom icon

setlocal enabledelayedexpansion

echo.
echo ========================================
echo   MoiBook 2025 - Desktop Shortcut
echo   Desktop Shortcut Creator
echo ========================================
echo.

REM Get current directory
set "CURRENT_DIR=%~dp0"
set "CURRENT_DIR=%CURRENT_DIR:~0,-1%"

REM Desktop path
set "DESKTOP=%USERPROFILE%\Desktop"

REM Shortcut details
set "SHORTCUT_NAME=MoiBook 2025 - மொய் புத்தகம்.lnk"
set "TARGET_BAT=%CURRENT_DIR%\START_MOIBOOK_APP.bat"
set "ICON_FILE=%CURRENT_DIR%\moibook-icon.ico"

echo Current Directory: %CURRENT_DIR%
echo Desktop Path: %DESKTOP%
echo.

REM Check if START_MOIBOOK_APP.bat exists
if not exist "%TARGET_BAT%" (
    echo [ERROR] START_MOIBOOK_APP.bat file not found!
    echo Please run this script from MoiBook2025 folder.
    pause
    exit /b 1
)

echo [Step 1] Creating shortcut...

REM Create VBS script to create shortcut
set "VBS_FILE=%TEMP%\create_moibook_shortcut.vbs"

echo Set oWS = WScript.CreateObject("WScript.Shell") > "%VBS_FILE%"
echo sLinkFile = "%DESKTOP%\%SHORTCUT_NAME%" >> "%VBS_FILE%"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%VBS_FILE%"
echo oLink.TargetPath = "%TARGET_BAT%" >> "%VBS_FILE%"
echo oLink.WorkingDirectory = "%CURRENT_DIR%" >> "%VBS_FILE%"
echo oLink.Description = "MoiBook 2025 - Tamil Wedding Moi Management System" >> "%VBS_FILE%"
echo oLink.WindowStyle = 1 >> "%VBS_FILE%"

REM Add icon if available
if exist "%ICON_FILE%" (
    echo oLink.IconLocation = "%ICON_FILE%,0" >> "%VBS_FILE%"
    echo [INFO] Custom icon will be applied
) else (
    echo [INFO] No custom icon found, using default
)

echo oLink.Save >> "%VBS_FILE%"

REM Execute VBS script
cscript //nologo "%VBS_FILE%"

REM Check if shortcut was created
if exist "%DESKTOP%\%SHORTCUT_NAME%" (
    echo.
    echo [SUCCESS] Desktop shortcut created successfully!
    echo.
    echo Shortcut Name: %SHORTCUT_NAME%
    echo Location: %DESKTOP%
    echo.
    echo You can now double-click the desktop shortcut to start MoiBook!
    echo.
) else (
    echo.
    echo [ERROR] Failed to create desktop shortcut.
    echo Please try creating manually.
    echo.
)

REM Cleanup
del "%VBS_FILE%" 2>nul

echo.
echo ========================================
echo Press any key to exit...
pause >nul
