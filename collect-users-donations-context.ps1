param(
  [string]$OutputName = "mpangi-users-donations-context.zip"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$Root = (Resolve-Path (Join-Path $PSScriptRoot ".")).Path
Set-Location $Root

$Temp = Join-Path $Root ".mpangi-users-donations-context"
$Output = Join-Path $Root $OutputName

function Get-RelativePathCompat {
  param(
    [Parameter(Mandatory)]
    [string]$BasePath,

    [Parameter(Mandatory)]
    [string]$TargetPath
  )

  $baseFull = [System.IO.Path]::GetFullPath($BasePath)
  $targetFull = [System.IO.Path]::GetFullPath($TargetPath)

  if (-not $baseFull.EndsWith([System.IO.Path]::DirectorySeparatorChar)) {
    $baseFull += [System.IO.Path]::DirectorySeparatorChar
  }

  $baseUri = New-Object System.Uri($baseFull)
  $targetUri = New-Object System.Uri($targetFull)

  $relativeUri = $baseUri.MakeRelativeUri($targetUri)

  return [System.Uri]::UnescapeDataString(
    $relativeUri.ToString()
  ).Replace(
    "/",
    [System.IO.Path]::DirectorySeparatorChar
  )
}

function Copy-ContextFile {
  param(
    [Parameter(Mandatory)]
    [string]$RelativePath
  )

  $Source = Join-Path $Root $RelativePath

  if (-not (Test-Path -LiteralPath $Source -PathType Leaf)) {
    return
  }

  $Destination = Join-Path $Temp $RelativePath
  $DestinationDirectory = Split-Path $Destination -Parent

  New-Item `
    -ItemType Directory `
    -Force `
    -Path $DestinationDirectory `
    | Out-Null

  Copy-Item `
    -LiteralPath $Source `
    -Destination $Destination `
    -Force
}

if (Test-Path $Temp) {
  Remove-Item $Temp -Recurse -Force
}

New-Item -ItemType Directory -Force -Path $Temp | Out-Null

$ExactFiles = @(
  "package.json",
  "src/app/globals.css",

  "src/components/super-admin/SuperAdminUserActions.tsx",
  "src/components/super-admin/SuperAdminChurchUserForm.tsx",

  "src/components/public/PublicDonationSection.tsx",

  "src/lib/supabase/admin.ts",
  "src/lib/supabase/server.ts",
  "src/lib/supabase/client.ts",

  "src/features/organizations/types/organization.ts"
)

$DirectoryCandidates = @(
  "src/app/settings/users",
  "src/app/settings/roles",
  "src/app/settings/donations",

  "src/app/super-admin/users",
  "src/app/super-admin/churches",

  "src/app/api/settings/users",
  "src/app/api/super-admin/church-users",
  "src/app/api/public/church-donations",
  "src/app/api/payments",
  "src/app/api/donations",

  "src/app/church/[slug]/don",
  "src/app/finance/donations",

  "src/components/donations",
  "src/components/payments",
  "src/components/forms",

  "src/lib/donations",
  "src/lib/payments",

  "src/types",
  "src/features"
)

foreach ($RelativePath in $ExactFiles) {
  Copy-ContextFile -RelativePath $RelativePath
}

foreach ($RelativeDirectory in $DirectoryCandidates) {
  $SourceDirectory = Join-Path $Root $RelativeDirectory

  if (-not (Test-Path -LiteralPath $SourceDirectory -PathType Container)) {
    continue
  }

  Get-ChildItem `
    -LiteralPath $SourceDirectory `
    -Recurse `
    -File `
    -Include *.ts,*.tsx,*.css,*.json `
    | ForEach-Object {
      $RelativePath = Get-RelativePathCompat `
        -BasePath $Root `
        -TargetPath $_.FullName

      Copy-ContextFile -RelativePath $RelativePath
    }
}

$SearchTerms = @(
  "church-users",
  "update_status",
  "reset_password",
  "archive",
  "deleteUser",
  "donation_",
  "PublicDonationSection",
  "church_donations",
  "payment",
  "mobile money",
  "cinetpay",
  "mpesa",
  "airtel",
  "orange money",
  "bank_account",
  "card_url"
)

$SearchReport = Join-Path $Temp "SEARCH_RESULTS.txt"

foreach ($Term in $SearchTerms) {
  Add-Content $SearchReport ""
  Add-Content $SearchReport "===== $Term ====="

  Get-ChildItem `
    -Path (Join-Path $Root "src") `
    -Recurse `
    -File `
    -Include *.ts,*.tsx,*.css `
    | Select-String `
      -SimpleMatch `
      -Pattern $Term `
      -ErrorAction SilentlyContinue `
    | Select-Object -First 120 `
    | ForEach-Object {
      Add-Content `
        $SearchReport `
        "$($_.Path):$($_.LineNumber): $($_.Line.Trim())"
    }
}

Get-ChildItem $Temp -Recurse -File |
  ForEach-Object {
    Get-RelativePathCompat `
      -BasePath $Temp `
      -TargetPath $_.FullName
  } |
  Sort-Object |
  Set-Content (Join-Path $Temp "FILE_LIST.txt")

@(
  "Generated: $([DateTime]::UtcNow.ToString('o'))",
  "PowerShell: $($PSVersionTable.PSVersion.ToString())",
  "Node: $(node --version 2>&1)",
  "Branch: $(git branch --show-current 2>&1)",
  "Commit: $(git rev-parse --short HEAD 2>&1)"
) | Set-Content (Join-Path $Temp "PROJECT_STATE.txt")

git status --short 2>&1 |
  Set-Content (Join-Path $Temp "GIT_STATUS.txt")

if (Test-Path $Output) {
  Remove-Item $Output -Force
}

Compress-Archive `
  -Path "$Temp\*" `
  -DestinationPath $Output `
  -CompressionLevel Optimal

Remove-Item $Temp -Recurse -Force

Write-Host ""
Write-Host "✅ Contexte Utilisateurs + Dons créé :" -ForegroundColor Green
Write-Host $Output
Write-Host ""
Write-Host "Téléverse ce ZIP dans la conversation."
