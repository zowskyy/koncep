<#
.SYNOPSIS
  Stage explicit files only, refusing risky paths.
.DESCRIPTION
  Verifies each supplied file exists and is not a risky path (.env, data/, SQLite
  files, .next/, node_modules/, .worker-lab/, next-dev.log), requires typed
  confirmation, then stages exactly those paths. Does not commit or push.
.EXAMPLE
  pwsh automation/git/stage-files.ps1 -Files @("src/app/page.tsx","README.md")
#>
$ErrorActionPreference = "Stop"

param(
  [Parameter(Mandatory = $true)]
  [string[]]$Files
)

function Test-RiskyPath {
  param([string]$Path)
  $p = $Path.Replace('/', '\').TrimStart('\').ToLowerInvariant()
  $name = [System.IO.Path]::GetFileName($p).ToLowerInvariant()
  $ext = [System.IO.Path]::GetExtension($p).ToLowerInvariant()
  if ($name -eq '.env' -or $name -like '.env.*') { return $true }
  if ($name -eq 'next-dev.log') { return $true }
  if ($ext -eq '.db' -or $ext -eq '.db-shm' -or $ext -eq '.db-wal') { return $true }
  if ($p -eq 'data' -or $p.StartsWith('data\')) { return $true }
  if ($p -eq '.next' -or $p.StartsWith('.next\')) { return $true }
  if ($p -eq 'node_modules' -or $p.StartsWith('node_modules\')) { return $true }
  if ($p -eq '.worker-lab' -or $p.StartsWith('.worker-lab\')) { return $true }
  return $false
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
Push-Location $repoRoot
try {
  $resolved = @()
  foreach ($f in $Files) {
    $full = Join-Path $repoRoot $f
    if (-not (Test-Path -LiteralPath $full)) {
      Write-Host ("File not found: {0}" -f $f) -ForegroundColor Red
      exit 1
    }
    if (Test-RiskyPath $f) {
      Write-Host ("Refusing to stage risky path: {0}" -f $f) -ForegroundColor Red
      exit 1
    }
    $resolved += $f
  }

  Write-Host "You are about to stage the following files:" -ForegroundColor Cyan
  $resolved | ForEach-Object { Write-Host ("  {0}" -f $_) }

  $confirm = Read-Host "Type exactly STAGE to continue"
  if ($confirm -ne "STAGE") {
    Write-Host "Aborted; you did not type STAGE." -ForegroundColor Red
    exit 1
  }

  git add -- $resolved
  if ($LASTEXITCODE -ne 0) { throw "git add failed." }

  Write-Host "Staged files (cached):" -ForegroundColor Green
  git diff --cached --name-status
} finally {
  Pop-Location
}
