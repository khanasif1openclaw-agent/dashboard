$ErrorActionPreference = 'Stop'
$htmlPath = (Resolve-Path (Join-Path $PSScriptRoot 'data\email.html')).Path

if (!(Test-Path $htmlPath)) { throw "Missing HTML file: $htmlPath" }

# Send via gog (OAuth)
$html = Get-Content -Raw -Encoding UTF8 -Path $htmlPath
if ([string]::IsNullOrWhiteSpace($html)) { throw "Dashboard email HTML is empty: $htmlPath" }

$to = [Environment]::GetEnvironmentVariable('DASHBOARD_EMAIL_TO')
if ([string]::IsNullOrWhiteSpace($to)) { $to = 'khanasif1@gmail.com' }

gog gmail send --to "$to" --subject "Daily Dashboard" --body "(HTML report)" --body-html @'
$html
'@ --json | Out-Null
Write-Host "[gog] sent"
