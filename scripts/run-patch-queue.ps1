param(
  [switch]$Build,
  [switch]$StartDev
)

$ErrorActionPreference = "Stop"

$projectRoot = (Get-Location).Path
$patchDirectory = Join-Path $projectRoot "automation\patches"
$completedDirectory = Join-Path $projectRoot "automation\completed"
$failedDirectory = Join-Path $projectRoot "automation\failed"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

function Write-Step {
  param([string]$Message)

  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Run-Command {
  param(
    [string]$Name,
    [scriptblock]$Command
  )

  $logPath = Join-Path $projectRoot ".worker-lab\logs\$Name-$timestamp.log"

  & $Command *>&1 |
    Tee-Object -FilePath $logPath

  if ($LASTEXITCODE -ne 0) {
    throw "$Name failed. Read $logPath"
  }

  return $logPath
}

function Validate-Project {
  param([string]$Feature)

  Write-Step "Validating $Feature"

  $validationArgs = @(
    "-NoProfile",
    "-ExecutionPolicy", "Bypass",
    "-File", ".\scripts\validate-feature.ps1",
    "-Feature", $Feature
  )

  if ($Build) {
    $validationArgs += "-Build"
  }

  & powershell.exe @validationArgs

  if ($LASTEXITCODE -ne 0) {
    throw "Validation failed for $Feature."
  }
}

if (-not (Test-Path -LiteralPath "package.json")) {
  throw "Run this script from the project root."
}

$patches = Get-ChildItem -LiteralPath $patchDirectory -File -Filter "*.ps1" |
  Sort-Object Name

if ($patches.Count -eq 0) {
  Write-Host "No queued patches found in automation\patches." -ForegroundColor Yellow
  exit 0
}

$results = @()

foreach ($patch in $patches) {
  $feature = [System.IO.Path]::GetFileNameWithoutExtension($patch.Name)

  try {
    Write-Step "Applying $feature"

    & powershell.exe `
      -NoProfile `
      -ExecutionPolicy Bypass `
      -File $patch.FullName

    if ($LASTEXITCODE -ne 0) {
      throw "Patch script exited with code $LASTEXITCODE."
    }

    Validate-Project -Feature $feature

    Move-Item `
      -LiteralPath $patch.FullName `
      -Destination (Join-Path $completedDirectory $patch.Name)

    $results += "- PASS: $feature"
    Write-Host "Completed $feature." -ForegroundColor Green
  } catch {
    Move-Item `
      -LiteralPath $patch.FullName `
      -Destination (Join-Path $failedDirectory $patch.Name) `
      -Force

    $results += "- FAIL: $feature — $($_.Exception.Message)"

    @"
# Autonomous patch run failed

Time: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Patch: $feature
Error: $($_.Exception.Message)
"@ | Set-Content `
      -LiteralPath ".worker-lab\reports\autonomous-run-$timestamp.md" `
      -Encoding UTF8

    Write-Host ""
    Write-Host "Stopped at $feature." -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
  }
}

@"
# Autonomous patch run

Time: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

$($results -join "`n")
"@ | Set-Content `
  -LiteralPath ".worker-lab\reports\autonomous-run-$timestamp.md" `
  -Encoding UTF8

Write-Host ""
Write-Host "All queued patches completed successfully." -ForegroundColor Green

if ($StartDev) {
  Write-Step "Starting development server on port 3000"

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
    -WorkingDirectory $projectRoot

  Start-Sleep -Seconds 5
  Get-Content -LiteralPath "next-dev.log" -Tail 40
  Start-Process "http://localhost:3000/proposals"
}
