$ErrorActionPreference = 'Stop'

# Non-destructive call that requires a valid Gmail OAuth access token.
# If the refresh token is revoked/expired you'll typically see "invalid_grant".
try {
  $out = (& gog gmail labels list --json 2>&1)
  if ($LASTEXITCODE -ne 0) { throw "gog gmail labels list failed (exit code $LASTEXITCODE): $out" }
  Write-Host "[gog] auth OK"
} catch {
  Write-Host "[gog] auth check FAILED"
  Write-Host $_
  throw "gog auth check failed. Fix by running: gog login khanasif1openclaw@gmail.com"
}
