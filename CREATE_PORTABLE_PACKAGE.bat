@echo off
REM ========================================
REM MoiBook2025 - Portable Package Creator
REM ========================================

echo.
echo ========================================
echo  MoiBook2025 - Portable Package Creator
echo ========================================
echo.

REM Create portable package folder
set "PACKAGE_FOLDER=MoiBook2025_Portable"
set "PACKAGE_PATH=%~dp0%PACKAGE_FOLDER%"

echo Creating portable package folder...
if exist "%PACKAGE_PATH%" (
    echo Cleaning existing package folder...
    rmdir /s /q "%PACKAGE_PATH%"
)
mkdir "%PACKAGE_PATH%"

echo.
echo Copying build folder...
if exist "%~dp0build" (
    xcopy "%~dp0build" "%PACKAGE_PATH%\build\" /E /I /Y > nul
    echo ✓ Build folder copied
) else (
    echo ✗ Build folder not found! Please run 'npm run build' first.
    pause
    exit /b 1
)

echo.
echo Copying startup file...
copy "%~dp0START_MOIBOOK_APP.bat" "%PACKAGE_PATH%\" > nul
echo ✓ START_MOIBOOK_APP.bat copied

echo.
echo Copying documentation...
if exist "%~dp0INSTALLATION_GUIDE.md" (
    copy "%~dp0INSTALLATION_GUIDE.md" "%PACKAGE_PATH%\" > nul
    echo ✓ INSTALLATION_GUIDE.md copied
)

if exist "%~dp0HOW_TO_START_WITHOUT_VSCODE.md" (
    copy "%~dp0HOW_TO_START_WITHOUT_VSCODE.md" "%PACKAGE_PATH%\" > nul
    echo ✓ HOW_TO_START_WITHOUT_VSCODE.md copied
)

if exist "%~dp0README.md" (
    copy "%~dp0README.md" "%PACKAGE_PATH%\" > nul
    echo ✓ README.md copied
)

echo.
echo Creating README for package...
(
echo MoiBook2025 - Portable Package
echo ==============================
echo.
echo இந்த package-ஐ வேறு laptop-க்கு எளிதாக install செய்யலாம்.
echo.
echo Installation Steps:
echo -------------------
echo 1. முழு 'MoiBook2025_Portable' folder-ஐ copy பண்ணுங்க
echo 2. புதிய laptop-ல் paste பண்ணுங்க ^(Example: C:\MoiBook2025\^)
echo 3. Python install இருக்கா check பண்ணுங்க: python --version
echo 4. START_MOIBOOK_APP.bat double-click பண்ணுங்க
echo 5. Done! Browser-ல் application open ஆகிடும்
echo.
echo Requirements:
echo ------------
echo - Windows 10 or higher
echo - Python 3.7 or higher
echo - 500 MB free space
echo.
echo Documentation:
echo --------------
echo - INSTALLATION_GUIDE.md - Complete installation guide
echo - HOW_TO_START_WITHOUT_VSCODE.md - Tamil startup guide
echo.
echo Created: %date% %time%
) > "%PACKAGE_PATH%\README.txt"
echo ✓ README.txt created

echo.
echo ========================================
echo  Package created successfully! ✓
echo ========================================
echo.
echo Package location:
echo %PACKAGE_PATH%
echo.
echo Package size:
for /f "tokens=3" %%a in ('dir "%PACKAGE_PATH%" ^| find "File(s)"') do echo %%a bytes
echo.
echo ========================================
echo  Next Steps:
echo ========================================
echo.
echo 1. Copy the entire '%PACKAGE_FOLDER%' folder to:
echo    - Pendrive/USB drive
echo    - Or compress as ZIP file
echo.
echo 2. On new laptop:
echo    - Copy folder to C:\MoiBook2025\
echo    - Install Python if not installed
echo    - Double-click START_MOIBOOK_APP.bat
echo.
echo 3. See INSTALLATION_GUIDE.md for detailed instructions
echo.
echo ========================================

REM Open the package folder
explorer "%PACKAGE_PATH%"

pause
