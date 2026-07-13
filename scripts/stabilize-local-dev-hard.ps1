# Mpangi-church — stabilisation locale dure Windows
# Usage :
# 1. Stopper le serveur avec Ctrl+C
# 2. powershell -ExecutionPolicy Bypass -File scripts/stabilize-local-dev-hard.ps1
# 3. npm run dev:clean

$ErrorActionPreference = "SilentlyContinue"

Write-Host "Stabilisation locale Mpangi-church..." -ForegroundColor Cyan

$targets = @(
  ".next",
  "node_modules\.cache"
)

foreach ($target in $targets) {
  if (Test-Path $target) {
    Remove-Item -Recurse -Force $target
    Write-Host "Supprimé : $target" -ForegroundColor Green
  }
}

Write-Host ""
Write-Host "Ouvre ensuite dans le navigateur :" -ForegroundColor Yellow
Write-Host "http://localhost:3000/dev/clear-cache"
Write-Host ""
Write-Host "Clique Nettoyer maintenant, ferme tous les onglets localhost, puis relance : npm run dev:clean" -ForegroundColor Yellow
