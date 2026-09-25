# Windows fix for Expo Go "Failed to download remote update" + API reachability

Write-Host ""
Write-Host "=== Scribing AI - phone + API diagnose ===" -ForegroundColor Cyan
Write-Host ""

$profile = Get-NetConnectionProfile | Where-Object { $_.InterfaceAlias -eq "Wi-Fi" -or $_.InterfaceAlias -like "*Wi*" } | Select-Object -First 1
if ($profile) {
  Write-Host "Wi-Fi network: $($profile.Name)" -ForegroundColor Yellow
  Write-Host "Category:      $($profile.NetworkCategory)" -ForegroundColor $(if ($profile.NetworkCategory -eq "Public") { "Red" } else { "Green" })
  if ($profile.NetworkCategory -eq "Public") {
    Write-Host ""
    Write-Host "PROBLEM: Wi-Fi is PUBLIC. Windows blocks phone -> PC on Public networks." -ForegroundColor Red
    Write-Host ""
    Write-Host "Fix (pick one):" -ForegroundColor Yellow
    Write-Host '  A) Settings: Wi-Fi -> your network -> Private network ON'
    Write-Host '  B) Tunnel loads the app only; login still needs API on LAN - set Wi-Fi Private or allow port 5000'
    Write-Host ""
  }
} else {
  Write-Host "Could not detect Wi-Fi profile." -ForegroundColor Yellow
}

$lanAddr = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
  Where-Object { $_.IPAddress -like "192.168.*" -and $_.PrefixOrigin -ne "WellKnown" } |
  Select-Object -First 1
$lanIp = if ($lanAddr) { $lanAddr.IPAddress } else { $null }

if ($lanIp) {
  Write-Host "PC LAN IP:     $lanIp" -ForegroundColor Green
} else {
  Write-Host "PC LAN IP:     (not found - are you on Wi-Fi?)" -ForegroundColor Yellow
}

$envPath = Join-Path (Split-Path $PSScriptRoot -Parent) ".env"
$apiUrl = $null
if (Test-Path $envPath) {
  $line = Get-Content $envPath | Where-Object { $_ -match "^EXPO_PUBLIC_API_URL=" } | Select-Object -First 1
  if ($line) {
    $apiUrl = ($line -split "=", 2)[1].Trim()
    Write-Host ".env API URL:  $apiUrl" -ForegroundColor Cyan
    if ($lanIp -and $apiUrl -notmatch [regex]::Escape($lanIp)) {
      Write-Host "  MISMATCH: .env IP is not your current Wi-Fi IP. Run: npm run sync:lan" -ForegroundColor Red
    }
  }
}

$listening = netstat -ano | Select-String ":5000\s+.*LISTENING"
if ($listening) {
  Write-Host "Backend:       listening on port 5000" -ForegroundColor Green
} else {
  Write-Host "Backend:       NOT listening on 5000 - start scribing-ai-api" -ForegroundColor Red
}

if ($lanIp) {
  $health = "http://${lanIp}:5000/health"
  Write-Host ""
  Write-Host "Testing $health ..." -ForegroundColor Cyan
  try {
    $r = Invoke-WebRequest -Uri $health -UseBasicParsing -TimeoutSec 5
    Write-Host "  OK ($($r.StatusCode)): $($r.Content)" -ForegroundColor Green
    Write-Host ""
    Write-Host "On your PHONE browser, open the same URL. If it fails, Windows Firewall is blocking the phone." -ForegroundColor Yellow
    Write-Host "  Admin PowerShell: New-NetFirewallRule -DisplayName Scribing-API-5000 -Direction Inbound -Protocol TCP -LocalPort 5000 -Action Allow -Profile Private" -ForegroundColor Gray
  } catch {
    Write-Host "  FAILED from this PC: $($_.Exception.Message)" -ForegroundColor Red
  }
}

Write-Host ""
Write-Host "Also check:" -ForegroundColor Yellow
Write-Host "  - Phone on same Wi-Fi, mobile data OFF"
Write-Host "  - After .env change: stop Expo, npm start (uses --clear)"
Write-Host "  - Login screen shows API: ... under Sign In (dev build)"
Write-Host ""
Write-Host "Tunnel URL (Metro only - does NOT proxy API):" -ForegroundColor Cyan
try {
  $tunnels = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels" -TimeoutSec 2
  $http = $tunnels.tunnels | Where-Object { $_.proto -eq "http" -and $_.public_url -like "*exp.direct*" } | Select-Object -First 1
  if ($http) {
    $hostName = $http.public_url -replace "^https?://", ""
    Write-Host "  exp://$hostName" -ForegroundColor Green
  } else {
    Write-Host "  tunnel not running. Run: npm start" -ForegroundColor Gray
  }
} catch {
  Write-Host "  tunnel not running. Run: npm start" -ForegroundColor Gray
}

Write-Host ""
