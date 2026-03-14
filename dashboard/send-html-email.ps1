$ErrorActionPreference = 'Stop'
$htmlPath = (Resolve-Path (Join-Path $PSScriptRoot 'data\email.html')).Path

# IMPORTANT:
# - Passing raw HTML inline breaks argument parsing.
# - gog supports @file expansion for --body-html, but it must be an unquoted argument.

$bodyHtmlArg = '@' + $htmlPath

if (!(Test-Path $htmlPath)) { throw "Missing HTML file: $htmlPath" }

gog send --to khanasif1@gmail.com --subject "Daily Dashboard (HTML)" --body "If you see this, your client doesn't render HTML." --body-html $bodyHtmlArg --json
