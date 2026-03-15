$ErrorActionPreference = 'Stop'
$htmlPath = (Resolve-Path (Join-Path $PSScriptRoot 'data\email.html')).Path

if (!(Test-Path $htmlPath)) { throw "Missing HTML file: $htmlPath" }

# gog supports @file expansion for --body-html (must be UNQUOTED).
# We pass it as a single token like @C:\path\to\email.html
$bodyHtmlArg = '@' + $htmlPath

$args = @(
  'send',
  '--to', 'khanasif1@gmail.com',
  '--subject', 'Daily Dashboard (HTML)',
  '--body', "If you see this, your client doesn't render HTML.",
  '--body-html', $bodyHtmlArg,
  '--json'
)

& gog @args
