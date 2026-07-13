# Mpangi-church — reset dev Next.js local Windows
# Usage :
# powershell -ExecutionPolicy Bypass -File scripts/dev-clean.ps1

$ErrorActionPreference = "SilentlyContinue"

Write-Host "Arrête d'abord npm run dev avec Ctrl+C si le serveur tourne." -ForegroundColor Yellow

if (Test-Path ".next") {
  Remove-Item -Recurse -Force ".next"
  Write-Host "Supprimé : .next" -ForegroundColor Green
}

if (Test-Path "node_modules\.cache") {
  Remove-Item -Recurse -Force "node_modules\.cache"
  Write-Host "Supprimé : node_modules\.cache" -ForegroundColor Green
}

Write-Host "Relance maintenant : npm run dev" -ForegroundColor Cyan
