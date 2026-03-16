$ErrorActionPreference = 'Stop'

# Generate the kanban email HTML
node (Join-Path $PSScriptRoot 'kanban-email.js') | Out-Null

$htmlPath = (Resolve-Path (Join-Path $PSScriptRoot 'data\kanban-email.html')).Path
if (!(Test-Path $htmlPath)) { throw "Missing HTML file: $htmlPath" }

# Avoid Windows quoting issues: rewrite double-quotes to single-quotes
$html = Get-Content -Raw -Encoding UTF8 -Path $htmlPath
$html = $html -replace '"', "'"

$args = @(
  'send',
  '--to', 'khanasif1@gmail.com',
  '--subject', 'Daily Kanban Status',
  '--body', "If you see this, your client doesn't render HTML.",
  '--body-html', $html,
  '--json'
)

& gog @args
