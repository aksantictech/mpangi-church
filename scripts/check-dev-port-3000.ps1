# Mpangi-church — vérifier les ports locaux
# Usage :
# powershell -ExecutionPolicy Bypass -File scripts/check-dev-port-3000.ps1

$ErrorActionPreference = "SilentlyContinue"

Write-Host ""
Write-Host "Ports locaux 3000/3001/3002" -ForegroundColor Cyan

Get-NetTCPConnection -LocalPort 3000,3001,3002 -ErrorAction SilentlyContinue |
  Select-Object LocalAddress, LocalPort, State, OwningProcess |
  Format-Table -AutoSize
