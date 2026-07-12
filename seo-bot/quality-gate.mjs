// Fails the CI run (exit 1) if any freshly generated article is off-spec, so a
// broken or thin draft never reaches a PR. Reads seo-bot/.generated.json.
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const BOT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(BOT_DIR, "..");
const manifestPath = join(BOT_DIR, ".generated.json");

if (!existsSync(manifestPath)) { console.log("No .generated.json — nothing to check."); process.exit(0); }
const generated = JSON.parse(readFileSync(manifestPath, "utf8"));
if (generated.length === 0) { console.log("Nothing generated — nothing to check."); process.exit(0); }

const CLIENT = process.env.CLIENT || "suirviewdigital";
const profile = JSON.parse(readFileSync(join(BOT_DIR, "clients", CLIENT, "profile.json"), "utf8"));
const blogDir = join(REPO_ROOT, profile.blogPath);

function wordCount(html) {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text ? text.split(" ").length : 0;
}
function jsonLdTypes(html) {
  const types = [];
  const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    try { types.push(JSON.parse(m[1])["@type"]); } catch { types.push("PARSE_ERROR"); }
  }
  return types;
}

let failed = 0;
for (const g of generated) {
  const file = join(blogDir, `${g.slug}.html`);
  const problems = [];
  if (!existsSync(file)) { console.error(`✗ ${g.slug}: file missing`); failed++; continue; }
  const html = readFileSync(file, "utf8");
  const types = jsonLdTypes(html);

  if (!/^<!doctype html/i.test(html.trim())) problems.push("not an HTML document");
  if (!types.includes("BlogPosting")) problems.push("missing/!valid BlogPosting JSON-LD");
  if (!types.includes("FAQPage")) problems.push("missing/!valid FAQPage JSON-LD");
  if (!/class="tldr"/.test(html)) problems.push("no TL;DR");
  if (!/class="takeaways"/.test(html)) problems.push("no key-takeaways table");
  if (!/class="post-faq"/.test(html)) problems.push("no FAQ section");
  if (!/blockquote class="expert"/.test(html)) problems.push("no expert quote");
  if (!/class="stat"/.test(html)) problems.push("no attributed statistic");
  if (!/href="tel:/.test(html)) problems.push("no phone CTA");
  if (!/href="\.\.\/index\.html/.test(html)) problems.push("no internal link to the site");
  const wc = wordCount(html);
  if (wc < 600 || wc > 2200) problems.push(`word count ${wc} out of range (600–2200)`);

  if (problems.length) { console.error(`✗ ${g.slug}: ${problems.join("; ")}`); failed++; }
  else console.log(`✓ ${g.slug} (${wc} words, JSON-LD: ${types.join(", ")})`);
}

if (failed) { console.error(`\nQuality gate FAILED: ${failed} article(s) off-spec.`); process.exit(1); }
console.log(`\nQuality gate passed: ${generated.length} article(s) OK.`);
