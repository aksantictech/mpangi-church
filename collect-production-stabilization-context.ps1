param(
  [string]$OutputName = "mpangi-production-stabilization-context.zip"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$Root = (Resolve-Path (Join-Path $PSScriptRoot ".")).Path
Set-Location $Root

$Temp = Join-Path $Root ".mpangi-stabilization-context"
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
  $relativePath = [System.Uri]::UnescapeDataString($relativeUri.ToString())

  return $relativePath.Replace("/", [System.IO.Path]::DirectorySeparatorChar)
}

if (Test-Path $Temp) {
  Remove-Item $Temp -Recurse -Force
}

New-Item -ItemType Directory -Force -Path $Temp | Out-Null

$ExactFiles = @(
  "src/proxy.ts",
  "proxy.ts",
  "src/middleware.ts",
  "middleware.ts",
  "next.config.ts",
  "next.config.js",
  "next.config.mjs",
  "tailwind.config.ts",
  "tailwind.config.js",
  "postcss.config.js",
  "postcss.config.mjs",
  "package.json",
  "src/app/layout.tsx",
  "src/app/globals.css",
  "src/app/page.tsx",
  "src/app/login/page.tsx",
  "src/app/super-admin/layout.tsx",
  "src/app/super-admin/page.tsx",
  "src/app/super-admin/churches/page.tsx",
  "src/app/church/[slug]/page.tsx",
  "src/app/church/[slug]/layout.tsx",
  "src/app/church/[slug]/bible/page.tsx",
  "src/app/api/bible/books/route.ts",
  "src/app/api/bible/chapter/route.ts",
  "src/app/api/bible/passage/route.ts",
  "src/app/api/bible/search/route.ts",
  "src/app/api/bible/versions/route.ts",
  "src/components/security/PermissionNavigationDomFilter.tsx",
  "src/lib/security/permissionNavigation.ts",
  "src/lib/security/routePermissionMap.ts",
  "src/lib/security/routeGuard.ts"
)

$DirectoryCandidates = @(
  "src/components/layout",
  "src/components/navigation",
  "src/components/super-admin",
  "src/components/public",
  "src/components/church",
  "src/components/bible",
  "src/components/branding",
  "src/lib/tenant",
  "src/lib/church",
  "src/lib/domain",
  "src/lib/routing"
)

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

  New-Item -ItemType Directory -Force -Path $DestinationDirectory | Out-Null
  Copy-Item -LiteralPath $Source -Destination $Destination -Force
}

foreach ($RelativePath in $ExactFiles) {
  Copy-ContextFile -RelativePath $RelativePath
}

foreach ($RelativeDirectory in $DirectoryCandidates) {
  $SourceDirectory = Join-Path $Root $RelativeDirectory

  if (-not (Test-Path -LiteralPath $SourceDirectory -PathType Container)) {
    continue
  }

  Get-ChildItem -LiteralPath $SourceDirectory -Recurse -File -Include *.ts,*.tsx,*.css,*.json |
    ForEach-Object {
      $RelativePath = Get-RelativePathCompat -BasePath $Root -TargetPath $_.FullName
      Copy-ContextFile -RelativePath $RelativePath
    }
}

$SearchTerms = @(
  "SuperAdmin",
  "BottomNav",
  "MobileNav",
  "AccountMenu",
  "Sidebar",
  "subdomain",
  "tenant",
  "PermissionNavigationDomFilter",
  "BibleReader"
)

$SearchReport = Join-Path $Temp "SEARCH_RESULTS.txt"

foreach ($Term in $SearchTerms) {
  Add-Content $SearchReport ""
  Add-Content $SearchReport "===== $Term ====="

  Get-ChildItem -Path (Join-Path $Root "src") -Recurse -File -Include *.ts,*.tsx,*.css |
    Select-String -SimpleMatch -Pattern $Term -ErrorAction SilentlyContinue |
    Select-Object -First 80 |
    ForEach-Object {
      Add-Content $SearchReport "$($_.Path):$($_.LineNumber): $($_.Line.Trim())"
    }
}

$FileList = Join-Path $Temp "FILE_LIST.txt"

Get-ChildItem $Temp -Recurse -File |
  ForEach-Object {
    Get-RelativePathCompat -BasePath $Temp -TargetPath $_.FullName
  } |
  Sort-Object |
  Set-Content $FileList

git status --short 2>&1 | Set-Content (Join-Path $Temp "GIT_STATUS.txt")

@(
  "Generated: $([DateTime]::UtcNow.ToString('o'))",
  "PowerShell: $($PSVersionTable.PSVersion.ToString())",
  "Node: $(node --version 2>&1)",
  "NPM: $(npm --version 2>&1)",
  "Branch: $(git branch --show-current 2>&1)",
  "Commit: $(git rev-parse --short HEAD 2>&1)"
) | Set-Content (Join-Path $Temp "PACKAGE_SUMMARY.txt")

if (Test-Path $Output) {
  Remove-Item $Output -Force
}

Compress-Archive -Path "$Temp\*" -DestinationPath $Output -CompressionLevel Optimal
Remove-Item $Temp -Recurse -Force

Write-Host ""
Write-Host "✅ Contexte de stabilisation créé :" -ForegroundColor Green
Write-Host $Output
Write-Host ""
Write-Host "Téléverse ce ZIP dans la conversation."
