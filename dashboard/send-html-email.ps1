$ErrorActionPreference = 'Stop'
$htmlPath = (Resolve-Path (Join-Path $PSScriptRoot 'data\email.html')).Path

if (!(Test-Path $htmlPath)) { throw "Missing HTML file: $htmlPath" }

# Send via gog (OAuth)
# Fail fast if OAuth is expired/invalid.
powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'gog-auth-preflight.ps1')
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$html = Get-Content -Raw -Encoding UTF8 -Path $htmlPath
if ([string]::IsNullOrWhiteSpace($html)) { throw "Dashboard email HTML is empty: $htmlPath" }

$to = [Environment]::GetEnvironmentVariable('DASHBOARD_EMAIL_TO')
if ([string]::IsNullOrWhiteSpace($to)) { $to = 'khanasif1@gmail.com' }

# Avoid Windows CreateProcess command-line length limits by writing HTML to a temp file
# and passing it via @file (gog reads files when the value starts with '@').
$tmp = Join-Path $env:TEMP ("dashboard-email-" + [Guid]::NewGuid().ToString('n') + ".html")
Set-Content -Encoding UTF8 -Path $tmp -Value $html
$bodyHtml = "@" + $tmp

# Send full HTML email (no link, no attachment).
# Use --from (send-as alias) so Gmail recognizes the sender properly.
$today = (Get-Date).ToUniversalTime().ToString('yyyy-MM-dd')
$subject = "Daily Dashboard - $today"

$from = [Environment]::GetEnvironmentVariable('DASHBOARD_EMAIL_FROM')
if ([string]::IsNullOrWhiteSpace($from)) { $from = 'khanasif1openclaw@gmail.com' }

gog gmail send --to "$to" --from "$from" --subject "$subject" --body "Daily Dashboard (HTML)" --body-html "$bodyHtml" --json | Out-Null
Write-Host "[gog] sent (full html)"

# Best-effort cleanup
Remove-Item -ErrorAction SilentlyContinue -Force $tmp
