param(
  [Parameter(Mandatory=$true)][string]$Subject,
  [Parameter(Mandatory=$true)][string]$HtmlPath,
  [string]$TextBody = "If you see this, your client doesn't render HTML."
)

$ErrorActionPreference = 'Stop'

# Optional local secrets file
$secretsPath = Join-Path $PSScriptRoot '.secrets.ps1'
if (Test-Path $secretsPath) {
  . $secretsPath
}

function Require-Env($name) {
  $v = [Environment]::GetEnvironmentVariable($name)
  if ([string]::IsNullOrWhiteSpace($v)) { throw "Missing required env var: $name" }
  return $v
}

if (!(Test-Path $HtmlPath)) { throw "Missing HTML file: $HtmlPath" }

$smtpUser = Require-Env 'DASHBOARD_SMTP_USER'
$appPass  = Require-Env 'DASHBOARD_SMTP_APP_PASSWORD'
$from     = [Environment]::GetEnvironmentVariable('DASHBOARD_SMTP_FROM'); if ([string]::IsNullOrWhiteSpace($from)) { $from = $smtpUser }
$to       = Require-Env 'DASHBOARD_SMTP_TO'

# App passwords sometimes shown with spaces; strip them.
$appPass = $appPass -replace '\s',''

$html = Get-Content -Raw -Encoding UTF8 -Path $HtmlPath

$secure = ConvertTo-SecureString $appPass -AsPlainText -Force
$cred   = New-Object System.Management.Automation.PSCredential($smtpUser, $secure)

# Prefer HTML body (this is what we generated). Fallback to TextBody only if HTML is empty.
$body = $html
if ([string]::IsNullOrWhiteSpace($body)) { $body = $TextBody }

Send-MailMessage `
  -SmtpServer 'smtp.gmail.com' `
  -Port 587 `
  -UseSsl `
  -Credential $cred `
  -From $from `
  -To $to `
  -Subject $Subject `
  -Body $body `
  -BodyAsHtml

Write-Host "[smtp] sent"
