$ErrorActionPreference = 'Stop'

# Build latest viral AI repos list
node (Join-Path $PSScriptRoot 'viral-ai-repos.js') | Out-Null

# Build email HTML
node (Join-Path $PSScriptRoot 'kanban-viral-ai-email.js') | Out-Null

$htmlPath = (Resolve-Path (Join-Path $PSScriptRoot 'data\viral-ai-email.html')).Path
if (!(Test-Path $htmlPath)) { throw "Missing HTML file: $htmlPath" }

# Send via SMTP (Gmail app password) to avoid OAuth token revocation issues.
& powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'send-email-smtp.ps1') `
  -Subject 'Daily: Viral AI GitHub repos (Top 5)' `
  -HtmlPath $htmlPath
