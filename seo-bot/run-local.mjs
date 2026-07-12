// Local monthly runner (Option B — your Claude subscription, no API key, no cost).
// 1) drafts articles via the `claude` CLI  2) runs the quality gate
// 3) commits the drafts to a review branch and returns you to your current branch.
// You then review the branch and MERGE it to publish (or delete it to reject).
import { spawnSync } from "node:child_process";
import { readFileSync, existsSync, unlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const BOT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(BOT_DIR, "..");
const CLIENT = process.env.CLIENT || "suirviewdigital";

function git(args, opts = {}) {
  const r = spawnSync("git", args, { cwd: REPO_ROOT, encoding: "utf8", shell: process.platform === "win32", ...opts });
  if (r.status !== 0 && !opts.allowFail) throw new Error(`git ${args.join(" ")} failed: ${(r.stderr || r.stdout || "").trim()}`);
  return (r.stdout || "").trim();
}
function node(script) {
  const r = spawnSync(process.execPath, [join(BOT_DIR, script)], { cwd: REPO_ROOT, stdio: "inherit", env: process.env });
  return r.status || 0;
}
const scopePaths = ["blog", "sitemap.xml", join("seo-bot", "clients", CLIENT, "calendar.json")];

const startRef = git(["rev-parse", "--abbrev-ref", "HEAD"]);
console.log(`On branch ${startRef}. Drafting for "${CLIENT}"...\n`);

// 1) generate
if (node("generate.mjs") !== 0) { console.error("Generation failed."); process.exit(1); }

// any drafts produced?
const changed = git(["status", "--porcelain", "--", ...scopePaths]);
if (!changed) { console.log("\nNothing new to draft. Exiting."); process.exit(0); }

// 2) quality gate — on failure, revert everything and bail
if (node("quality-gate.mjs") !== 0) {
  console.error("\nQuality gate failed — discarding drafts.");
  try {
    const gen = JSON.parse(readFileSync(join(BOT_DIR, ".generated.json"), "utf8"));
    for (const g of gen) { const f = join(REPO_ROOT, "blog", `${g.slug}.html`); if (existsSync(f)) unlinkSync(f); }
  } catch {}
  git(["checkout", "--", ...scopePaths], { allowFail: true });
  process.exit(1);
}

// 3) commit onto a review branch, then return to where we were
const stamp = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 16);
const branch = `seo-bot/${CLIENT}-${stamp}`;
git(["checkout", "-b", branch]);
git(["add", "--", ...scopePaths]);
git(["commit", "-m", `content: monthly SEO drafts for ${CLIENT}`]);
git(["checkout", startRef]);

const body = existsSync(join(BOT_DIR, ".pr-body.md")) ? readFileSync(join(BOT_DIR, ".pr-body.md"), "utf8") : "";
console.log("\n────────────────────────────────────────");
console.log(body.trim());
console.log("────────────────────────────────────────");
console.log(`\n✅ Drafts committed to branch:  ${branch}`);
console.log(`\nReview & publish:`);
console.log(`   git checkout ${branch}          # look at the drafts`);
console.log(`   (open blog/*.html or run your dev server)`);
console.log(`   git checkout ${startRef} && git merge ${branch} && git push   # PUBLISH`);
console.log(`\nReject:  git branch -D ${branch}   # topics stay queued for next run`);
console.log(`Optional preview: git push -u origin ${branch}  → Vercel builds a preview + open a PR\n`);
