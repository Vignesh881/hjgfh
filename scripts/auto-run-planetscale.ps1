<#
auto-run-planetscale.ps1
Reads server/.env (KEY=VALUE lines), sets session env vars, runs DNS check and Node test-planetscale.js non-interactively.
Usage: .\scripts\auto-run-planetscale.ps1
Note: Do NOT commit real secrets. Put secrets in server/.env only on your machine.
#>

$envFile = Join-Path (Get-Location) 'server\.env'
if (-not (Test-Path $envFile)) {
    Write-Error "server/.env not found. Copy server/.env.sample to server/.env and fill in values first."
    exit 1
}

Write-Host "Loading environment variables from $envFile" -ForegroundColor Cyan
Get-Content $envFile | ForEach-Object {
    $_ = $_.Trim()
    if ($_.Length -eq 0) { return }
    if ($_.StartsWith('#')) { return }
    $parts = $_ -split '=', 2
    if ($parts.Count -ne 2) { return }
    $key = $parts[0].Trim()
    $value = $parts[1].Trim()
    if ($value.StartsWith('"') -and $value.EndsWith('"')) {
        $value = $value.Trim('"')
    }
    Write-Host "Setting $key" -ForegroundColor DarkGray
    Set-Item -Path Env:\$key -Value $value
}

# Require PLANETSCALE_HOST or MYSQL_HOST
# Determine db host correctly (don't use boolean -or)
if ($env:PLANETSCALE_HOST -and $env:PLANETSCALE_HOST.Trim().Length -gt 0) {
    $dbHost = $env:PLANETSCALE_HOST
} elseif ($env:MYSQL_HOST -and $env:MYSQL_HOST.Trim().Length -gt 0) {
    $dbHost = $env:MYSQL_HOST
} else {
    Write-Error "No PLANETSCALE_HOST or MYSQL_HOST found in server/.env"
    exit 1
}

Write-Host "Using host: $dbHost" -ForegroundColor Yellow
Write-Host "Running DNS check for $dbHost..." -ForegroundColor Cyan
# Resolve script root so helper scripts are called reliably regardless of current working directory
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
try {
    . "$scriptRoot\check-dns.ps1" -HostName $dbHost
} catch {
    Write-Warning "Failed to run check-dns.ps1: $($_.Exception.Message)"
}

Write-Host "Running Node test script: node test-planetscale.js" -ForegroundColor Cyan
try {
    $repoRoot = Resolve-Path (Join-Path $scriptRoot '..')
    & node (Join-Path $repoRoot 'test-planetscale.js')
} catch {
    Write-Warning "Failed to run node test script: $($_.Exception.Message)"
}

Write-Host "Done. Environment variables were set only for this session." -ForegroundColor Green
