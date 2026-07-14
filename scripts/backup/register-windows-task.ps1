param(
  [string]$TaskName = "Mpangi-Church Daily Backup",
  [string]$At = "02:00"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$ScriptPath = Join-Path $ProjectRoot "scripts\backup\run-backup.ps1"
$PowerShell = (Get-Command powershell.exe).Source

$Action = New-ScheduledTaskAction `
  -Execute $PowerShell `
  -Argument ("-NoProfile -ExecutionPolicy Bypass -File `"$ScriptPath`"") `
  -WorkingDirectory "$ProjectRoot"

$Trigger = New-ScheduledTaskTrigger -Daily -At $At

$Settings = New-ScheduledTaskSettingsSet `
  -StartWhenAvailable `
  -DontStopIfGoingOnBatteries `
  -AllowStartIfOnBatteries `
  -ExecutionTimeLimit (New-TimeSpan -Hours 6)

Register-ScheduledTask `
  -TaskName $TaskName `
  -Action $Action `
  -Trigger $Trigger `
  -Settings $Settings `
  -Description "Sauvegarde quotidienne Mpangi-Church" `
  -Force

Write-Host "✅ Tâche planifiée : $TaskName à $At" -ForegroundColor Green
