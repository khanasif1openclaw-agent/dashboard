$ErrorActionPreference = 'Stop'
$htmlPath = (Resolve-Path (Join-Path $PSScriptRoot 'data\email.html')).Path

if (!(Test-Path $htmlPath)) { throw "Missing HTML file: $htmlPath" }

# Pass HTML content inline.
# NOTE: Windows process arg quoting is fragile when the argument contains lots of double-quotes.
# To avoid the CLI seeing stray tokens (what you experienced), we rewrite attribute quotes to
# single-quotes before sending.
$html = Get-Content -Raw -Encoding UTF8 -Path $htmlPath
$html = $html -replace '"', "'"

$args = @(
  'send',
  '--to', 'khanasif1@gmail.com',
  '--subject', 'Daily Dashboard (HTML)',
  '--body', "If you see this, your client doesn't render HTML.",
  '--body-html', $html,
  '--json'
)

& gog @args
