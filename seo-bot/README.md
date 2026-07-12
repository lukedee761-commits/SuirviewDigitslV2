# seo-bot — auto-drafted blog content (local, free)

Monthly, this drafts GEO-optimised blog articles using **your Claude subscription via the
`claude` CLI** — no API key, no per-use cost. It runs a quality gate, then commits the
drafts to a **review branch**. **Nothing publishes until you merge that branch.**

```
Scheduled task (1st of month) ─▶ run-local.mjs
    ├─ generate.mjs      drafts articles via `claude -p` (your subscription)
    ├─ quality-gate.mjs  rejects anything off-spec (missing schema/TL;DR/FAQ/stat/CTA)
    └─ git               commits drafts to branch  seo-bot/<client>-<date>
                                     │
                        you review, then merge to publish → Vercel deploys
```

## Requirements
- **Node** (installed) · **Git** · the **`claude` CLI, logged in** (you already use it).
- Your PC on when the task runs.
- **Cost: €0** — it uses your Claude subscription. Heavy months count against normal subscription usage.

## Run it now (manual test)
```powershell
cd C:\Users\luked\OneDrive\SuirViewDigital-v2
node seo-bot\run-local.mjs
```
It drafts 3 articles, commits them to a branch, and prints exactly how to review + publish.

## Review & publish
```
git checkout seo-bot/suirviewdigital-<date>       # inspect the drafts
#   open blog/*.html, or run your dev server
git checkout main && git merge seo-bot/... && git push   # PUBLISH (Vercel deploys)
git branch -D seo-bot/...                          # REJECT (topics stay queued)
```
Want a live preview first? `git push -u origin <branch>` → Vercel builds a preview URL and you open a PR.

## Schedule it monthly (Task Scheduler)
Paste this into **Command Prompt** (edit the path if the repo moves):
```
schtasks /Create /TN "SuirView SEO drafts" /SC MONTHLY /D 1 /ST 09:00 /TR "powershell -NoProfile -ExecutionPolicy Bypass -File \"C:\Users\luked\OneDrive\SuirViewDigital-v2\seo-bot\run.ps1\""
```
Logs go to `seo-bot\run.log`. Remove with `schtasks /Delete /TN "SuirView SEO drafts" /F`.

## Options (env vars)
- `CLIENT` (default `suirviewdigital`) · `COUNT` (default `3`)
- `CLAUDE_BIN` — set if `claude` isn't on PATH
- Set `ANTHROPIC_API_KEY` to switch to the paid API engine instead (`MODEL` then applies, default `claude-opus-4-8`).

## How the calendar works
`clients/<client>/calendar.json` is the queue. `"status":"planned"` items get drafted
oldest-first (up to `COUNT`); on merge they're marked `"published"` and never regenerated.
Reject a branch and they stay `planned` for next time.

## Add another client
Copy `clients/suirviewdigital/` to `clients/<slug>/`, edit the profile + calendar, run with
`CLIENT=<slug>`. The client site needs a `/blog/` (with `blog.css`) and a `sitemap.xml` like this repo.
