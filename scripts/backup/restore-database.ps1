param(
  [Parameter(Mandatory)][string]$BackupDirectory,
  [switch]$Execute
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location $ProjectRoot

function Import-DotEnv {
  param([Parameter(Mandatory)][string]$Path)

  if (-not (Test-Path $Path)) { return }

  foreach ($line in Get-Content $Path) {
    $trimmed = $line.Trim()
    if (-not $trimmed -or $trimmed.StartsWith("#")) { continue }

    if ($trimmed -match "^([A-Za-z_][A-Za-z0-9_]*)=(.*)$") {
      $name = $Matches[1]
      $value = $Matches[2].Trim().Trim('"').Trim("'")
      if (-not [Environment]::GetEnvironmentVariable($name)) {
        [Environment]::SetEnvironmentVariable($name, $value, "Process")
      }
    }
  }
}

Import-DotEnv (Join-Path $ProjectRoot ".env.backup")

$ResolvedBackup = Resolve-Path $BackupDirectory
$DatabaseDirectory = Join-Path $ResolvedBackup "database"
$Roles = Join-Path $DatabaseDirectory "roles.sql"
$Schema = Join-Path $DatabaseDirectory "schema.sql"
$Data = Join-Path $DatabaseDirectory "data.sql"

foreach ($file in @($Roles, $Schema, $Data)) {
  if (-not (Test-Path $file)) { throw "Fichier absent : $file" }
}

node "scripts/backup/verify-backup.js" --backup-dir "$ResolvedBackup"
if ($LASTEXITCODE -ne 0) { throw "Sauvegarde non intègre." }

if (-not $env:TARGET_DB_URL) { throw "TARGET_DB_URL manque dans .env.backup." }
if ($env:SUPABASE_DB_URL -and $env:TARGET_DB_URL -eq $env:SUPABASE_DB_URL) {
  throw "La cible est identique à la production."
}
if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
  throw "psql introuvable."
}

if (-not $Execute) {
  Write-Host "DRY-RUN : aucune restauration exécutée." -ForegroundColor Yellow
  Write-Host "Sauvegarde : $ResolvedBackup"
  Write-Host '$env:CONFIRM_DATABASE_RESTORE="RESTORE_TO_TEST_DATABASE"'
  Write-Host 'Relancer avec -Execute pour une base de TEST.'
  exit 0
}

if ($env:CONFIRM_DATABASE_RESTORE -ne "RESTORE_TO_TEST_DATABASE") {
  throw "Définir CONFIRM_DATABASE_RESTORE=RESTORE_TO_TEST_DATABASE."
}

Write-Host "⚠️ Restauration vers la base de TEST" -ForegroundColor Yellow

psql `
  --single-transaction `
  --variable ON_ERROR_STOP=1 `
  --file "$Roles" `
  --file "$Schema" `
  --command "SET session_replication_role = replica" `
  --file "$Data" `
  --dbname "$env:TARGET_DB_URL"

if ($LASTEXITCODE -ne 0) { throw "Restauration PostgreSQL échouée." }

Write-Host "✅ Restauration PostgreSQL terminée." -ForegroundColor Green
Write-Host "Réactiver ensuite Realtime, extensions et webhooks sur la cible."
