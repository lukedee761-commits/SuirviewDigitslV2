// Local weekly runner (your Claude subscription — no API key, no cost).
// Drafts BATCH articles, ONE COMMIT PER ARTICLE, onto a single review branch.
// One commit per article is what makes the Mon/Wed/Fri drip possible:
// publish-next.mjs cherry-picks a single commit at a time onto main.
//
// You review the branch, then approve it once (seo-bot/approve.ps1).
// Nothing reaches main until publish-next.mjs picks it up.
import { spawnSync } from "node:child_process";
import { readFileSync, existsSync, unlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const BOT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(BOT_DIR, "..");
const CLIENT = process.env.CLIENT || "suirviewdigital";
const BATCH = parseInt(process.env.COUNT || "3", 10);

function git(args, opts = {}) {
  const r = spawnSync("git", args, { cwd: REPO_ROOT, encoding: "utf8", ...opts });
  if (r.status !== 0 && !opts.allowFail)
    throw new Error(`git ${args.join(" ")} failed: ${(r.stderr || r.stdout || "").trim()}`);
  return (r.stdout || "").trim();
}
function node(script, env = {}) {
  const r = spawnSync(process.execPath, [join(BOT_DIR, script)], {
    cwd: REPO_ROOT, stdio: "inherit", env: { ...process.env, ...env },
  });
  return r.status || 0;
}

const scopePaths = ["blog", "sitemap.xml", join("seo-bot", "clients", CLIENT, "calendar.json")];
const startRef = git(["rev-parse", "--abbrev-ref", "HEAD"]);

if (git(["status", "--porcelain"])) {
  console.error("Working tree is dirty. Commit or stash first — refusing to run.");
  process.exit(1);
}

const stamp = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 16);
const branch = `seo-bot/${CLIENT}-${stamp}`;
console.log(`On ${startRef}. Drafting ${BATCH} article(s) for "${CLIENT}" onto ${branch}.\n`);
git(["checkout", "-b", branch]);

const drafted = [];
let aborted = null;

for (let i = 1; i <= BATCH; i++) {
  console.log(`\n─── article ${i} of ${BATCH} ───`);

  // Generate exactly one, so the commit that follows contains exactly one article.
  if (node("generate.mjs", { COUNT: "1" }) !== 0) { aborted = `generation failed on article ${i}`; break; }

  if (!git(["status", "--porcelain", "--", ...scopePaths])) {
    console.log("Nothing left in the calendar to draft.");
    break;
  }

  // Gate this article alone. On failure, bin it and stop — earlier commits stand.
  if (node("quality-gate.mjs") !== 0) {
    try {
      const gen = JSON.parse(readFileSync(join(BOT_DIR, ".generated.json"), "utf8"));
      for (const g of gen) {
        const f = join(REPO_ROOT, "blog", `${g.slug}.html`);
        if (existsSync(f)) unlinkSync(f);
      }
    } catch {}
    git(["checkout", "--", ...scopePaths], { allowFail: true });
    aborted = `quality gate rejected article ${i}`;
    break;
  }

  let slug = `article-${i}`;
  try { slug = JSON.parse(readFileSync(join(BOT_DIR, ".generated.json"), "utf8"))[0].slug; } catch {}

  git(["add", "--", ...scopePaths]);
  git(["commit", "-m", `content: ${slug}`]);
  drafted.push(slug);
  console.log(`  committed: ${slug}`);
}

git(["checkout", startRef]);

if (drafted.length === 0) {
  git(["branch", "-D", branch], { allowFail: true });
  console.error(`\nNo articles drafted${aborted ? ` — ${aborted}` : ""}. Branch removed.`);
  process.exit(1);
}

console.log("\n────────────────────────────────────────");
console.log(`${drafted.length} draft(s) on ${branch}, one commit each:`);
drafted.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
if (aborted) console.log(`\n⚠ stopped early — ${aborted}`);
console.log("────────────────────────────────────────");
console.log(`\nReview:   git checkout ${branch}`);
console.log(`Approve:  powershell -ExecutionPolicy Bypass -File seo-bot\\approve.ps1 ${branch}`);
console.log(`          → one article then publishes each Mon/Wed/Fri at 09:00.`);
console.log(`Reject:   git branch -D ${branch}   (topics return to the queue)\n`);
