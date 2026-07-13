# Mpangi-church — tuer les anciens serveurs Next sur 3000/3001/3002
# Usage :
# powershell -ExecutionPolicy Bypass -File scripts/kill-next-dev-ports.ps1

$ErrorActionPreference = "SilentlyContinue"

$ports = @(3000, 3001, 3002)

Write-Host ""
Write-Host "Arrêt des anciens serveurs Next.js..." -ForegroundColor Cyan

foreach ($port in $ports) {
  $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue

  foreach ($connection in $connections) {
    $pid = $connection.OwningProcess

    if ($pid) {
      $process = Get-Process -Id $pid -ErrorAction SilentlyContinue

      if ($process) {
        Write-Host "Port $port utilisé par PID $pid ($($process.ProcessName)) - arrêt..." -ForegroundColor Yellow
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
      }
    }
  }
}

# Sécurité supplémentaire : tuer les node next dev restants liés au dossier courant.
Get-CimInstance Win32_Process |
  Where-Object {
    $_.Name -match "node" -and
    $_.CommandLine -match "next" -and
    $_.CommandLine -match "dev"
  } |
  ForEach-Object {
    Write-Host "Arrêt process Next dev PID $($_.ProcessId)" -ForegroundColor Yellow
    Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
  }

Write-Host "Serveurs dev arrêtés." -ForegroundColor Green
