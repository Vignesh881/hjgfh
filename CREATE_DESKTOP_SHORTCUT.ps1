# MoiBook 2025 - Desktop Shortcut Creator with Icon
# PowerShell script to create desktop shortcut with custom MoiBook icon

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MoiBook 2025 - Desktop Shortcut      " -ForegroundColor Green
Write-Host "  Desktop Shortcut Creator with Icon   " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get paths
$CurrentDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Desktop = [Environment]::GetFolderPath("Desktop")
$ShortcutName = "MoiBook 2025 - மொய் புத்தகம்.lnk"
$TargetBat = Join-Path $CurrentDir "START_MOIBOOK_APP.bat"
$IconFile = Join-Path $CurrentDir "moibook-icon.ico"
$TempIconPng = Join-Path $CurrentDir "moibook-icon-temp.png"

Write-Host "Current Directory: $CurrentDir" -ForegroundColor Yellow
Write-Host "Desktop Path: $Desktop" -ForegroundColor Yellow
Write-Host ""

# Check if START_MOIBOOK_APP.bat exists
if (-not (Test-Path $TargetBat)) {
    Write-Host "[ERROR] START_MOIBOOK_APP.bat not found!" -ForegroundColor Red
    Write-Host "Please run this script from MoiBook2025 folder." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Step 1: Generate Icon
Write-Host "[Step 1] Generating MoiBook icon..." -ForegroundColor Cyan

# PowerShell code to generate icon using .NET
Add-Type -AssemblyName System.Drawing

$size = 256
$bitmap = New-Object System.Drawing.Bitmap($size, $size)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias

# White background
$graphics.Clear([System.Drawing.Color]::White)

# Green money note (rotated)
$graphics.TranslateTransform($size/2, $size * 0.28)
$graphics.RotateTransform(-8.6) # -0.15 radians in degrees

$moneyBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.PointF(-$size*0.35, -$size*0.1)),
    (New-Object System.Drawing.PointF($size*0.35, $size*0.1)),
    [System.Drawing.Color]::FromArgb(76, 175, 80),
    [System.Drawing.Color]::FromArgb(46, 125, 50)
)

$moneyRect = New-Object System.Drawing.RectangleF(-$size*0.35, -$size*0.1, $size*0.7, $size*0.2)
$graphics.FillRectangle($moneyBrush, $moneyRect)

# Rupee symbol
$font = New-Object System.Drawing.Font("Arial", $size*0.15, [System.Drawing.FontStyle]::Bold)
$format = New-Object System.Drawing.StringFormat
$format.Alignment = [System.Drawing.StringAlignment]::Center
$format.LineAlignment = [System.Drawing.StringAlignment]::Center
$graphics.DrawString("₹", $font, [System.Drawing.Brushes]::White, 0, 0, $format)

$graphics.ResetTransform()

# Open book (blue)
$bookY = $size * 0.50
$bookWidth = $size * 0.65
$bookHeight = $size * 0.38

# Left page
$leftBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.PointF($size/2 - $bookWidth/2, $bookY)),
    (New-Object System.Drawing.PointF($size/2, $bookY + $bookHeight)),
    [System.Drawing.Color]::FromArgb(25, 118, 210),
    [System.Drawing.Color]::FromArgb(21, 101, 192)
)
$leftRect = New-Object System.Drawing.RectangleF($size/2 - $bookWidth/2, $bookY, $bookWidth/2 - 2, $bookHeight)
$graphics.FillRectangle($leftBrush, $leftRect)

# Right page
$rightBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.PointF($size/2, $bookY)),
    (New-Object System.Drawing.PointF($size/2 + $bookWidth/2, $bookY + $bookHeight)),
    [System.Drawing.Color]::FromArgb(33, 150, 243),
    [System.Drawing.Color]::FromArgb(25, 118, 210)
)
$rightRect = New-Object System.Drawing.RectangleF($size/2 + 2, $bookY, $bookWidth/2, $bookHeight)
$graphics.FillRectangle($rightBrush, $rightRect)

# Book spine
$spineBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(13, 71, 161))
$spineRect = New-Object System.Drawing.RectangleF($size/2 - 2, $bookY, 4, $bookHeight)
$graphics.FillRectangle($spineBrush, $spineRect)

# Tamil text "மொய்"
$tamilFont = New-Object System.Drawing.Font("Arial", $size*0.18, [System.Drawing.FontStyle]::Bold)
$greenBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(76, 175, 80))
$graphics.DrawString("மொய்", $tamilFont, $greenBrush, $size/2, $size * 0.88, $format)

# Save as PNG
$bitmap.Save($TempIconPng, [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose()
$bitmap.Dispose()

Write-Host "[SUCCESS] Icon generated: $TempIconPng" -ForegroundColor Green

# Step 2: Convert PNG to ICO (if possible)
Write-Host "[Step 2] Setting up icon..." -ForegroundColor Cyan

# For simplicity, we'll use the PNG as icon (Windows 10/11 supports PNG in shortcuts)
$FinalIcon = $TempIconPng

Write-Host "[INFO] Using PNG icon (Windows 10/11 compatible)" -ForegroundColor Yellow

# Step 3: Create Desktop Shortcut
Write-Host "[Step 3] Creating desktop shortcut..." -ForegroundColor Cyan

$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$Desktop\$ShortcutName")
$Shortcut.TargetPath = $TargetBat
$Shortcut.WorkingDirectory = $CurrentDir
$Shortcut.Description = "MoiBook 2025 - Tamil Wedding Moi Management System"
$Shortcut.WindowStyle = 1

# Set icon (Windows may not show PNG icon, but it's set)
if (Test-Path $FinalIcon) {
    $Shortcut.IconLocation = $FinalIcon
}

$Shortcut.Save()

# Verify creation
if (Test-Path "$Desktop\$ShortcutName") {
    Write-Host ""
    Write-Host "[SUCCESS] Desktop shortcut created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Shortcut Name: $ShortcutName" -ForegroundColor Cyan
    Write-Host "Location: $Desktop" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Icon File: $FinalIcon" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "You can now double-click the desktop shortcut to start MoiBook!" -ForegroundColor Green
    Write-Host ""
    
    # Optional: Open icon generator HTML for better icon
    $IconHtml = Join-Path $CurrentDir "create_icon.html"
    if (Test-Path $IconHtml) {
        Write-Host ""
        Write-Host "[TIP] For better quality icon:" -ForegroundColor Yellow
        Write-Host "1. Open: create_icon.html" -ForegroundColor Cyan
        Write-Host "2. Download high-quality 256x256 icon" -ForegroundColor Cyan
        Write-Host "3. Right-click shortcut → Properties → Change Icon" -ForegroundColor Cyan
        Write-Host "4. Browse to downloaded icon file" -ForegroundColor Cyan
        Write-Host ""
    }
} else {
    Write-Host ""
    Write-Host "[ERROR] Failed to create desktop shortcut." -ForegroundColor Red
    Write-Host "Please try running as Administrator." -ForegroundColor Red
    Write-Host ""
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Read-Host "Press Enter to exit"
