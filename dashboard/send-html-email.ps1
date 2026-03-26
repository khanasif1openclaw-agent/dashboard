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

# Some Gmail accounts will reject large/link-heavy HTML bodies as suspicious.
# Send a safe plain-text email + attach the HTML file instead.
$today = (Get-Date).ToUniversalTime().ToString('yyyy-MM-dd')
$subject = "Daily Dashboard - $today"
$body = "Daily Dashboard for $today\n\nOpen in browser: https://khanasif1openclaw-agent.github.io/dashboard/\n\n(HTML version attached as email.html)"

gog gmail send --to "$to" --subject "$subject" --body "$body" --attach "$htmlPath" --json | Out-Null
Write-Host "[gog] sent (attached html)"
