# CLAUDE.md

Working notes for AI assistants on this repo. For humans, start with **README.md**. Design constitution: `AESTHETICS.md`, `CORE_UI.md`.

## What this is

Personal academic site for **Anshul Choudhary** — blog-first, manuscript aesthetic (Tufte Ivory: ivory/dark, Literata, one rubric-red accent, vivid domain colors for categories only). CV is a PDF download on **About** only (no `/cv` page).

## Commands

```bash
npm run dev       # http://localhost:4321
npm run build     # → dist/
npm run preview   # serve dist/
```

## Architecture (current)

- **Astro 5** routing + **React 19** islands (`client:load` where needed).
- **Active UI:** `src/components/manuscript/*` (header, footer, home, about, nav cat).
- **Content:** `src/content/blog/*.mdx` + `src/content.config.ts`.
- **Data:** `src/data/site.js`, `career.js`, `aboutTimeline.js`, `research.js`, `cv.js`.
- **Styles:** colours only in `src/styles/palette.json` → `npm run tokens` generates `tokens.css` (+ Manim/TikZ palettes). `BaseLayout` imports `tokens.css` + `base.css`; pages import `manuscript.css`.
- **Interactivity:** `ThemeToggle.jsx`, `ManuscriptNavCat.jsx` → `NavCompanion.jsx` (dotLottie).
- **Typography:** Literata (variable, opsz); JetBrains Mono for rails/kickers. Sizes only via the `--fs-*` scale in `base.css`.
- **Icons:** `BrandIcon.astro` + simple-icons (Scholar, GitHub, ORCID).

## Pages

| Path | Component |
|------|-----------|
| `/` | `ManuscriptHome.astro` |
| `/about` | `ManuscriptAbout.astro` (timeline + bio + CV band) |
| `/blog` | `pages/blog/index.astro` — open spiral lab notebook, two A4 pages. Left page = contents, never turns: Find box, GitHub-style contribution calendar (one year at a time, a square per post day coloured by project), project filters, list by year (two columns once a year has >12 entries; scrolls inside the page). Right page = the entry the reader points at (No., date, title, dek, card figure, Project / Length / Tags, Read →). ≤760px: contents only, no preview page |
| `/blog/[slug]` | MDX + `Sidenote.astro` |
| `/research` | `pages/research.astro` |

## Domain colors

`src/lib/domainColor.js` — oxide / blue / sage / gold from post tags. Use `accentVar()` in CSS, never hardcoded hex; values live in `palette.json`.

## Conventions

- Do not add fonts or UI libraries without updating `CORE_UI.md`.
- Motion must respect `prefers-reduced-motion`.
- Reading width ~67ch; manuscript shell max width in `manuscript.css`.
- No commits unless the user asks.
- Git: Anshul is the sole author. When asked to commit, commit directly to `main` and `git push`. Do **not** create feature branches or open PRs for posts or edits.

## Known noise

- Dev SSR may log React “Invalid hook call” from motion/dotLottie — not user-facing; islands hydrate fine.
