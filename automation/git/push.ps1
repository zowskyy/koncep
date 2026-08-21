<#
.SYNOPSIS
  Push the current branch to origin after safety checks and typed confirmation.
.DESCRIPTION
  Refuses to push if there are staged or unstaged tracked changes (ignored files do
  not block). Requires the user to type exactly PUSH, then pushes the current branch
  to origin. Does not stage or commit.
.EXAMPLE
  pwsh automation/git/push.ps1
#>
$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
Push-Location $repoRoot
try {
  $branch = git branch --show-current
  if ([string]::IsNullOrWhiteSpace($branch)) { throw "Could not determine current branch." }

  $staged = git diff --cached --name-only
  $unstaged = git diff --name-only

  Write-Host ("Current branch: {0}" -f $branch) -ForegroundColor Cyan
  git status

  if ($staged.Trim().Length -ne 0) {
    Write-Host "Refusing to push: you have staged changes." -ForegroundColor Red
    exit 1
  }
  if ($unstaged.Trim().Length -ne 0) {
    Write-Host "Refusing to push: you have unstaged tracked changes." -ForegroundColor Red
    exit 1
  }

  $confirm = Read-Host ("Type exactly PUSH to push '{0}' to origin" -f $branch)
  if ($confirm -ne "PUSH") {
    Write-Host "Aborted; you did not type PUSH." -ForegroundColor Red
    exit 1
  }

  git push origin $branch
  if ($LASTEXITCODE -ne 0) { throw "git push failed." }

  git status
  Write-Host "Push complete." -ForegroundColor Green
} finally {
  Pop-Location
}
