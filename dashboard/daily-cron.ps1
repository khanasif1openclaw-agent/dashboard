$ErrorActionPreference = 'Stop'

$repo = Join-Path $PSScriptRoot '.'
Set-Location $repo

# Use UTC date for paths/names
$today = (Get-Date).ToUniversalTime().ToString('yyyy-MM-dd')
$snapDir = Join-Path $repo (Join-Path 'snapshots' $today)
New-Item -ItemType Directory -Force -Path $snapDir | Out-Null

Write-Host "[dashboard] building content.json..."
node .\build.js

Write-Host "[dashboard] generating email.html..."
node .\make-email.js

# Keep a dated snapshot for history in the repo
Copy-Item -Force .\data\content.json (Join-Path $snapDir 'content.json')
Copy-Item -Force .\index.html (Join-Path $snapDir 'index.html')
Copy-Item -Force .\data\email.html (Join-Path $snapDir 'email.html')

Write-Host "[dashboard] sending email via gog..."
powershell -NoProfile -ExecutionPolicy Bypass -File .\send-html-email.ps1
if ($LASTEXITCODE -ne 0) {
  throw "Email send failed (exit code $LASTEXITCODE)"
}

Write-Host "[dashboard] committing + pushing to GitHub..."

# Fail fast in non-interactive contexts (cron/CI)
$env:GIT_TERMINAL_PROMPT = "0"
$env:GCM_INTERACTIVE = "Never"

git add -A
# Commit only if there are changes
$changed = git status --porcelain
if ($changed) {
  git commit -m "Daily dashboard: $today"
  if ($LASTEXITCODE -ne 0) { throw "git commit failed (exit code $LASTEXITCODE)" }

  git push
  if ($LASTEXITCODE -ne 0) { throw "git push failed (exit code $LASTEXITCODE)" }
} else {
  Write-Host "[dashboard] no changes to commit."
}

Write-Host "[dashboard] done."
