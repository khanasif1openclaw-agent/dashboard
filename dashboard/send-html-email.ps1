$ErrorActionPreference = 'Stop'
$html = Get-Content -Raw -Encoding UTF8 "${PSScriptRoot}\data\email.html"
# Send HTML email via gog (Gmail). PowerShell will pass $html as a single argument.
gog send --to khanasif1@gmail.com --subject "Daily Dashboard (HTML)" --body "If you see this, your client doesn't render HTML." --body-html $html --json
