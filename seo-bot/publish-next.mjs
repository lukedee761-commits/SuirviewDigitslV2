// Publishes exactly ONE approved article to main, then pushes (Vercel deploys).
// Run by Task Scheduler each Mon/Wed/Fri. Does nothing unless you have explicitly
// approved a branch with approve.ps1 — an unreviewed draft can never reach main.
//
// It cherry-picks a single commit, which is why run-local.mjs makes one commit
// per article.
import { spawnSync } from "node:child_process";
import { readFileSync, existsSync, unlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const BOT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(BOT_DIR, "..");
const APPROVED = join(BOT_DIR, ".approved");
const MAIN = process.env.MAIN_BRANCH || "main";
const DRY = process.argv.includes("--dry-run");

function git(args, opts = {}) {
  const r = spawnSync("git", args, { cwd: REPO_ROOT, encoding: "utf8", ...opts });
  if (r.status !== 0 && !opts.allowFail)
    throw new Error(`git ${args.join(" ")} failed: ${(r.stderr || r.stdout || "").trim()}`);
  return (r.stdout || "").trim();
}
const say = (m) => console.log(`[publish-next] ${m}`);

if (!existsSync(APPROVED)) {
  say("No approved branch (seo-bot/.approved absent). Nothing to publish — this is normal.");
  process.exit(0);
}
const branch = readFileSync(APPROVED, "utf8").trim();
if (!branch) { say("Approval file is empty. Nothing to do."); process.exit(0); }

if (!git(["rev-parse", "--verify", branch], { allowFail: true })) {
  say(`Approved branch "${branch}" no longer exists. Clearing approval.`);
  unlinkSync(APPROVED);
  process.exit(0);
}

if (git(["status", "--porcelain"])) {
  say("ERROR: working tree is dirty. Refusing to publish — resolve by hand.");
  process.exit(1);
}

const startRef = git(["rev-parse", "--abbrev-ref", "HEAD"]);
if (startRef !== MAIN) git(["checkout", MAIN]);

// Oldest commit on the branch that is not yet on main = next article due.
const pending = git(["rev-list", "--reverse", `${MAIN}..${branch}`]).split("\n").filter(Boolean);
if (pending.length === 0) {
  say(`All articles from "${branch}" are published. Clearing approval and deleting the branch.`);
  if (!DRY) {
    unlinkSync(APPROVED);
    git(["branch", "-D", branch], { allowFail: true });
  }
  process.exit(0);
}

const sha = pending[0];
const subject = git(["log", "-1", "--format=%s", sha]);
say(`Next up: ${subject}  (${sha.slice(0, 8)}) — ${pending.length - 1} will remain after this.`);

if (DRY) { say("Dry run — nothing changed."); process.exit(0); }

try {
  git(["cherry-pick", sha]);
} catch (e) {
  say(`ERROR: cherry-pick failed — ${e.message}`);
  git(["cherry-pick", "--abort"], { allowFail: true });
  process.exit(1);
}

try {
  git(["push", "origin", MAIN]);
} catch (e) {
  say(`ERROR: pushed nothing — ${e.message}. The commit is on local ${MAIN}; push by hand.`);
  process.exit(1);
}

say(`Published: ${subject}. Vercel will deploy shortly.`);
if (pending.length - 1 === 0) {
  say("That was the last one — clearing approval and removing the branch.");
  unlinkSync(APPROVED);
  git(["branch", "-D", branch], { allowFail: true });
}
