<#
.SYNOPSIS
  Validate the Koncep project (lint, typecheck, tests, optional migrate/build).
.DESCRIPTION
  Runs git diff --check, then npm run check. With -Migrate, runs npm run db:migrate
  (with a warning) first. With -Build, runs npm run build afterward. Never seeds,
  stages, commits, or pushes.
.EXAMPLE
  pwsh automation/checks/validate.ps1 -Migrate -Build
#>
param(
  [switch]$Build,
  [switch]$Migrate
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
Push-Location $repoRoot
try {
  Write-Host "==> git diff --check" -ForegroundColor Cyan
  git diff --check
  if ($LASTEXITCODE -ne 0) { throw "git diff --check reported issues." }

  if ($Migrate) {
    Write-Host "WARNING: Running 'npm run db:migrate' will modify the local SQLite database." -ForegroundColor Yellow
    npm run db:migrate
    if ($LASTEXITCODE -ne 0) { throw "npm run db:migrate failed." }
  }

  Write-Host "==> npm run check" -ForegroundColor Cyan
  npm run check
  if ($LASTEXITCODE -ne 0) { throw "npm run check failed." }

  if ($Build) {
    Write-Host "==> npm run build" -ForegroundColor Cyan
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "npm run build failed." }
  }

  Write-Host "Validation complete." -ForegroundColor Green
} finally {
  Pop-Location
}
