<#
.SYNOPSIS
  Review staged Git changes and refuse risky paths.
.DESCRIPTION
  Prints git status, staged name-status, stat, and whitespace check. Aborts with a
  non-zero exit if any staged path matches a risky rule (.env, data/, SQLite files,
  .next/, node_modules/, .worker-lab/, next-dev.log). Does not modify Git state.
.EXAMPLE
  pwsh automation/git/review-staged.ps1
#>
$ErrorActionPreference = "Stop"

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
  Write-Host "==> git status" -ForegroundColor Cyan
  git status

  Write-Host "==> git diff --cached --name-status" -ForegroundColor Cyan
  $nameStatus = git diff --cached --name-status

  Write-Host "==> git diff --cached --stat" -ForegroundColor Cyan
  git diff --cached --stat

  Write-Host "==> git diff --cached --check" -ForegroundColor Cyan
  git diff --cached --check
  if ($LASTEXITCODE -ne 0) { throw "git diff --cached --check reported issues." }

  $risky = @()
  foreach ($line in $nameStatus) {
    $parts = $line -split "`t"
    for ($i = 1; $i -lt $parts.Length; $i++) {
      if (Test-RiskyPath $parts[$i]) { $risky += $parts[$i] }
    }
  }

  if ($risky.Count -gt 0) {
    Write-Host "Refusing: risky staged paths detected:" -ForegroundColor Red
    $risky | Sort-Object -Unique | ForEach-Object { Write-Host ("  {0}" -f $_) -ForegroundColor Red }
    exit 1
  }

  Write-Host "Staged review passed (no risky paths)." -ForegroundColor Green
} finally {
  Pop-Location
}
