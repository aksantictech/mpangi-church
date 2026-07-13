# Mpangi-church — récupération serveur local
# Usage :
# powershell -ExecutionPolicy Bypass -File scripts/recover-local-dev.ps1

$ErrorActionPreference = "SilentlyContinue"

Write-Host ""
Write-Host "Récupération serveur local Mpangi-church..." -ForegroundColor Cyan

powershell -ExecutionPolicy Bypass -File scripts/kill-dev-port-3000.ps1

if (Test-Path ".next") {
  Remove-Item -Recurse -Force ".next"
  Write-Host "Supprimé : .next" -ForegroundColor Green
}

if (Test-Path "node_modules\.cache") {
  Remove-Item -Recurse -Force "node_modules\.cache"
  Write-Host "Supprimé : node_modules\.cache" -ForegroundColor Green
}

Write-Host ""
Write-Host "Relance maintenant :" -ForegroundColor Yellow
Write-Host "npm run dev"
