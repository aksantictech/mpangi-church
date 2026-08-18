param(
  [string]$BaseUrl = "http://localhost:3000",
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$Failures = New-Object System.Collections.Generic.List[string]
$Warnings = New-Object System.Collections.Generic.List[string]

function Run-Step {
  param(
    [string]$Name,
    [scriptblock]$Command,
    [switch]$WarningOnly
  )

  Write-Host ""
  Write-Host "=== $Name ===" -ForegroundColor Cyan

  try {
    $global:LASTEXITCODE = 0
    & $Command

    if ($LASTEXITCODE -ne 0) {
      throw "Exit code $LASTEXITCODE"
    }

    Write-Host "OK: $Name" -ForegroundColor Green
  }
  catch {
    $Message = $_.Exception.Message

    if ($WarningOnly) {
      $Warnings.Add("$Name : $Message")
      Write-Warning "$Name : $Message"
    }
    else {
      $Failures.Add("$Name : $Message")
      Write-Host "FAILED: $Name - $Message" -ForegroundColor Red
    }
  }
}

Write-Host ""
Write-Host "MPANGI CHURCH - PRODUCTION AND SECURITY AUDIT" -ForegroundColor Cyan
Write-Host "Repository: $((Get-Location).Path)"
Write-Host "Base URL: $BaseUrl"

Run-Step "ESLint" {
  npm run lint
}

Run-Step "Static route / secret / password audit" {
  node scripts/security-route-audit.mjs
}

Run-Step "Git diff --check" {
  git diff --check
}

Run-Step "NPM dependency audit - HIGH level" {
  npm audit --omit=dev --audit-level=high
} -WarningOnly

if (-not $SkipBuild) {
  Run-Step "Production build" {
    npm run build
  }
}

Write-Host ""
Write-Host "=== PROTECTED ROUTES WITHOUT SESSION ===" -ForegroundColor Cyan

$ProtectedRoutes = @(
  @{ Path = "/api/modules/my-modules"; Method = "GET"; Body = $null },
  @{ Path = "/api/dashboard/role"; Method = "GET"; Body = $null },
  @{ Path = "/api/assistant/search"; Method = "POST"; Body = '{"query":"membres"}' },
  @{ Path = "/members"; Method = "GET"; Body = $null },
  @{ Path = "/reports"; Method = "GET"; Body = $null },
  @{ Path = "/settings"; Method = "GET"; Body = $null },
  @{ Path = "/administration/correspondence"; Method = "GET"; Body = $null },
  @{ Path = "/administration/transmissions"; Method = "GET"; Body = $null },
  @{ Path = "/administration/tasks"; Method = "GET"; Body = $null },
  @{ Path = "/patrimony/assets"; Method = "GET"; Body = $null }
)

$ServerAvailable = $true

try {
  Invoke-WebRequest `
    -Uri $BaseUrl `
    -Method GET `
    -UseBasicParsing `
    -TimeoutSec 5 `
    -ErrorAction Stop | Out-Null
}
catch {
  if (-not $_.Exception.Response) {
    $ServerAvailable = $false
  }
}

if (-not $ServerAvailable) {
  $Warnings.Add("Local server is not reachable at $BaseUrl")
  Write-Warning "Local server is not reachable. Start npm run dev before HTTP route tests."
}
else {
  foreach ($Route in $ProtectedRoutes) {
    $Path = [string]$Route.Path
    $Method = [string]$Route.Method
    $Body = $Route.Body
    $Code = $null

    try {
      $Params = @{
        Uri = "$BaseUrl$Path"
        Method = $Method
        MaximumRedirection = 0
        TimeoutSec = 10
        UseBasicParsing = $true
        ErrorAction = "Stop"
      }

      if ($null -ne $Body) {
        $Params["Body"] = $Body
        $Params["ContentType"] = "application/json"
      }

      try {
        $Response = Invoke-WebRequest @Params
        $Code = [int]$Response.StatusCode
      }
      catch {
        if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
          $Code = [int]$_.Exception.Response.StatusCode
        }
        else {
          throw
        }
      }

      if ($Code -eq 200) {
        $Failures.Add("Protected route accessible without session: $Path (HTTP 200)")
        Write-Host "CRITICAL: $Path returned HTTP 200 without session" -ForegroundColor Red
      }
      elseif ($Code -in @(301, 302, 303, 307, 308, 401, 403)) {
        Write-Host "OK: $Path -> HTTP $Code" -ForegroundColor Green
      }
      else {
        $Warnings.Add("Unexpected response for $Path : HTTP $Code")
        Write-Warning "$Path -> HTTP $Code"
      }
    }
    catch {
      $Warnings.Add("HTTP test failed for $Path : $($_.Exception.Message)")
      Write-Warning "HTTP test failed for $Path"
    }
  }
}

Write-Host ""
Write-Host "=== PUBLIC ENVIRONMENT VARIABLE CHECK ===" -ForegroundColor Cyan

$SensitivePublicVariables = Get-ChildItem Env: | Where-Object {
  $_.Name -match "^NEXT_PUBLIC_.*(SECRET|PASSWORD|PRIVATE|SERVICE_ROLE|API_KEY)"
}

if ($SensitivePublicVariables) {
  foreach ($Item in $SensitivePublicVariables) {
    $Failures.Add("Sensitive variable exposed to client: $($Item.Name)")
    Write-Host "CRITICAL: sensitive public variable $($Item.Name)" -ForegroundColor Red
  }
}
else {
  Write-Host "OK: no sensitive NEXT_PUBLIC variable detected in current environment." -ForegroundColor Green
}

Write-Host ""
Write-Host "=== LOCAL ENV FILE QUICK CHECK ===" -ForegroundColor Cyan

$EnvFiles = @(
  ".env",
  ".env.local",
  ".env.development",
  ".env.production"
)

foreach ($EnvFile in $EnvFiles) {
  if (-not (Test-Path $EnvFile)) {
    continue
  }

  $Lines = Get-Content $EnvFile -ErrorAction SilentlyContinue

  foreach ($Line in $Lines) {
    if (
      $Line -match "^\s*NEXT_PUBLIC_.*(SECRET|PASSWORD|PRIVATE|SERVICE_ROLE|API_KEY)\s*="
    ) {
      $Name = ($Line -split "=", 2)[0].Trim()
      $Failures.Add("Sensitive key stored as public variable in $EnvFile : $Name")
      Write-Host "CRITICAL: $EnvFile exposes $Name" -ForegroundColor Red
    }
  }
}

Write-Host ""
Write-Host "=== PASSWORD POLICY CODE CHECK ===" -ForegroundColor Cyan

$PasswordFiles = Get-ChildItem `
  -Path "src" `
  -Recurse `
  -File `
  -Include "*.ts","*.tsx" `
  -ErrorAction SilentlyContinue

$PasswordHits = @()

foreach ($File in $PasswordFiles) {
  $Matches = Select-String `
    -Path $File.FullName `
    -Pattern "password.{0,80}(minLength|length|regex)|minLength.{0,40}password" `
    -CaseSensitive:$false `
    -ErrorAction SilentlyContinue

  if ($Matches) {
    $PasswordHits += $Matches
  }
}

if ($PasswordHits.Count -gt 0) {
  Write-Host "INFO: password validation references detected: $($PasswordHits.Count)" -ForegroundColor Green
}
else {
  $Warnings.Add("No obvious password-length validation was detected in src.")
  Write-Warning "No obvious password-length validation detected in src."
}

Write-Host ""
Write-Host "=== SUMMARY ===" -ForegroundColor Cyan
Write-Host "Critical failures : $($Failures.Count)" -ForegroundColor $(if ($Failures.Count -gt 0) { "Red" } else { "Green" })
Write-Host "Warnings          : $($Warnings.Count)" -ForegroundColor $(if ($Warnings.Count -gt 0) { "Yellow" } else { "Green" })

if ($Failures.Count -gt 0) {
  Write-Host ""
  Write-Host "CRITICAL ITEMS:" -ForegroundColor Red

  foreach ($Failure in $Failures) {
    Write-Host " - $Failure" -ForegroundColor Red
  }
}

if ($Warnings.Count -gt 0) {
  Write-Host ""
  Write-Host "WARNINGS:" -ForegroundColor Yellow

  foreach ($Warning in $Warnings) {
    Write-Host " - $Warning" -ForegroundColor Yellow
  }
}

if ($Failures.Count -gt 0) {
  exit 2
}

exit 0
