// Wires an already-written article into the site. Deterministic, no LLM.
//
//   node seo-bot/wire-in.mjs <slug>
//
// Adds the Journal index card, the sitemap entry, marks the calendar row
// published, and writes .generated.json so quality-gate.mjs can check it.
// Idempotent: re-running for the same slug will not duplicate anything.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const BOT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(BOT_DIR, "..");
const CLIENT = process.env.CLIENT || "suirviewdigital";
const clientDir = join(BOT_DIR, "clients", CLIENT);

const slug = process.argv[2];
if (!slug) { console.error("usage: node seo-bot/wire-in.mjs <slug>"); process.exit(1); }

const profile = JSON.parse(readFileSync(join(clientDir, "profile.json"), "utf8"));
const calendarPath = join(clientDir, "calendar.json");
const calendar = JSON.parse(readFileSync(calendarPath, "utf8"));
const blogDir = join(REPO_ROOT, profile.blogPath);
const articlePath = join(blogDir, `${slug}.html`);

if (!existsSync(articlePath)) {
  console.error(`No such article: ${articlePath}. Write the HTML before wiring it in.`);
  process.exit(1);
}

const html = readFileSync(articlePath, "utf8");
const row = calendar.find((c) => c.slug === slug);
if (!row) { console.error(`"${slug}" is not in calendar.json.`); process.exit(1); }

const pick = (re, what) => {
  const m = html.match(re);
  if (!m) { console.error(`Article is missing ${what}.`); process.exit(1); }
  return m[1].replace(/<[^>]*>/g, "").trim();
};
const desc = pick(/<meta name="description" content="([^"]*)"/i, "a meta description");
const title = pick(/<h1[^>]*>([\s\S]*?)<\/h1>/i, "an <h1>");
const cluster = row.cluster || "Article";
const dateISO = new Date().toISOString().slice(0, 10);
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const indexPath = join(blogDir, "index.html");
let index = readFileSync(indexPath, "utf8");

// --- normalise the asset version to whatever the site is currently on ---
// The writer can't know the current cache-bust token, and a stale one serves
// old CSS. blog/index.html is the source of truth.
const verMatch = index.match(/styles\.css\?v=([0-9a-z]+)/i);
if (verMatch) {
  const want = verMatch[1];
  const fixed = html
    .replace(/(styles\.css\?v=)[0-9a-z]+/gi, `$1${want}`)
    .replace(/(blog\.css\?v=)[0-9a-z]+/gi, `$1${want}`);
  if (fixed !== html) {
    writeFileSync(articlePath, fixed, "utf8");
    console.log(`  assets: version bumped to ?v=${want}`);
  }
}

// --- Journal index card (newest first) ---
if (index.includes(`href="${slug}.html"`)) {
  console.log(`  index: already lists ${slug} — left alone`);
} else {
  const card =
    `      <a class="card-post" href="${slug}.html">\n` +
    `        <span class="tag">${esc(cluster)}</span>\n` +
    `        <h2>${esc(title)}</h2>\n` +
    `        <p>${esc(desc)}</p>\n` +
    `        <span class="read">Read →</span>\n` +
    `      </a>`;
  const before = index;
  index = index.replace(/(<div class="blog-grid">\s*\n)/, `$1${card}\n`);
  if (index === before) { console.error("Could not find <div class=\"blog-grid\"> in blog/index.html."); process.exit(1); }
  writeFileSync(indexPath, index, "utf8");
  console.log(`  index: card added`);
}

// --- Blog JSON-LD blogPost list on the Journal index ---
// Without this the Blog schema silently drifts out of sync with the articles.
const articleUrl = `${profile.siteUrl}/${profile.blogPath}/${slug}.html`;
index = readFileSync(indexPath, "utf8");
if (index.includes(`"url": "${articleUrl}"`)) {
  console.log(`  blog schema: already lists ${slug} — left alone`);
} else {
  const entry = `      { "@type": "BlogPosting", "headline": ${JSON.stringify(title)}, "url": "${articleUrl}", "datePublished": "${dateISO}" },`;
  const before = index;
  // CRLF-tolerant: these files are checked out with Windows line endings.
  index = index.replace(/("blogPost"\s*:\s*\[[ \t]*\r?\n)/, `$1${entry}\r\n`);
  if (index === before) {
    console.log(`  blog schema: WARNING — could not find the "blogPost" array; add ${slug} by hand`);
  } else {
    writeFileSync(indexPath, index, "utf8");
    console.log(`  blog schema: entry added`);
  }
}

// --- sitemap entry ---
const sitemapPath = join(REPO_ROOT, "sitemap.xml");
let sitemap = readFileSync(sitemapPath, "utf8");
const loc = `${profile.siteUrl}/${profile.blogPath}/${slug}.html`;
if (sitemap.includes(loc)) {
  console.log(`  sitemap: already lists ${slug} — left alone`);
} else {
  const entry =
    `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${dateISO}</lastmod>\n` +
    `    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`;
  const before = sitemap;
  sitemap = sitemap.replace(/\n<\/urlset>/, `\n${entry}\n</urlset>`);
  if (sitemap === before) { console.error("Could not find </urlset> in sitemap.xml."); process.exit(1); }
  writeFileSync(sitemapPath, sitemap, "utf8");
  console.log(`  sitemap: entry added`);
}

// --- calendar (never rewrite an original publish date on a re-run) ---
if (row.status === "published" && row.publishedDate) {
  console.log(`  calendar: already published ${row.publishedDate} — date left alone`);
} else {
  row.status = "published";
  row.publishedDate = dateISO;
  writeFileSync(calendarPath, JSON.stringify(calendar, null, 2) + "\n", "utf8");
  console.log(`  calendar: ${slug} marked published ${dateISO}`);
}

// --- artefact for the quality gate ---
writeFileSync(join(BOT_DIR, ".generated.json"),
  JSON.stringify([{ slug, title, cluster, desc }], null, 2), "utf8");

const left = calendar.filter((c) => c.status !== "published").length;
console.log(`Wired in "${title}". ${left} topic(s) still queued.`);
