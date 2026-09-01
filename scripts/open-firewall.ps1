# Run as Administrator: right-click PowerShell -> Run as administrator
# Allows Expo Go on your phone to reach Metro on this PC.

$ports = 8081, 19000, 19001
foreach ($port in $ports) {
  $name = "Expo Dev Port $port"
  $existing = netsh advfirewall firewall show rule name="$name" 2>$null
  if ($LASTEXITCODE -ne 0) {
    netsh advfirewall firewall add rule name="$name" dir=in action=allow protocol=TCP localport=$port
    Write-Host "Added firewall rule for port $port"
  } else {
    Write-Host "Rule already exists for port $port"
  }
}
Write-Host "Done. Restart Expo and scan QR again."
