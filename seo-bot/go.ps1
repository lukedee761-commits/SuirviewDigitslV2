# One command to see where the content routine stands - and move it on.
#   powershell -ExecutionPolicy Bypass -File seo-bot\go.ps1          (status + publish if due)
#   powershell -ExecutionPolicy Bypass -File seo-bot\go.ps1 -Draft   (also draft if nothing queued)
param([switch]$Draft)
$ErrorActionPreference = "Continue"
$repo = "C:\Users\luked\OneDrive\SuirViewDigital-v2"
$node = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $node) { $node = "node" }

Write-Output ""
Write-Output "=== SuirViewDigital content routine ==="

# Topics still to write
$cal = Join-Path $repo "seo-bot\clients\suirviewdigital\calendar.json"
$rows = Get-Content $cal -Raw | ConvertFrom-Json
$queued = @($rows | Where-Object { $_.status -ne 'published' })
Write-Output ("Topics queued      : {0}  (~{1:N0} weeks at 3/week)" -f $queued.Count, ($queued.Count/3))
if ($queued.Count -gt 0) { Write-Output ("Next topic         : {0}" -f $queued[0].title) }

# Approved batch, if any
$appr = Join-Path $repo "seo-bot\.approved"
if (Test-Path $appr) {
  $branch = (Get-Content $appr -Raw).Trim()
  $pending = (& git -C $repo rev-list --count "main..$branch" 2>$null)
  if ($LASTEXITCODE -ne 0) { $pending = "?" }
  Write-Output ("Approved batch     : {0}" -f $branch)
  Write-Output ("Waiting to publish : {0} article(s)" -f $pending)
  Write-Output ""
  Write-Output "Publishing the next one..."
  & $node (Join-Path $repo "seo-bot\publish-next.mjs")
} else {
  Write-Output "Approved batch     : none"
  $draftBranches = @(& git -C $repo branch --list "seo-bot/*" --format="%(refname:short)")
  if ($draftBranches.Count -gt 0) {
    Write-Output ""
    Write-Output "You have drafts waiting to be reviewed:"
    $draftBranches | ForEach-Object { Write-Output ("   {0}" -f $_) }
    Write-Output ""
    Write-Output "Review one, then approve it:"
    Write-Output ("   powershell -ExecutionPolicy Bypass -File seo-bot\approve.ps1 {0}" -f $draftBranches[0])
  } elseif ($Draft) {
    Write-Output ""
    Write-Output "No drafts. Drafting a new batch now..."
    & $node (Join-Path $repo "seo-bot\run-local.mjs")
  } else {
    Write-Output ""
    Write-Output "No drafts waiting. Re-run with -Draft to write a new batch now,"
    Write-Output "or leave it - the Sunday 09:00 task does this automatically."
  }
}
Write-Output ""
