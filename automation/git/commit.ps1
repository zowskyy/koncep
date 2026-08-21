<#
.SYNOPSIS
  Commit staged changes after a risky-path review and typed confirmation.
.DESCRIPTION
  Runs review-staged.ps1, aborts if nothing is staged, shows the message, requires
  the user to type exactly COMMIT, then runs git commit -m <Message>. Does not push.
.EXAMPLE
  pwsh automation/git/commit.ps1 -Message "Add contributor interest feature"
#>
param(
  [Parameter(Mandatory = $true)]
  [string]$Message
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
Push-Location $repoRoot
try {
  $reviewScript = Join-Path $PSScriptRoot "review-staged.ps1"
  Write-Host "==> Running staged review" -ForegroundColor Cyan
  & $reviewScript
  if ($LASTEXITCODE -ne 0) { throw "Staged review failed; aborting commit." }

  $staged = git diff --cached --name-only
  if ($staged.Trim().Length -eq 0) {
    Write-Host "Nothing is staged; aborting commit." -ForegroundColor Red
    exit 1
  }

  Write-Host ("Commit message:`n  {0}" -f $Message) -ForegroundColor Cyan
  $confirm = Read-Host "Type exactly COMMIT to proceed"
  if ($confirm -ne "COMMIT") {
    Write-Host "Aborted; you did not type COMMIT." -ForegroundColor Red
    exit 1
  }

  git commit -m $Message
  if ($LASTEXITCODE -ne 0) { throw "git commit failed." }

  git log -1 --oneline
  git status
  Write-Host "Commit complete." -ForegroundColor Green
} finally {
  Pop-Location
}
