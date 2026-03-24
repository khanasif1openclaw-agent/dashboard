$ErrorActionPreference = 'Stop'
$htmlPath = (Resolve-Path (Join-Path $PSScriptRoot 'data\email.html')).Path

if (!(Test-Path $htmlPath)) { throw "Missing HTML file: $htmlPath" }

# Send via SMTP (Gmail app password) to avoid OAuth token revocation issues.
& powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'send-email-smtp.ps1') `
  -Subject 'Daily Dashboard (HTML)' `
  -HtmlPath $htmlPath
