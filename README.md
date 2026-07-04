# SuirViewDigital v2 — "The River Index"

Alternative concept for SuirViewDigital.ie. **Same palette as v1, everything else new.**
Built with the frontend-design, ui-ux-pro-max and web-design-guidelines skills.

## How it differs from v1
| | v1 (live) | v2 (this) |
|---|---|---|
| Skeleton | Centered column, top navbar | Fixed numbered index rail (left), corner controls |
| Display type | Fraunces serif | **Syne** grotesque, uppercase mega-type |
| Body/labels | Inter | Instrument Sans + **JetBrains Mono** labels |
| Signature | Gold heading underline | **Drifting River Suir contour field** + spinning call badge |
| Mechanics | Scroll fade-ups | Preloader curtain, split-line hero, marquee, scroll-spy rail, progress bar, accordions, bento glow grid, **sticky stacking process deck**, live counters, cursor glow ring, full-screen overlay menu |
| Sections | Audience cards → services grid → about → process → pricing → contact | 01–07 indexed: hero → who (accordion) → services (bento) → process (deck) → plans (diptych) → FAQ → contact |

Colours are identical to v1: `#0A0B0F` black · `#0F1B3D/#13233F` midnight · `#2563EB/#3B82F6/#38BDF8` blues · `#C9A96A/#E4C888/#A9884E` gold · `#F7F5F1` cream.

## Integrations (shared with v1)
- **Cal.com** popup on every "Book a call" (`luke-stapleton-gffimi`)
- **Formspree** contact form (`mykqlzrr`) with GDPR consent + honeypot

## Status
- `noindex` is ON — this is a concept preview; remove the robots meta if this version is chosen.
- Local preview: `powershell -ExecutionPolicy Bypass -File serve.ps1 -Port 8089` → http://localhost:8089
- Not yet on GitHub/Vercel — deploy as a separate project (e.g. suirview-digital-v2) to compare side by side.

## Quality floor
No emoji icons · no `transition: all` · transform/opacity animation only · `prefers-reduced-motion` fully honoured (kills preloader, marquee, drift, spin, cursor ring) · `:focus-visible` states · GDPR consent · semantic HTML/ARIA (accordions, menu) · `color-scheme: dark` · `text-wrap: balance` · verified 0px overflow at 320px.
