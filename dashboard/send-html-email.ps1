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

# Send a plain-text summary + attach the generated HTML.
# Use --from (send-as alias) so Gmail recognizes the sender properly.
$today = (Get-Date).ToUniversalTime().ToString('yyyy-MM-dd')
$subject = "Daily Dashboard - $today"
$body = "Daily Dashboard for $today\n\nDashboard link: https://khanasif1openclaw-agent.github.io/dashboard/\n\n(HTML attached as email.html)"

$from = [Environment]::GetEnvironmentVariable('DASHBOARD_EMAIL_FROM')
if ([string]::IsNullOrWhiteSpace($from)) { $from = 'khanasif1openclaw@gmail.com' }

gog gmail send --to "$to" --from "$from" --subject "$subject" --body "$body" --attach "$htmlPath" --json | Out-Null
Write-Host "[gog] sent (send-as + attachment)"
