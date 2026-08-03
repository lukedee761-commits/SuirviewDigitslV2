# Weekly SEO drafts - uses your Claude subscription (no API key, no cost).
# Registered in Task Scheduler as "SuirView SEO drafts" (Sundays 09:00).
# Drafts COUNT articles to a review branch. NOTHING publishes until you merge.
$ErrorActionPreference = "Continue"
$repo  = "C:\Users\luked\OneDrive\SuirViewDigital-v2"
$log   = Join-Path $repo "seo-bot\run.log"
$stamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

# 3 articles per weekly run = the Mon/Wed/Fri publishing cadence.
$env:COUNT = "3"

"[$stamp] run-local starting (COUNT=$env:COUNT)" | Out-File -Append -Encoding utf8 $log
$node = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $node) { $node = "node" }
& $node (Join-Path $repo "seo-bot\run-local.mjs") *>> $log
"[$stamp] run-local exit $LASTEXITCODE" | Out-File -Append -Encoding utf8 $log
