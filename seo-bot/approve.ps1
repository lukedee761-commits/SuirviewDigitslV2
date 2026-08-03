# Approve a reviewed draft branch for Mon/Wed/Fri publishing.
#   powershell -ExecutionPolicy Bypass -File seo-bot\approve.ps1 seo-bot/suirviewdigital-2026-08-09-09-00
# Writing this file is the ONLY thing that lets publish-next.mjs touch main.
param([Parameter(Mandatory=$true)][string]$Branch)
$repo = "C:\Users\luked\OneDrive\SuirViewDigital-v2"
& git -C $repo rev-parse --verify $Branch *> $null
if ($LASTEXITCODE -ne 0) { Write-Error "Branch '$Branch' does not exist."; exit 1 }
$n = (& git -C $repo rev-list --count "main..$Branch")
Set-Content -Path (Join-Path $repo "seo-bot\.approved") -Value $Branch -Encoding utf8 -NoNewline
Write-Output "Approved: $Branch"
Write-Output "$n article(s) queued - one publishes each Mon/Wed/Fri at 09:00."
