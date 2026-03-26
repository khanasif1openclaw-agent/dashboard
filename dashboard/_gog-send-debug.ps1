$ErrorActionPreference='Stop'
$htmlPath=(Resolve-Path (Join-Path $PSScriptRoot 'data\email.html')).Path
$html=Get-Content -Raw -Encoding UTF8 $htmlPath

$args=@('gmail','send','--to','khanasif1@gmail.com','--subject','Daily Dashboard - debug ps','--body','(HTML report)','--body-html',$html,'--json')
Write-Host "ARGS_COUNT=$($args.Count)"
Write-Host "HTML_LEN=$($html.Length)"
Write-Host "HTML_START=$($html.Substring(0,[Math]::Min(80,$html.Length)))"
& gog @args
