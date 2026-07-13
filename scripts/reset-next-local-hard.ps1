# Mpangi-church — reset local fort
# Usage :
# powershell -ExecutionPolicy Bypass -File scripts/reset-next-local-hard.ps1

$ErrorActionPreference = "SilentlyContinue"

Write-Host ""
Write-Host "Reset local Next.js..." -ForegroundColor Cyan

powershell -ExecutionPolicy Bypass -File scripts/kill-next-dev-ports.ps1

$targets = @(".next", "node_modules\.cache")

foreach ($target in $targets) {
  if (Test-Path $target) {
    Remove-Item -Recurse -Force $target
    Write-Host "Supprimé : $target" -ForegroundColor Green
  }
}

Write-Host ""
Write-Host "Reset terminé." -ForegroundColor Green
Write-Host "Relance maintenant : npm run dev:3000" -ForegroundColor Yellow
