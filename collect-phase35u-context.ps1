param(
  [string]$OutputName = "mpangi-phase35u-context.zip"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$Root = (Resolve-Path (Join-Path $PSScriptRoot ".")).Path
Set-Location $Root

$Temp = Join-Path $Root ".mpangi-phase35u-context"
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

  New-Item -ItemType Directory -Force -Path $DestinationDirectory | Out-Null
  Copy-Item -LiteralPath $Source -Destination $Destination -Force
}

if (Test-Path $Temp) {
  Remove-Item $Temp -Recurse -Force
}

New-Item -ItemType Directory -Force -Path $Temp | Out-Null

$ExactFiles = @(
  "package.json",
  "tsconfig.json",
  "next.config.ts",
  "next.config.js",
  "next.config.mjs",
  "src/proxy.ts",
  "proxy.ts",
  "src/app/layout.tsx",
  "src/app/globals.css",
  "src/styles/production-stabilization.css",
  "src/components/layout/MobileBottomNav.tsx",
  "src/components/layout/MobileTopBar.tsx",
  "src/components/layout/AppShell.tsx",
  "src/components/layout/Topbar.tsx",
  "src/components/layout/ChurchDesktopTopBar.tsx",
  "src/components/modules/MobileModuleAccordion.tsx",
  "src/app/settings/page.tsx",
  "src/lib/security/permissionNavigation.ts",
  "src/lib/security/routePermissionMap.ts",
  "src/app/church/[slug]/bible/page.tsx",
  "src/components/public/bible/PublicBibleBlock.tsx",
  "src/app/api/bible/versions/route.ts",
  "src/app/api/bible/books/route.ts",
  "src/app/api/bible/chapter/route.ts",
  "src/app/api/bible/passage/route.ts",
  "src/app/api/bible/search/route.ts",
  "src/app/api/publications/route.ts",
  "src/app/teachings/page.tsx",
  "src/app/teachings/actions.ts",
  "src/app/notifications/page.tsx",
  "src/app/api/notifications/subscribe/route.ts",
  "src/app/api/notifications/broadcast/route.ts",
  "src/app/api/push/subscribe/route.ts",
  "public/sw.js",
  "public/service-worker.js",
  "src/app/manifest.ts",
  "src/app/manifest.json/route.ts"
)

$DirectoryCandidates = @(
  "src/app/teachings",
  "src/app/publications",
  "src/app/notifications",
  "src/app/settings",
  "src/app/church/[slug]/bible",
  "src/components/layout",
  "src/components/mobile",
  "src/components/modules",
  "src/components/notifications",
  "src/components/public",
  "src/components/teachings",
  "src/components/publications",
  "src/components/forms",
  "src/lib/bible",
  "src/lib/notifications",
  "src/lib/push",
  "src/lib/publications",
  "src/lib/security",
  "src/types"
)

foreach ($RelativePath in $ExactFiles) {
  Copy-ContextFile -RelativePath $RelativePath
}

foreach ($RelativeDirectory in $DirectoryCandidates) {
  $SourceDirectory = Join-Path $Root $RelativeDirectory

  if (-not (Test-Path -LiteralPath $SourceDirectory -PathType Container)) {
    continue
  }

  Get-ChildItem -LiteralPath $SourceDirectory -Recurse -File -Include *.ts,*.tsx,*.css,*.js,*.json |
    ForEach-Object {
      $RelativePath = Get-RelativePathCompat -BasePath $Root -TargetPath $_.FullName
      Copy-ContextFile -RelativePath $RelativePath
    }
}

$SearchTerms = @(
  "church_publications",
  "description",
  "summary",
  "cover_image",
  "image_url",
  "featured",
  "notify_subscribers",
  "broadcast",
  "push_subscriptions",
  "Notification.requestPermission",
  "PushManager",
  "MobileBottomNav",
  "grid-cols-5",
  "flex-col",
  "/alerts",
  "/notifications",
  "settings/donations",
  "bible_versions",
  "API.BIBLE",
  "API_BIBLE",
  "JND",
  "lsg1910"
)

$SearchReport = Join-Path $Temp "SEARCH_RESULTS.txt"

foreach ($Term in $SearchTerms) {
  Add-Content $SearchReport ""
  Add-Content $SearchReport "===== $Term ====="

  Get-ChildItem -Path (Join-Path $Root "src") -Recurse -File -Include *.ts,*.tsx,*.css,*.js |
    Select-String -SimpleMatch -Pattern $Term -ErrorAction SilentlyContinue |
    Select-Object -First 150 |
    ForEach-Object {
      Add-Content $SearchReport "$($_.Path):$($_.LineNumber): $($_.Line.Trim())"
    }
}

$SqlSearchReport = Join-Path $Temp "SQL_SEARCH_RESULTS.txt"

Get-ChildItem -Path $Root -Recurse -File -Include *.sql -ErrorAction SilentlyContinue |
  Where-Object {
    $_.FullName -notmatch "\\node_modules\\" -and
    $_.FullName -notmatch "\\backups\\" -and
    $_.FullName -notmatch "\\.phase"
  } |
  Select-String -Pattern "church_publications|bible_versions|push_subscriptions|notifications|donations" -ErrorAction SilentlyContinue |
  Select-Object -First 500 |
  ForEach-Object {
    Add-Content $SqlSearchReport "$($_.Path):$($_.LineNumber): $($_.Line.Trim())"
  }

Get-ChildItem $Temp -Recurse -File |
  ForEach-Object {
    Get-RelativePathCompat -BasePath $Temp -TargetPath $_.FullName
  } |
  Sort-Object |
  Set-Content (Join-Path $Temp "FILE_LIST.txt")

@(
  "Generated: $([DateTime]::UtcNow.ToString('o'))",
  "PowerShell: $($PSVersionTable.PSVersion.ToString())",
  "Node: $(node --version 2>&1)",
  "NPM: $(npm --version 2>&1)",
  "Branch: $(git branch --show-current 2>&1)",
  "Commit: $(git rev-parse --short HEAD 2>&1)"
) | Set-Content (Join-Path $Temp "PROJECT_STATE.txt")

git status --short 2>&1 | Set-Content (Join-Path $Temp "GIT_STATUS.txt")

if (Test-Path $Output) {
  Remove-Item $Output -Force
}

Compress-Archive -Path "$Temp\*" -DestinationPath $Output -CompressionLevel Optimal
Remove-Item $Temp -Recurse -Force

Write-Host ""
Write-Host "✅ Contexte Phase 35U créé :" -ForegroundColor Green
Write-Host $Output
Write-Host ""
Write-Host "Téléverse ce ZIP dans la conversation."
