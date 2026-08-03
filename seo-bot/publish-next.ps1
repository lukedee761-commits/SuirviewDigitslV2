# Publishes one approved article. Registered as three Task Scheduler jobs (Mon/Wed/Fri 09:00).
$ErrorActionPreference = "Continue"
$repo  = "C:\Users\luked\OneDrive\SuirViewDigital-v2"
$log   = Join-Path $repo "seo-bot\run.log"
$stamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
"[$stamp] publish-next starting" | Out-File -Append -Encoding utf8 $log
$node = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $node) { $node = "node" }
& $node (Join-Path $repo "seo-bot\publish-next.mjs") *>> $log
"[$stamp] publish-next exit $LASTEXITCODE" | Out-File -Append -Encoding utf8 $log
