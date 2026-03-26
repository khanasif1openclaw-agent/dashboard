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

# IMPORTANT: pass HTML as a single argument; use a PowerShell here-string.
$here = @'
'@ + $html + @'
'@

gog gmail send --to "$to" --subject "Daily Kanban Status" --body "(HTML report)" --body-html $here --json | Out-Null
Write-Host "[gog] sent"
