param(
  [switch]$SkipStorage,
  [switch]$SkipRetention,
  [switch]$NoArchive
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

Import-DotEnv (Join-Path $ProjectRoot ".env.local")
Import-DotEnv (Join-Path $ProjectRoot ".env.backup")

if (-not $env:SUPABASE_DB_URL) {
  throw "SUPABASE_DB_URL manque dans .env.backup."
}

if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
  throw "Supabase CLI introuvable."
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js introuvable."
}

$Timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-dd_HH-mm-ss")
$BackupRoot = Join-Path $ProjectRoot "backups\mpangi-church\$Timestamp"
$DatabaseRoot = Join-Path $BackupRoot "database"
$StorageRoot = Join-Path $BackupRoot "storage"

New-Item -ItemType Directory -Force -Path $DatabaseRoot | Out-Null

Write-Host ""
Write-Host "=== MPANGI-CHURCH BACKUP $Timestamp ===" -ForegroundColor Cyan

Write-Host "1/5 Sauvegarde des rôles..."
supabase db dump --db-url "$env:SUPABASE_DB_URL" -f (Join-Path $DatabaseRoot "roles.sql") --role-only
if ($LASTEXITCODE -ne 0) { throw "Échec sauvegarde des rôles." }

Write-Host "2/5 Sauvegarde du schéma..."
supabase db dump --db-url "$env:SUPABASE_DB_URL" -f (Join-Path $DatabaseRoot "schema.sql")
if ($LASTEXITCODE -ne 0) { throw "Échec sauvegarde du schéma." }

Write-Host "3/5 Sauvegarde des données..."
supabase db dump `
  --db-url "$env:SUPABASE_DB_URL" `
  -f (Join-Path $DatabaseRoot "data.sql") `
  --data-only `
  --use-copy `
  -x "storage.buckets_vectors" `
  -x "storage.vector_indexes"
if ($LASTEXITCODE -ne 0) { throw "Échec sauvegarde des données." }

if (-not $SkipStorage) {
  Write-Host "4/5 Sauvegarde Storage..."
  node "scripts/backup/backup-storage.js" --output "$StorageRoot"

  if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne 2) {
    throw "Échec sauvegarde Storage."
  }
} else {
  Write-Host "4/5 Storage ignoré."
}

Write-Host "5/5 Manifest et contrôle d’intégrité..."
node "scripts/backup/create-manifest.js" --backup-dir "$BackupRoot"
if ($LASTEXITCODE -ne 0) { throw "Manifest invalide." }

node "scripts/backup/verify-backup.js" --backup-dir "$BackupRoot"
if ($LASTEXITCODE -ne 0) { throw "Contrôle d’intégrité échoué." }

if (-not $NoArchive) {
  $ArchivePath = "$BackupRoot.zip"
  if (Test-Path $ArchivePath) { Remove-Item -Force $ArchivePath }

  Compress-Archive `
    -Path "$BackupRoot\*" `
    -DestinationPath $ArchivePath `
    -CompressionLevel Optimal

  Write-Host "Archive : $ArchivePath" -ForegroundColor Green
}

if (-not $SkipRetention) {
  node "scripts/backup/apply-retention.js" `
    --backups-dir (Join-Path $ProjectRoot "backups\mpangi-church") `
    --execute

  if ($LASTEXITCODE -ne 0) { throw "Politique de rétention échouée." }
}

Write-Host ""
Write-Host "✅ Sauvegarde terminée : $BackupRoot" -ForegroundColor Green
