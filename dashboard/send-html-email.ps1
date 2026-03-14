$ErrorActionPreference = 'Stop'
$htmlPath = Join-Path $PSScriptRoot 'data\email.html'

# IMPORTANT: pass HTML as a FILE reference to avoid argument parsing issues.
# gog supports "@path" for --body-html.

gog send --to khanasif1@gmail.com --subject "Daily Dashboard (HTML)" --body "If you see this, your client doesn't render HTML." --body-html "@$htmlPath" --json
