@echo off
setlocal
set "PROJECT_DIR=%~dp0"
set "SERVER_BAT=%PROJECT_DIR%START_MOIBOOK_SERVER.bat"
set "DEV_BAT=%PROJECT_DIR%START_MOIBOOK_DEV.bat"
set "DESKTOP=%USERPROFILE%\Desktop"
set "ICON_FILE=%PROJECT_DIR%moibook-icon-64.ico"

powershell -NoProfile -ExecutionPolicy Bypass -Command "$s=(New-Object -ComObject WScript.Shell).CreateShortcut('%DESKTOP%\START_MOIBOOK_SERVER.lnk');$s.TargetPath='%SERVER_BAT%';$s.WorkingDirectory='%PROJECT_DIR%';$s.IconLocation='%ICON_FILE%';$s.Save()"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$s=(New-Object -ComObject WScript.Shell).CreateShortcut('%DESKTOP%\START_MOIBOOK_DEV.lnk');$s.TargetPath='%DEV_BAT%';$s.WorkingDirectory='%PROJECT_DIR%';$s.IconLocation='%ICON_FILE%';$s.Save()"

echo Desktop shortcuts created:
echo - START_MOIBOOK_SERVER
echo - START_MOIBOOK_DEV
pause
