$ErrorActionPreference = 'Stop'

# Generate the kanban email HTML
node (Join-Path $PSScriptRoot 'kanban-email.js') | Out-Null

$htmlPath = (Resolve-Path (Join-Path $PSScriptRoot 'data\kanban-email.html')).Path
if (!(Test-Path $htmlPath)) { throw "Missing HTML file: $htmlPath" }

# Send via gog (OAuth). More reliable than SMTP/app-passwords.
$html = Get-Content -Raw -Encoding UTF8 -Path $htmlPath
if ([string]::IsNullOrWhiteSpace($html)) { throw "Kanban email HTML is empty: $htmlPath" }

$to = [Environment]::GetEnvironmentVariable('DASHBOARD_EMAIL_TO')
if ([string]::IsNullOrWhiteSpace($to)) { $to = 'khanasif1@gmail.com' }

# PowerShell/Windows command-line parsing breaks if an argument contains newlines.
# Also, embedded double-quotes can confuse quoting. So we make HTML a single line and
# swap double-quotes to single-quotes (safe for HTML attributes).
$bodyHtml = $html -replace "`r`n","" -replace "`n","" -replace '"',''''

gog gmail send --to "$to" --subject "Daily Kanban Status" --body "(HTML report)" --body-html "$bodyHtml" --json | Out-Null
Write-Host "[gog] sent"
