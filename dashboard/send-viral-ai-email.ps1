$ErrorActionPreference = 'Stop'

# Build latest viral AI repos list
node (Join-Path $PSScriptRoot 'viral-ai-repos.js') | Out-Null

# Build email HTML
node (Join-Path $PSScriptRoot 'kanban-viral-ai-email.js') | Out-Null

$htmlPath = (Resolve-Path (Join-Path $PSScriptRoot 'data\viral-ai-email.html')).Path
if (!(Test-Path $htmlPath)) { throw "Missing HTML file: $htmlPath" }

# Avoid Windows quoting issues
$html = Get-Content -Raw -Encoding UTF8 -Path $htmlPath
$html = $html -replace '"', "'"

$args = @(
  'send',
  '--to', 'khanasif1@gmail.com',
  '--subject', 'Daily: Viral AI GitHub repos (Top 5)',
  '--body', "If you see this, your client doesn't render HTML.",
  '--body-html', $html,
  '--json'
)

& gog @args
