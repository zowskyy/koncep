<#
.SYNOPSIS
  Print a read-only inventory of the Koncep repository.
.DESCRIPTION
  Lists key directories/files, git status, npm scripts, local SQLite artifacts,
  and gitignore status. Does not modify anything.
.EXAMPLE
  pwsh automation/audit/project-inventory.ps1
#>
$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
Push-Location $repoRoot
try {
  function Write-Section($title) {
    Write-Host ""
    Write-Host "==> $title" -ForegroundColor Cyan
  }

  Write-Section "Repository inventory"
  $targets = @(
    "README.md",
    "package.json",
    ".gitignore",
    "drizzle.config.ts",
    "src/app",
    "src/components",
    "src/lib/domain",
    "src/lib/server",
    "drizzle"
  )
  foreach ($t in $targets) {
    $p = Join-Path $repoRoot $t
    if (Test-Path -LiteralPath $p) {
      if ((Get-Item -LiteralPath $p) -is [System.IO.DirectoryInfo]) {
        Write-Host "--- $t (directory) ---"
        Get-ChildItem -LiteralPath $p -Recurse -File | ForEach-Object {
          $_.FullName.Substring($repoRoot.Length).TrimStart("\")
        }
      } else {
        Write-Host "--- $t (file) ---"
        Write-Host $t
      }
    } else {
      Write-Host "--- $t (NOT FOUND) ---"
    }
  }

  Write-Section "Git status (short)"
  git status --short

  Write-Section "npm scripts (package.json)"
  $pkg = Get-Content -Raw -LiteralPath (Join-Path $repoRoot "package.json") | ConvertFrom-Json
  $pkg.scripts | Get-Member -MemberType NoteProperty | ForEach-Object {
    Write-Host ("{0}: {1}" -f $_.Name, $pkg.scripts.$($_.Name))
  }

  Write-Section "Local SQLite artifacts"
  $artifacts = @(
    "data/koncep.db",
    "data/koncep.db-shm",
    "data/koncep.db-wal",
    "next-dev.log"
  )
  foreach ($a in $artifacts) {
    $exists = Test-Path -LiteralPath (Join-Path $repoRoot $a)
    Write-Host ("{0}: {1}" -f $a, $(if ($exists) { "present" } else { "absent" }))
  }

  Write-Section "Git ignore status"
  $ignorePaths = @(
    "data/koncep.db",
    "data/koncep.db-shm",
    "data/koncep.db-wal",
    ".worker-lab",
    "next-dev.log"
  )
  foreach ($g in $ignorePaths) {
    $result = git check-ignore -v -- $g 2>$null
    if ($LASTEXITCODE -eq 0) {
      Write-Host ("{0}: ignored ({1})" -f $g, $result)
    } else {
      Write-Host ("{0}: NOT ignored" -f $g)
    }
  }

  Write-Host ""
  Write-Host "Inventory complete (read-only)." -ForegroundColor Green
} finally {
  Pop-Location
}
