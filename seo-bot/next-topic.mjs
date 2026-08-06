// Prints everything needed to write the next queued article — and nothing else.
// No LLM call: the scheduled Claude session IS the writer, so shelling out to
// `claude -p` (Claude calling Claude) is pure waste.
//
//   node seo-bot/next-topic.mjs          -> payload for the next queued topic
//   node seo-bot/next-topic.mjs --count  -> just how many topics remain
//
// Exit 0 with a payload, or exit 3 when the calendar is empty (so the caller
// can tell "nothing to do" apart from "something broke").
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const BOT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(BOT_DIR, "..");
const CLIENT = process.env.CLIENT || "suirviewdigital";
const clientDir = join(BOT_DIR, "clients", CLIENT);

const profile = JSON.parse(readFileSync(join(clientDir, "profile.json"), "utf8"));
const calendar = JSON.parse(readFileSync(join(clientDir, "calendar.json"), "utf8"));
const blogDir = join(REPO_ROOT, profile.blogPath);

const queued = calendar.filter((c) => c.status !== "published" && c.slug && c.title);

if (process.argv.includes("--count")) {
  console.log(queued.length);
  process.exit(queued.length === 0 ? 3 : 0);
}

if (queued.length === 0) {
  console.error("Calendar is empty — no queued topics. Add topics before running again.");
  process.exit(3);
}

const item = queued[0];
const now = new Date();
const MONTHS = ["January", "February", "March", "April", "May", "June", "July",
                "August", "September", "October", "November", "December"];

// Only real files on disk may be linked, so an invented slug is impossible.
const siblings = readdirSync(blogDir)
  .filter((f) => f.endsWith(".html") && f !== "index.html" && f !== `${item.slug}.html`)
  .map((f) => {
    const slug = f.replace(/\.html$/, "");
    const row = calendar.find((c) => c.slug === slug);
    let title = row?.title;
    if (!title) {
      const m = readFileSync(join(blogDir, f), "utf8").match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
      title = m ? m[1].replace(/<[^>]*>/g, "").trim() : slug;
    }
    return { slug, title, cluster: row?.cluster || null };
  });

console.log(JSON.stringify({
  item,
  profile,
  siblings,
  slug: item.slug,
  outputPath: `${profile.blogPath}/${item.slug}.html`,
  canonicalUrl: `${profile.siteUrl}/${profile.blogPath}/${item.slug}.html`,
  dateISO: now.toISOString().slice(0, 10),
  dateHuman: `${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`,
  remainingAfterThis: queued.length - 1,
}, null, 2));
