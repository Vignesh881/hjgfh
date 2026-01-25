<#
PowerShell helper: install pscale (user install), start pscale tunnel, and run migrations.
Usage: Run in PowerShell (may need to run as Administrator for some steps).
- This script will:
  1. Ensure `pscale` exists (download user copy if missing).
  2. Ensure `mysql` client is available (will not auto-install without admin).
  3. Start `pscale connect <db> main --port 3306` as a background process.
  4. Wait for the tunnel to become available and execute SQL files from `server/migrations`.

Notes:
- You still must complete `pscale auth login` in the browser when prompted.
- If `mysql` client isn't installed, install it (e.g., Chocolatey: `choco install mysql` as Admin) or use MySQL Workbench CLI.
- The script expects migration files named `server/migrations/00*_*.sql`.
#>

Set-StrictMode -Version Latest

function Write-Info($msg){ Write-Host $msg -ForegroundColor Cyan }
function Write-Success($msg){ Write-Host $msg -ForegroundColor Green }
function Write-Warn($msg){ Write-Host $msg -ForegroundColor Yellow }
function Write-ErrorMsg($msg){ Write-Host $msg -ForegroundColor Red }

# Config
$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path "$repoRoot\.." | Select-Object -ExpandProperty Path
$pscaleUserDir = Join-Path $env:USERPROFILE 'pscale'
$pscaleExe = Join-Path $pscaleUserDir 'pscale.exe'
$dbName = 'moibook2025_db'
$branch = 'main'
$port = 3306
$migrationsDir = Join-Path $repoRoot 'server\migrations'

Write-Info "Repo root: $repoRoot"
Write-Info "Migrations dir: $migrationsDir"

# 1) Ensure pscale exists
$pscaleCmd = Get-Command pscale -ErrorAction SilentlyContinue
if (-not $pscaleCmd) {
    if (-not (Test-Path $pscaleExe)) {
        Write-Info "pscale not found on PATH. Downloading user copy to $pscaleUserDir..."
        if (-not (Test-Path $pscaleUserDir)) { New-Item -ItemType Directory -Path $pscaleUserDir | Out-Null }
        $zipUrl = 'https://github.com/planetscale/cli/releases/latest/download/pscale_windows_amd64.zip'
        $out = Join-Path $env:TEMP 'pscale.zip'
        Invoke-WebRequest -Uri $zipUrl -OutFile $out -UseBasicParsing
        Expand-Archive -Path $out -DestinationPath $pscaleUserDir -Force
        Remove-Item $out -Force
        Write-Info "Downloaded pscale to $pscaleUserDir"
    } else {
        Write-Info "Using existing pscale at $pscaleExe"
    }
    # Add to session PATH
    if ($env:Path -notlike "*$pscaleUserDir*") {
        $env:Path = "$env:Path;$pscaleUserDir"
        Write-Info "Added $pscaleUserDir to PATH for this session."
    }
} else {
    Write-Info "Found pscale at $($pscaleCmd.Path)"
}

# 2) Ensure mysql client exists
$mysqlCmd = Get-Command mysql -ErrorAction SilentlyContinue
if (-not $mysqlCmd) {
    Write-Warn "MySQL client 'mysql' not found on PATH. Please install MySQL client (or MySQL Workbench) and ensure 'mysql' is on PATH."
    Write-Info "Chocolatey example (Admin): choco install mysql -y"
    $proceed = Read-Host "Proceed anyway (the script will still try to open tunnel)? (y/N)"
    if ($proceed -ne 'y') { Write-ErrorMsg "Aborting: install mysql client and re-run."; exit 1 }
}

# 3) pscale auth login (interactive)
Write-Info "Opening browser to authenticate with PlanetScale (pscale auth login). Complete the login and return here."
& pscale auth login
if ($LASTEXITCODE -ne 0) {
    Write-Warn "pscale auth login returned non-zero exit code. Ensure you completed interactive login."
}

# 4) Start tunnel as background process
Write-Info "Starting pscale connect $dbName $branch --port $port"
$connectArgs = "connect $dbName $branch --port $port"
# Start-Process to run in background
$pscalePath = (Get-Command pscale -ErrorAction SilentlyContinue).Path
if (-not $pscalePath) { $pscalePath = $pscaleExe }
$startInfo = @{ FilePath = $pscalePath; ArgumentList = $connectArgs; NoNewWindow = $true; PassThru = $true }
$pscaleProc = Start-Process @startInfo
if (-not $pscaleProc) { Write-ErrorMsg "Failed to start pscale connect."; exit 1 }
Write-Success "Started pscale tunnel (PID $($pscaleProc.Id)). Waiting for local port $port to be available..."

# 5) Wait for MySQL port to respond
$maxWait = 60
$waited = 0
$ready = $false
while ($waited -lt $maxWait) {
    try {
        & mysql -h 127.0.0.1 -P $port -u root -e "SELECT 1;" 2>$null
        if ($LASTEXITCODE -eq 0) { $ready = $true; break }
    } catch { }
    Start-Sleep -Seconds 1
    $waited++
}

if (-not $ready) {
    Write-Warn "Local MySQL did not respond on port $port after $maxWait seconds. Tunnel may not be ready. Check the pscale process output or run 'pscale connect' manually in a separate terminal."
    Write-Info "pscale process PID: $($pscaleProc.Id)"
    exit 1
}
Write-Success "Tunnel ready. Running migrations..."

# 6) Run SQL files from migrations dir in order
$files = Get-ChildItem -Path $migrationsDir -Filter "*.sql" | Sort-Object Name
if (-not $files) { Write-Warn "No migration files found in $migrationsDir"; exit 0 }
foreach ($f in $files) {
    Write-Info "Applying $($f.Name)..."
    try {
        $sql = Get-Content -Path $f.FullName -Raw
        # Write temp file and feed to mysql via cmd redirection (works reliably)
        $tmp = Join-Path $env:TEMP ([IO.Path]::GetRandomFileName() + '.sql')
        Set-Content -Path $tmp -Value $sql -NoNewline -Encoding UTF8
        $cmd = "cmd /c mysql -h 127.0.0.1 -P $port -u root $dbName < `"$tmp`""
        Invoke-Expression $cmd | Out-Null
        Remove-Item $tmp -ErrorAction SilentlyContinue
        Write-Success "$($f.Name) applied."
    } catch {
        Write-ErrorMsg "Failed to apply $($f.Name): $_"
    }
}

Write-Success "Migrations complete. pscale tunnel process is still running (PID $($pscaleProc.Id))."
Write-Info "When finished, stop the tunnel by killing the process or close the terminal where pscale connect is running."
Write-Info "To stop now, press Y and Enter; otherwise press Enter to keep tunnel running."
$stop = Read-Host "Stop the tunnel now? (y/N)"
if ($stop -eq 'y') {
    try { Stop-Process -Id $pscaleProc.Id -Force; Write-Success "pscale tunnel stopped." } catch { Write-Warn "Could not stop process; you may stop it manually." }
}

Write-Success "Done."
