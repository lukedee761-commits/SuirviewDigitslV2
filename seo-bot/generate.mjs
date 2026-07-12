// SuirViewDigital content engine — generates GEO-optimised blog articles and
// wires them into the Journal index + sitemap. Run by run-local.mjs (which then
// creates a review branch). Nothing publishes until you merge that branch.
//
// Engine: uses the local `claude` CLI (your subscription — NO API key, NO cost)
// unless ANTHROPIC_API_KEY is set, in which case it uses the pay-per-use API.
//
//   Env: CLIENT (default suirviewdigital), COUNT (default 3),
//        CLAUDE_BIN (default "claude"), MODEL (API mode only, default claude-opus-4-8)
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const BOT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(BOT_DIR, "..");

const CLIENT = process.env.CLIENT || "suirviewdigital";
const COUNT = parseInt(process.env.COUNT || "3", 10);
const CLAUDE_BIN = process.env.CLAUDE_BIN || "claude";
const MODEL = process.env.MODEL || "claude-opus-4-8"; // API mode only
const ENGINE = process.env.ANTHROPIC_API_KEY ? "api" : "claude-code";

const clientDir = join(BOT_DIR, "clients", CLIENT);
const profile = JSON.parse(readFileSync(join(clientDir, "profile.json"), "utf8"));
const calendar = JSON.parse(readFileSync(join(clientDir, "calendar.json"), "utf8"));
const systemPrompt = readFileSync(join(BOT_DIR, "prompts", "article-system-prompt.md"), "utf8");

const blogDir = join(REPO_ROOT, profile.blogPath);
const indexPath = join(blogDir, "index.html");
const sitemapPath = join(REPO_ROOT, "sitemap.xml");

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const now = new Date();
const dateISO = now.toISOString().slice(0, 10);
const dateHuman = `${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
const engineLabel = ENGINE === "api" ? MODEL : "claude CLI (subscription)";

const due = calendar.filter((c) => c.status !== "published" && c.slug && c.title).slice(0, COUNT);
if (due.length === 0) { console.log("No planned articles due. Nothing to generate."); process.exit(0); }
console.log(`Generating ${due.length} article(s) for "${CLIENT}" via ${engineLabel}.`);

// --- the one LLM call, engine-agnostic ---
let _anthropic = null;
async function callModel(system, user) {
  if (ENGINE === "api") {
    if (!_anthropic) { const { default: Anthropic } = await import("@anthropic-ai/sdk"); _anthropic = new Anthropic(); }
    const msg = await _anthropic.messages.create({ model: MODEL, max_tokens: 8000, system, messages: [{ role: "user", content: user }] });
    return msg.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  }
  // claude-code: drive the local CLI with the subscription. Disable its tools so it
  // returns the article as text instead of trying to write the file with its own tools.
  const toolsOff = "Bash Edit Write Read Glob Grep WebFetch WebSearch TodoWrite Task NotebookEdit MultiEdit";
  const cmd = `${CLAUDE_BIN} -p --output-format text --disallowedTools "${toolsOff}"`;
  const res = spawnSync(cmd, {
    input: system + "\n\n---\n\n" + user,
    encoding: "utf8", maxBuffer: 20 * 1024 * 1024, shell: true,
  });
  if (res.error) throw new Error(`claude CLI failed to start (${CLAUDE_BIN}): ${res.error.message}`);
  if (res.status !== 0) throw new Error(`claude CLI exited ${res.status}: ${(res.stderr || "").slice(0, 300)}`);
  return res.stdout || "";
}

function stripFences(s) {
  let t = s.trim();
  if (t.startsWith("```")) t = t.replace(/^```[a-zA-Z]*\n/, "").replace(/\n```\s*$/, "");
  // some CLIs prepend chatter — start at the doctype if present
  const i = t.toLowerCase().indexOf("<!doctype html");
  return (i > 0 ? t.slice(i) : t).trim();
}
function metaDescriptionOf(html) {
  const m = html.match(/<meta name="description" content="([^"]*)"/i);
  return m ? m[1] : "";
}
function esc(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

async function writeArticle(item) {
  const canonicalUrl = `${profile.siteUrl}/${profile.blogPath}/${item.slug}.html`;
  const payload = { profile, item, slug: item.slug, canonicalUrl, dateISO, dateHuman };
  const userContent = "Write the article for this payload:\n\n" + JSON.stringify(payload, null, 2);
  const html = stripFences(await callModel(systemPrompt, userContent));
  if (!/^<!doctype html/i.test(html)) throw new Error(`model did not return an HTML document for ${item.slug}`);
  writeFileSync(join(blogDir, `${item.slug}.html`), html + "\n", "utf8");
  console.log(`  ✓ ${item.slug}.html`);
  return { slug: item.slug, title: item.title, cluster: item.cluster || "Article", desc: metaDescriptionOf(html) };
}

const generated = [];
for (const item of due) {
  try {
    generated.push(await writeArticle(item));
    const row = calendar.find((c) => c.slug === item.slug);
    row.status = "published";
    row.publishedDate = dateISO;
  } catch (err) {
    console.error(`  ✗ ${item.slug}: ${err.message}`);
  }
}
if (generated.length === 0) { console.error("All generations failed."); process.exit(1); }

// --- wire new cards into the Journal index (newest first) ---
let index = readFileSync(indexPath, "utf8");
const cards = generated.map((g) =>
  `      <a class="card-post" href="${g.slug}.html">\n` +
  `        <span class="tag">${esc(g.cluster)}</span>\n` +
  `        <h2>${esc(g.title)}</h2>\n` +
  `        <p>${esc(g.desc)}</p>\n` +
  `        <span class="read">Read →</span>\n` +
  `      </a>`
).join("\n");
index = index.replace(/(<div class="blog-grid">\s*\n)/, `$1${cards}\n`);
writeFileSync(indexPath, index, "utf8");

// --- add new URLs to sitemap.xml ---
let sitemap = readFileSync(sitemapPath, "utf8");
const urls = generated.map((g) =>
  `  <url>\n    <loc>${profile.siteUrl}/${profile.blogPath}/${g.slug}.html</loc>\n` +
  `    <lastmod>${dateISO}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`
).join("\n");
sitemap = sitemap.replace(/\n<\/urlset>/, `\n${urls}\n</urlset>`);
writeFileSync(sitemapPath, sitemap, "utf8");

// --- persist calendar (mark generated items published) ---
writeFileSync(join(clientDir, "calendar.json"), JSON.stringify(calendar, null, 2) + "\n", "utf8");

// --- artefacts for the quality gate + review summary ---
writeFileSync(join(BOT_DIR, ".generated.json"), JSON.stringify(generated, null, 2), "utf8");
const prBody =
  `## 📝 ${generated.length} new draft article(s) for ${CLIENT}\n\n` +
  `Engine: ${engineLabel} · ${dateHuman}\n\n` +
  generated.map((g) => `- ${g.title} — /${profile.blogPath}/${g.slug}.html (${g.cluster})`).join("\n") +
  `\n\nReview these, then merge to publish (or discard the branch to reject — they stay queued).\n`;
writeFileSync(join(BOT_DIR, ".pr-body.md"), prBody, "utf8");

console.log(`Done. ${generated.length} article(s) drafted, index + sitemap updated, calendar marked.`);
