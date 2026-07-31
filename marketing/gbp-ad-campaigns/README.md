# Suirview Digital — GBP Advertising Campaign Pack

Five premium, Apple-style advertisement campaigns built to convince Irish small
business owners that managing their Google Business Profile (GBP) is not
optional — it is the digital shop window their next customer walks past every
single day.

Every campaign follows the same production spec so any of Suirview Digital's
creative team, or an outsourced editor, can pick it up and produce it without
further direction.

**Format:** every campaign is delivered as a **still-image carousel** — 8
standalone Midjourney photographs sequenced like a swipeable Instagram/
Facebook carousel or LinkedIn document post. No video, no motion, no camera
movement or animation of any kind. Text and CTA overlays are added in post
(Figma/Canva) on top of the raw Midjourney stills — never rendered by
Midjourney itself.

## Campaigns in this pack

| # | File | Concept | Best-fit business type |
|---|------|---------|------------------------|
| 1 | [`01-the-empty-shopfront.md`](./01-the-empty-shopfront.md) | The Empty Shopfront | Boutique / café / general retail |
| 2 | [`02-the-google-maps-race.md`](./02-the-google-maps-race.md) | The Google Maps Race | Dentist / medical clinic |
| 3 | [`03-the-digital-shop-window.md`](./03-the-digital-shop-window.md) | The Digital Shop Window | Restaurant |
| 4 | [`04-the-lost-customer-journey.md`](./04-the-lost-customer-journey.md) | The Lost Customer Journey | Tradesperson (plumber/electrician) |
| 5 | [`05-the-review-machine.md`](./05-the-review-machine.md) | The Review Machine | Hotel / salon |

## Shared brand system (applies to every campaign)

**Company:** Suirview Digital — Website Development, SEO Optimisation, GEO
Optimisation, AI Automated Receptionists, Google Business Profile Management.

**Core message:** *"Having a great business is not enough if customers cannot
find you."* A Google Business Profile is a digital shop window — neglect it
and you lose calls, website visits, bookings, trust, and revenue.

**Design language:** Apple keynote / luxury tech / premium SaaS.
- Realistic environments, natural window and golden-hour light, shallow depth
  of field, restrained colour grading (warm neutrals + a single confident
  accent — Suirview blue `#2563EB`/`#3B82F6` or gold `#C9A96A`).
- Minimal on-screen text (max one short line per slide), premium sans-serif
  or serif type set with generous tracking and whitespace, added in post —
  never generated inside Midjourney.
- No cartoon icons, no generic stock photography, no "AI glow / neon
  hologram" sci-fi clichés. If it wouldn't run in an Apple or Aesop ad, it
  doesn't belong here.
- Suirview Digital logo appears only as a small, quiet watermark bottom-right
  on the final CTA slide — never oversized, never mid-story.

**Tool used:** Midjourney (realistic still photography) exclusively, per
brand policy. No animation or video generation tools are used anywhere in
this pack.

**Visual consistency across a carousel:** because each slide is generated
independently, lock down consistency before generating a full set —
1. Generate slide 1 first and approve it.
2. Reuse its seed (`--seed <number>`) across the remaining 7 prompts in that
   campaign so lighting, grain and colour stay matched.
3. Where the same person/subject needs to reappear across slides (e.g. the
   homeowner in Campaign 4, or the restaurant interior in Campaign 3), use
   Midjourney's `--cref <image-url>` (character reference) or `--sref
   <image-url>` (style reference) pointed at slide 1's output.
4. Keep aspect ratio identical across all 8 slides in a campaign (`--ar
   4:5`, the optimal ratio for Instagram/Facebook feed carousels) so the
   swipe feels seamless.

**Audience:** Irish small business owners — dentists, medical clinics,
tradespeople, restaurants, hotels, estate agents, salons, gyms, professional
services — who know they run a good business but are frustrated that it
isn't translating into enough calls, bookings or footfall.

## How to use this pack

1. Open the campaign file for the business type closest to the client you're
   pitching or advertising to.
2. Generate slide 1 in Midjourney using the cover prompt, then generate
   slides 2–8 from the carousel section, reusing the seed/`--cref`/`--sref`
   per the consistency notes above.
3. Add the text overlay and Suirview Digital watermark (final slide only) in
   Figma/Canva, matching the type direction in each file's Visual Direction
   section.
4. Assemble the 8 stills into a single carousel post, pair it with the
   caption, CTA and hashtags supplied, and publish to the recommended
   platform(s).
5. Route enquiries to Suirview Digital's GBP Management service page.

Each file is self-contained and includes: research rationale, creative brief,
visual direction, cover Midjourney prompt, full 8-slide still-image carousel
(each slide with its own Midjourney prompt and on-image text), caption, CTA,
hashtags, recommended platform, why it should generate leads, and a scored
self-critique with the improvements already applied.
