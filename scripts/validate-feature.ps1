param(
  [Parameter(Mandatory = $true)]
  [string]$Feature,

  [switch]$Build,

  [switch]$StartDev
)

$ErrorActionPreference = "Stop"

function Write-Step {
  param([string]$Message)

  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Save-Result {
  param(
    [int]$CheckExit,
    [int]$BuildExit
  )

  @"
# $Feature validation

Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Check exit code: $CheckExit
Build exit code: $BuildExit
"@ | Set-Content `
    -LiteralPath ".worker-lab\reports\$Feature-validation.md" `
    -Encoding UTF8
}

if (-not (Test-Path -LiteralPath "package.json")) {
  throw "Run this script from the Koncep project root."
}

$checkLog = ".worker-lab\logs\$Feature-check.log"
$buildLog = ".worker-lab\logs\$Feature-build.log"

Write-Step "Running check for $Feature"

npm run check *>&1 | Out-File -FilePath $checkLog -Encoding utf8
Get-Content -LiteralPath $checkLog
$checkExit = $LASTEXITCODE

if ($checkExit -ne 0) {
  Save-Result -CheckExit $checkExit -BuildExit -1

  Write-Host ""
  Write-Host "Validation failed. Read: $checkLog" -ForegroundColor Red
  exit $checkExit
}

$buildExit = -1

if ($Build) {
  Write-Step "Running production build for $Feature"

  npm run build *>&1 | Out-File -FilePath $buildLog -Encoding utf8
Get-Content -LiteralPath $buildLog
  $buildExit = $LASTEXITCODE

  if ($buildExit -ne 0) {
    Save-Result -CheckExit $checkExit -BuildExit $buildExit

    Write-Host ""
    Write-Host "Build failed. Read: $buildLog" -ForegroundColor Red
    exit $buildExit
  }
}

Save-Result -CheckExit $checkExit -BuildExit $buildExit

Write-Host ""
Write-Host "Validation passed." -ForegroundColor Green

if ($StartDev) {
  Write-Step "Starting development server"

  $portOwners = @(
    Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue |
      Select-Object -ExpandProperty OwningProcess -Unique
  )

  foreach ($processId in $portOwners) {
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
  }

  Remove-Item -LiteralPath "next-dev.log" -Force -ErrorAction SilentlyContinue

  Start-Process `
    -FilePath "cmd.exe" `
    -ArgumentList "/c", "npm run dev > next-dev.log 2>&1" `
    -WorkingDirectory (Get-Location)

  Start-Sleep -Seconds 5

  Get-Content -LiteralPath "next-dev.log" -Tail 30

  Start-Process "http://localhost:3000/proposals"
}


