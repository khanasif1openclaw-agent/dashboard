$ErrorActionPreference = 'Stop'
$htmlPath = (Resolve-Path (Join-Path $PSScriptRoot 'data\email.html')).Path

if (!(Test-Path $htmlPath)) { throw "Missing HTML file: $htmlPath" }

# Send via gog (OAuth)
$html = Get-Content -Raw -Encoding UTF8 -Path $htmlPath
if ([string]::IsNullOrWhiteSpace($html)) { throw "Dashboard email HTML is empty: $htmlPath" }

$to = [Environment]::GetEnvironmentVariable('DASHBOARD_EMAIL_TO')
if ([string]::IsNullOrWhiteSpace($to)) { $to = 'khanasif1@gmail.com' }

# PowerShell/Windows command-line parsing breaks if an argument contains newlines.
# Also, embedded double-quotes can confuse quoting. So we make HTML a single line and
# swap double-quotes to single-quotes (safe for HTML attributes).
$bodyHtml = $html -replace "`r`n","" -replace "`n","" -replace '"',''''

# Send full HTML email (no link, no attachment).
# Use --from (send-as alias) so Gmail recognizes the sender properly.
$today = (Get-Date).ToUniversalTime().ToString('yyyy-MM-dd')
$subject = "Daily Dashboard - $today"

$from = [Environment]::GetEnvironmentVariable('DASHBOARD_EMAIL_FROM')
if ([string]::IsNullOrWhiteSpace($from)) { $from = 'khanasif1openclaw@gmail.com' }

# Windows command-line parsing breaks on multiline args; send HTML as one line.
# Also swap double-quotes to single-quotes to avoid quoting issues.
$bodyHtml = $html -replace "`r`n","" -replace "`n","" -replace '"',''''

gog gmail send --to "$to" --from "$from" --subject "$subject" --body "Daily Dashboard (HTML)" --body-html "$bodyHtml" --json | Out-Null
Write-Host "[gog] sent (full html)"
