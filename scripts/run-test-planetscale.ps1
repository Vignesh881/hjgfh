<#
run-test-planetscale.ps1
Prompts for PlanetScale credentials, sets session env vars, and runs test-planetscale.js in the current PowerShell session.
Usage: .\run-test-planetscale.ps1
Note: This sets env vars only for the current session and does not persist secrets.
#>

Write-Host "This script will run test-planetscale.js using session environment variables." -ForegroundColor Cyan

$dbHost = Read-Host "PlanetScale host (hostname only, e.g. db-xxxx.region.psdb.cloud)"
$user = Read-Host "DB user (PLANETSCALE_USER)"
$password = Read-Host "DB password (input will be visible)"
$database = Read-Host "Database name (PLANETSCALE_DATABASE)"

$sslCa = Read-Host "Path to MYSQL_SSL_CA (press Enter to skip)"
$sslCert = Read-Host "Path to MYSQL_SSL_CERT (press Enter to skip)"
$sslKey = Read-Host "Path to MYSQL_SSL_KEY (press Enter to skip)"

if (-not $dbHost -or -not $user -or -not $password -or -not $database) {
    Write-Error "Missing required values. Aborting."
    exit 1
}

$env:PLANETSCALE_HOST = $dbHost
$env:PLANETSCALE_USER = $user
$env:PLANETSCALE_PASSWORD = $password
$env:PLANETSCALE_DATABASE = $database

if ($sslCa) { $env:MYSQL_SSL_CA = $sslCa }
if ($sslCert) { $env:MYSQL_SSL_CERT = $sslCert }
if ($sslKey) { $env:MYSQL_SSL_KEY = $sslKey }

Write-Host "\nRunning DNS/connectivity checks first..." -ForegroundColor Cyan
# ensure we call the helper from the script directory so it works when invoked from project root
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
try {
    . "$scriptRoot\check-dns.ps1" -HostName $dbHost
} catch {
    Write-Warning "Failed to run check-dns.ps1: $($_.Exception.Message)"
}

Write-Host "\nRunning Node test script: node test-planetscale.js" -ForegroundColor Cyan
node test-planetscale.js

Write-Host "\nTest complete. Environment variables were only set for this session." -ForegroundColor Green
