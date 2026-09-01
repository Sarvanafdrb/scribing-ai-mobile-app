# Windows fix for Expo Go "Failed to download remote update"

Write-Host ""
Write-Host "=== Expo Go Windows Fix ===" -ForegroundColor Cyan
Write-Host ""

$profile = Get-NetConnectionProfile | Where-Object { $_.InterfaceAlias -eq "Wi-Fi" -or $_.InterfaceAlias -like "*Wi*" } | Select-Object -First 1
if ($profile) {
  Write-Host "Wi-Fi network: $($profile.Name)" -ForegroundColor Yellow
  Write-Host "Category:      $($profile.NetworkCategory)" -ForegroundColor $(if ($profile.NetworkCategory -eq "Public") { "Red" } else { "Green" })
  if ($profile.NetworkCategory -eq "Public") {
    Write-Host ""
    Write-Host "PROBLEM: Wi-Fi is PUBLIC. Windows blocks phone to PC on Public networks." -ForegroundColor Red
    Write-Host ""
    Write-Host "Fix (pick one):" -ForegroundColor Yellow
    Write-Host "  A) Settings -> Network and Internet -> Wi-Fi -> $($profile.Name) -> Private network ON"
    Write-Host "  B) Or use tunnel: npm run start:tunnel"
    Write-Host ""
  }
} else {
  Write-Host "Could not detect Wi-Fi profile." -ForegroundColor Yellow
}

Write-Host "Also check:" -ForegroundColor Yellow
Write-Host "  - Expo Go updated (SDK 57) from Play Store"
Write-Host "  - Phone mobile data OFF when using LAN"
Write-Host "  - Node.js allowed in Windows Firewall (Private and Public)"
Write-Host ""
Write-Host "Tunnel URL (if npm run start:tunnel is running):" -ForegroundColor Cyan
try {
  $tunnels = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels" -TimeoutSec 2
  $http = $tunnels.tunnels | Where-Object { $_.proto -eq "http" -and $_.public_url -like "*exp.direct*" } | Select-Object -First 1
  if ($http) {
    $hostName = $http.public_url -replace "^https?://", ""
    Write-Host "  exp://$hostName" -ForegroundColor Green
  } else {
    Write-Host "  tunnel not running. Run: npm run start:tunnel" -ForegroundColor Gray
  }
} catch {
  Write-Host "  tunnel not running. Run: npm run start:tunnel" -ForegroundColor Gray
}

Write-Host ""
