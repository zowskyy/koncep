<#
.SYNOPSIS
  Verify Drizzle migrations against a temporary SQLite database.
.DESCRIPTION
  Confirms drizzle.config.ts is clean, then (in memory) rewrites its database path to
  a temporary location under automation/tmp-db, runs npm run db:migrate, verifies the
  temporary database exists, and restores drizzle.config.ts. Never touches
  data/koncep.db, never seeds, and never stages/commits/pushes.
.EXAMPLE
  pwsh automation/db/verify-fresh-migrations.ps1
#>
$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
Push-Location $repoRoot
try {
  $configPath = Join-Path $repoRoot "drizzle.config.ts"

  Write-Host "Confirming drizzle.config.ts working tree is clean..." -ForegroundColor Cyan
  $status = git status --porcelain -- drizzle.config.ts
  if ($status.Trim().Length -ne 0) {
    Write-Host "Refusing: drizzle.config.ts is not clean in the working tree:" -ForegroundColor Red
    Write-Host $status
    exit 1
  }

  $original = Get-Content -Raw -LiteralPath $configPath
  if ($original -notlike "*./data/koncep.db*") {
    Write-Host "Refusing: expected database path './data/koncep.db' not found in drizzle.config.ts; aborting without changes." -ForegroundColor Red
    exit 1
  }

  $tmpDir = Join-Path $repoRoot "automation" "tmp-db"
  $tmpDb = Join-Path $tmpDir "koncep.db"
  $tmpDbForward = $tmpDb.Replace('\', '/')

  if (Test-Path -LiteralPath $tmpDir) {
    Remove-Item -Recurse -Force -LiteralPath $tmpDir
  }
  New-Item -ItemType Directory -Path $tmpDir | Out-Null

  $updated = $original.Replace('./data/koncep.db', $tmpDbForward)
  Set-Content -LiteralPath $configPath -Value $updated -NoNewline

  try {
    Write-Host ("Running migrations against temporary database: {0}" -f $tmpDbForward) -ForegroundColor Cyan
    npm run db:migrate
    if ($LASTEXITCODE -ne 0) { throw "db:migrate failed against temporary database." }

    if (Test-Path -LiteralPath $tmpDb) {
      Write-Host ("Temporary database created successfully: {0}" -f $tmpDb) -ForegroundColor Green
    } else {
      throw ("Temporary database was not created at expected path: {0}" -f $tmpDb)
    }
  } finally {
    Write-Host "Restoring original drizzle.config.ts..." -ForegroundColor Cyan
    Set-Content -LiteralPath $configPath -Value $original -NoNewline
    if (Test-Path -LiteralPath $tmpDir) {
      Remove-Item -Recurse -Force -LiteralPath $tmpDir
      Write-Host ("Removed temporary directory: {0}" -f $tmpDir) -ForegroundColor Green
    }
  }
} finally {
  Pop-Location
}
