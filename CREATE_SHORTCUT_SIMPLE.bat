@echo off
REM MoiBook 2025 - Simple Desktop Shortcut Creator
REM Creates desktop shortcut with instructions for adding icon

setlocal enabledelayedexpansion

cls
echo.
echo ========================================
echo   MoiBook 2025 - Desktop Shortcut
echo   Simple Shortcut Creator
echo ========================================
echo.

REM Get paths
set "CURRENT_DIR=%~dp0"
set "CURRENT_DIR=%CURRENT_DIR:~0,-1%"
set "DESKTOP=%USERPROFILE%\Desktop"
set "SHORTCUT_NAME=MoiBook 2025 - மொய் புத்தகம்.lnk"
set "TARGET_BAT=%CURRENT_DIR%\START_MOIBOOK_APP.bat"

echo [INFO] Current Directory: %CURRENT_DIR%
echo [INFO] Desktop Path: %DESKTOP%
echo.

REM Check if START_MOIBOOK_APP.bat exists
if not exist "%TARGET_BAT%" (
    echo [ERROR] START_MOIBOOK_APP.bat file not found!
    echo Please run this script from MoiBook2025 folder.
    echo.
    pause
    exit /b 1
)

echo [Step 1/2] Creating desktop shortcut...
echo.

REM Create VBS script
set "VBS_FILE=%TEMP%\create_moibook_shortcut.vbs"

(
echo Set oWS = WScript.CreateObject^("WScript.Shell"^)
echo sLinkFile = "%DESKTOP%\%SHORTCUT_NAME%"
echo Set oLink = oWS.CreateShortcut^(sLinkFile^)
echo oLink.TargetPath = "%TARGET_BAT%"
echo oLink.WorkingDirectory = "%CURRENT_DIR%"
echo oLink.Description = "MoiBook 2025 - Tamil Wedding Moi Management System"
echo oLink.WindowStyle = 1
echo oLink.Save
) > "%VBS_FILE%"

REM Execute VBS
cscript //nologo "%VBS_FILE%" 2>nul

REM Cleanup
del "%VBS_FILE%" 2>nul

if exist "%DESKTOP%\%SHORTCUT_NAME%" (
    echo [SUCCESS] Desktop shortcut created!
    echo.
    echo   Shortcut Name: MoiBook 2025 - மொய் புத்தகம்
    echo   Location: Desktop
    echo.
) else (
    echo [ERROR] Failed to create shortcut.
    echo Please try running as Administrator.
    echo.
    pause
    exit /b 1
)

echo [Step 2/2] Icon setup instructions...
echo.
echo ┌─────────────────────────────────────────────────────────────┐
echo │  Icon-ஐ சேர்க்க (High Quality MoiBook Logo):              │
echo └─────────────────────────────────────────────────────────────┘
echo.
echo   1. Open: create_icon.html (double-click)
echo   2. Click: "Download All Icons" button
echo   3. Right-click on desktop shortcut
echo   4. Properties → Change Icon → Browse
echo   5. Select downloaded: moibook-icon-256.png
echo   6. OK → Apply → OK
echo.
echo ┌─────────────────────────────────────────────────────────────┐
echo │  Desktop Shortcut Ready!                                    │
echo └─────────────────────────────────────────────────────────────┘
echo.
echo   Double-click desktop shortcut to start MoiBook! 🚀
echo.

REM Ask if user wants to open icon generator
echo.
set /p OPEN_ICON="Open icon generator now? (Y/N): "
if /i "%OPEN_ICON%"=="Y" (
    if exist "%CURRENT_DIR%\create_icon.html" (
        echo.
        echo Opening icon generator in browser...
        start "" "%CURRENT_DIR%\create_icon.html"
        echo.
        echo Download icon from browser, then:
        echo Right-click shortcut → Properties → Change Icon
        echo.
    )
)

echo.
echo ========================================
echo Press any key to exit...
pause >nul
