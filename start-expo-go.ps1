# Start Expo over LAN without a tunnel.
$ip = (Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object { $_.IPAddress -like '192.168.*' } |
  Select-Object -First 1).IPAddress

if (-not $ip) {
  Write-Host "Warning: no 192.168.x.x address found. Connect the PC to Wi-Fi first." -ForegroundColor Yellow
  $ip = "192.168.1.138"
}

$env:REACT_NATIVE_PACKAGER_HOSTNAME = $ip
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  EXPO GO - open this URL on the phone:" -ForegroundColor Cyan
Write-Host "  exp://${ip}:8081" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Use Enter URL manually in Expo Go." -ForegroundColor Yellow

Set-Location $PSScriptRoot
npx expo start --host lan --port 8081 --no-dev --minify
