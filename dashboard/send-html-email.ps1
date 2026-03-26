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

# Gmail is blocking the Dashboard emails (likely due to HTML/link/attachment signals).
# Send a minimal plain-text email only (no HTML body, no attachments).
$today = (Get-Date).ToUniversalTime().ToString('yyyy-MM-dd')
$subject = "Daily Dashboard - $today"
$body = "Daily Dashboard for $today.\n\nDashboard link: https://khanasif1openclaw-agent.github.io/dashboard/\n"

# Note: keep it simple; no attachments.
gog gmail send --to "$to" --subject "$subject" --body "$body" --json | Out-Null
Write-Host "[gog] sent (plain text)"
