# Monthly SEO drafts — uses your Claude subscription (no API key, no cost).
# Registered in Task Scheduler; logs to seo-bot\run.log.
$ErrorActionPreference = "Continue"
$repo  = "C:\Users\luked\OneDrive\SuirViewDigital-v2"
$log   = Join-Path $repo "seo-bot\run.log"
$stamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
"[$stamp] run-local starting" | Out-File -Append -Encoding utf8 $log
$node = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $node) { $node = "node" }
& $node (Join-Path $repo "seo-bot\run-local.mjs") *>> $log
"[$stamp] run-local exit $LASTEXITCODE" | Out-File -Append -Encoding utf8 $log
