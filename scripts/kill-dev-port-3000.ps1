# Mpangi-church — libérer le port 3000/3001/3002
# Usage :
# powershell -ExecutionPolicy Bypass -File scripts/kill-dev-port-3000.ps1

$ErrorActionPreference = "SilentlyContinue"

$ports = @(3000, 3001, 3002)

Write-Host ""
Write-Host "Recherche des processus qui utilisent les ports 3000/3001/3002..." -ForegroundColor Cyan

foreach ($port in $ports) {
  $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue

  foreach ($connection in $connections) {
    $processId = $connection.OwningProcess

    if ($processId) {
      $process = Get-Process -Id $processId -ErrorAction SilentlyContinue

      if ($process) {
        Write-Host "Port $port -> PID $processId ($($process.ProcessName)) : arrêt" -ForegroundColor Yellow
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
      }
    }
  }
}

Get-CimInstance Win32_Process |
  Where-Object {
    $_.Name -match "node" -and
    $_.CommandLine -match "next" -and
    $_.CommandLine -match "dev"
  } |
  ForEach-Object {
    Write-Host "Process Next dev restant PID $($_.ProcessId) : arrêt" -ForegroundColor Yellow
    Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
  }

Write-Host "Ports dev libérés." -ForegroundColor Green
