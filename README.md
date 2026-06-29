# Anshul Choudhary — personal site

Static personal website for [Anshul Choudhary](https://github.com/anshu957): blog, about, research, and a downloadable CV. Built with **Astro 5**, **React islands** for small interactive pieces, and a warm editorial “manuscript” design system (cream paper, Newsreader serif, domain-colored accents).

## Quick start

**Requirements:** Node.js 20+ and npm.

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # output → dist/
npm run preview    # serve the production build locally
```

After changing content or components, run `npm run build` (or keep `npm run dev` running) and hard-refresh the browser if you do not see updates.

## Site map

| Route | Purpose |
|-------|---------|
| `/` | Homepage — recent writing list + identity band |
| `/about` | Career timeline, bio, CV download (PDF) |
| `/blog` | Full archive |
| `/blog/[slug]` | MDX post with sidenotes |
| `/research` | Research themes and selected publications |

There is no separate `/cv` page; the PDF is linked from About.

## Project structure

```
src/
  pages/              # Routes (thin shells)
  components/
    manuscript/       # Active UI: header, footer, home, about, nav cat
    BrandIcon.astro   # Scholar / GitHub / ORCID icons
    Sidenote.astro    # Tufte-style sidenotes for MDX
    ThemeToggle.jsx   # Light / dark toggle
    NavCompanion.jsx  # Footer cat animation (dotLottie)
  layouts/
    BaseLayout.astro  # HTML shell + global style imports
  content/blog/       # MDX posts (content collection)
  data/               # Site copy, career timeline, research, CV path
  lib/                # domainColor.js — accent mapping for tags/pages
  styles/
    manuscript.css    # Primary design system (imported per manuscript page)
    tokens.css …      # Legacy global layers still loaded by BaseLayout
public/
  favicon.svg
  assets/cv/          # CV PDF for download
  assets/blog/        # Post card SVGs (optional)
```

### Where to edit what

| Task | Location |
|------|----------|
| Name, nav, profile links | `src/data/site.js` |
| About bio | `src/components/manuscript/ManuscriptAbout.astro` |
| Career timeline stops | `src/data/career.js` + whispers/links in `src/data/aboutTimeline.js` |
| CV PDF path / “updated” date | `src/data/cv.js` + file in `public/assets/cv/` |
| Research publications | `src/data/research.js` |
| New blog post | `src/content/blog/*.mdx` + frontmatter schema in `src/content.config.ts` |
| Colors / dark mode (manuscript) | `src/styles/manuscript.css` (`--ms-*`, `--domain-*`) |
| Domain color per tag | `src/lib/domainColor.js` |

## Content: blog posts

Posts live in `src/content/blog/` as MDX. Required frontmatter:

```yaml
title: "Post title"
description: "One-line summary"
date: 2026-01-15
draft: false
featured: false
tags: ["cell-fate", "dynamics"]
readingTime: "8 min"
image: "/assets/manuscript/cells.jpg"
```

Use `<Sidenote>` in MDX for margin notes (wired in `src/pages/blog/[slug].astro`).

## Design notes

- **Manuscript shell:** All public pages use `manuscript-page` + `ManuscriptHeader` / `ManuscriptFooter` and import `src/styles/manuscript.css`.
- **Domain colors** encode topic: oxide (biology/default), blue (theory/physics), sage (methods/genomics), gold (tea/personal). See `src/lib/domainColor.js`.
- **Dark mode:** `html.dark` class toggled by `ThemeToggle.jsx`; tokens overridden on `.manuscript-page` in `manuscript.css`.
- **Motion:** Nav cat and header SVG respect `prefers-reduced-motion`.

Deeper design constraints: `AESTHETICS.md`, `CORE_UI.md`. Agent-oriented notes: `CLAUDE.md`.

## Static assets

- **CV:** Place PDF at `public/assets/cv/anshul-choudhary-cv-nov-2025.pdf` (path in `src/data/cv.js`).
- **Post hero images:** Referenced in each post’s `image` field; paths are served from `public/`.

## Deployment

The site is a static export (`dist/`). Build on CI or locally, then deploy `dist/` to any static host (GitHub Pages, Netlify, Cloudflare Pages, etc.):

```bash
npm ci
npm run build
# upload dist/
```

## Development tips

- **Stale preview:** If the browser shows old copy, restart dev/preview or use a fresh port: `npm run preview -- --port 4345`.
- **Screenshots / QA:** `playwright` is a devDependency. Run capture scripts from the **repo root** so `node_modules` resolves.
- **Legacy CSS:** `src/styles/global.css` still loads via `BaseLayout` and contains rules from earlier layouts; new work should prefer `manuscript.css` and component-scoped styles.

## License

Private personal site; content and code © Anshul Choudhary unless otherwise noted.
