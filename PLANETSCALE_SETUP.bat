@echo off
REM ====================================================
REM MoiBook2025 - PlanetScale Setup Helper Script
REM This script helps configure PlanetScale for MoiBook2025
REM ====================================================

echo.
echo ====================================================
echo    MOIBOOK2025 - PLANETSCALE SETUP HELPER
echo ====================================================
echo.

REM Check if .env file exists
if not exist "server\.env" (
    echo [INFO] Creating server/.env file...
    echo # MoiBook2025 Environment Variables > server\.env
    echo # Database Configuration >> server\.env
    echo MYSQL_HOST=localhost >> server\.env
    echo MYSQL_USER=root >> server\.env
    echo MYSQL_PASSWORD= >> server\.env
    echo MYSQL_DATABASE=moibook_db >> server\.env
    echo MYSQL_PORT=3306 >> server\.env
    echo. >> server\.env
    echo # PlanetScale Configuration (Update these values) >> server\.env
    echo # PLANETSCALE_HOST=your-database-host.psdb.cloud >> server\.env
    echo # PLANETSCALE_USER=your-username >> server\.env
    echo # PLANETSCALE_PASSWORD=your-password >> server\.env
    echo # PLANETSCALE_DATABASE=moibook2025_db >> server\.env
    echo. >> server\.env
    echo # SSL Configuration (for PlanetScale) >> server\.env
    echo # MYSQL_SSL_CA= >> server\.env
    echo # MYSQL_SSL_CERT= >> server\.env
    echo # MYSQL_SSL_KEY= >> server\.env
    echo.
    echo [SUCCESS] server/.env file created!
    echo [ACTION] Please update the PlanetScale values in server/.env
) else (
    echo [INFO] server/.env file already exists
)

echo.
echo ====================================================
echo    PLANETSCALE CONFIGURATION STEPS
echo ====================================================
echo.
echo 1. Go to https://planetscale.com and create account
echo 2. Create database named 'moibook2025_db'
echo 3. Get connection credentials from dashboard
echo 4. Update server/.env with your PlanetScale details
echo 5. Run database schema on PlanetScale console
echo.
echo ====================================================
echo    IMPORTANT FILES
echo ====================================================
echo.
echo - PLANETSCALE_SETUP_GUIDE_TAMIL.md (தமிழ் வழிகாட்டி)
echo - PLANETSCALE_SETUP_GUIDE_ENGLISH.md (English Guide)
echo - database/mysql_schema.sql (Database Schema)
echo - server/.env (Environment Configuration)
echo.
echo ====================================================
echo    NEXT STEPS
echo ====================================================
echo.
echo 1. Follow the setup guide
echo 2. Update server/.env with PlanetScale credentials
echo 3. Run: npm run server (to test connection)
echo 4. Run: npm start (to test application)
echo.

pause