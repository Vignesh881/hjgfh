<#
check-dns.ps1
Utility: Resolve DNS and test TCP connectivity for a PlanetScale host.
Usage: .\check-dns.ps1 -Host db-xxxxx.region.psdb.cloud
#>

param(
    [Parameter(Mandatory=$false, Position=0)]
    [string]$HostName
)

if (-not $HostName) {
    $HostName = Read-Host "Enter PlanetScale host (hostname only)"
}

Write-Host "\nDNS resolution (system resolver):" -ForegroundColor Cyan
try {
    Resolve-DnsName $HostName -ErrorAction Stop | Format-Table -AutoSize
} catch {
    Write-Warning "Resolve-DnsName failed: $($_.Exception.Message)"
}

Write-Host "\nDNS resolution (Google 8.8.8.8):" -ForegroundColor Cyan
try {
    Resolve-DnsName $HostName -Server 8.8.8.8 -ErrorAction Stop | Format-Table -AutoSize
} catch {
    Write-Warning "Resolve-DnsName (8.8.8.8) failed: $($_.Exception.Message)"
}

Write-Host "\nnslookup via 8.8.8.8:" -ForegroundColor Cyan
nslookup $HostName 8.8.8.8

Write-Host "\nTCP connectivity test to port 3306:" -ForegroundColor Cyan
Test-NetConnection -ComputerName $HostName -Port 3306 -InformationLevel Detailed

Write-Host "\nIf DNS fails, ensure you pasted the exact host from the PlanetScale 'Connect' panel." -ForegroundColor Yellow
