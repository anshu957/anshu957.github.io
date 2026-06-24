# CLAUDE.md

Working notes for Claude on Anshul Choudhary's personal academic website. Read this first, then
`AESTHETICS.md` and `CORE_UI.md` (the design constitution) before making visual changes.

## What this is

A personal academic website for **Anshul Choudhary** — Associate Computational Scientist at The
Jackson Laboratory (Farmington, CT), working across **nonlinear dynamics × genomics × scientific ML**,
with **tea** as a quiet recurring motif. It is two things at once: a **writing home** (blog/essays are
central) and a **creative showcase** (the site itself should be memorable evidence of how he thinks).

## Commands

```bash
npm run dev       # astro dev → http://localhost:4321
npm run build      # static build to dist/
npm run preview    # serve the build
```

Screenshot/QA workflow: `playwright` is a devDependency. A throwaway script placed in the **project
root** (so it resolves `node_modules`) can drive `chromium` to capture pages in light/dark/desktop/
mobile and read browser console errors. Don't run such scripts from outside the repo — ESM won't find
playwright.

## Architecture

- **Astro 5** site shell + routing; **React 19 islands** for interactivity (`client:load`).
- **Motion** for restrained motion; **KaTeX** for real math typography (rendered at build via
  `katex.renderToString` inside `.astro` frontmatter, e.g. `MathWordmark.astro`); **three** for the
  Lorenz attractor; **@lottiefiles/dotlottie-react** for the nav cat; **Newsreader** (fontsource) is
  the only typeface for body/display/UI; **lucide-react** icons are used **SSR-only** inside `.astro`
  (no hydration).
- **Content:** Astro content collections + MDX under `src/content/blog/`.
- **Style layers** (imported in this order by `src/layouts/BaseLayout.astro`):
  `tokens.css` (design tokens / light+dark vars) → `base.css` (resets, body, links) →
  `editorial.css` (headings, prose, kickers) → `retro.css` (noise, panels, chips, nav companion) →
  `global.css` (layout + most components; ~1200 lines — the big one).

## Design direction (agreed 2026-06-24)

Decided with the user via interview + a design-expert research pass. **Locked constraints:**

- **Refine** the existing cozy-retro editorial system (warm cream paper, Newsreader serif,
  oxide/sage/gold accents, dynamics + tea motifs). Do not switch aesthetics — finish and sharpen it.
- **Homepage stays blog-first.** No big separate hero. The recent-writing list itself is the focal
  point, with a **compact identity band** above it.
- **Reinvent — bold and "a little strange"** (AESTHETICS.md asks for calm, crafted, a little strange).
  Not looking for safe.

**Hero idea — the "Phase-Space Index":** the writing list becomes a sheet of phase-space *specimens*.
Each post gets a tiny **deterministic attractor glyph** (SVG line-trajectory seeded from its slug),
stroked in its **domain color**, static by default, drawing one slow loop on hover. Serif titles in the
main column; a **monospace metadata rail** (date · reading-time · domain tag) as the spine. Tufte-style
**sidenotes** on blog posts (desktop margin → inline tap-to-expand on mobile). Tea stays a quiet
caption/ritual cue, never a mascot.

**Domain color system** (promote `BlogList.astro`'s `domainColor` logic site-wide — color *encodes*
what you're reading):
- **oxide `#b85a43`** — primary; links, active nav, "now" marker, biology/cell-fate/default domain
- **accent-blue `#6b7fb0`** — theory / physics / networks
- **sage `#5e7257`** — genomics / methods
- **gold `#c89a52`** — tea / personal / "notes" (warm, rare)

Each post's domain colors its glyph stroke + 2px spine consistently across index, post header, and
(on About) its career node.

Reference sites that inform the direction (verified live): Robin Sloan (index-as-artifact, ★ curation),
Tufte CSS / Gwern (sidenotes), Bartosz Ciechanowski (one calm live element framed by quiet text),
Maggie Appleton (per-entry specimen visual), Andy Matuschak (quiet metadata rail), Amelia Wattenberger
(deterministic generative headers), Linus Lee (mono-rail / serif-body pairing), Nicky Case (permission
to be strange if it reveals).

## Component & page map (state + verdicts)

**Wired and good:** `BlogList.astro` (the index — extend it for glyphs/domain colors),
`SiteHeader.astro` (+ `MathWordmark`, `ThemeToggle`, `NavCompanion`), blog post reading view, the
warm palette + dark mode, Research themes prose, About bio prose.

**Wired but to change:** floating `IconDock` → replace with inline hairline footer (also fixes mobile
overlap bug); header identity → name-first, drop the `// Anshul Choudhary` mono byline; `NavCompanion`
cat → remove from nav (optionally relocate one calm cat to the footer as a mascot).

**Orphaned (imported by nothing) — verdicts:**
- `HeroScene.jsx` / `HeroPanel.astro` — Lorenz chaos hero. **Repurpose:** extract integrator to
  `lib/attractor.js` to power per-post glyphs + an optional thin masthead strip; **delete HeroPanel**
  (a full hero contradicts blog-first).
- `CareerMap.jsx` — phase-space theory→biology trajectory. **Finish + wire into About**, replacing the
  center-spine timeline. Best orphan in the repo.
- `PixelReadout.jsx` — keep; repurpose as the `t=…` caption under the masthead strip.
- `BifurcationCanvas.jsx` — hold for a Research header accent (P2) or delete; don't leave dead.
- `WigglePointer.jsx` — **delete** (custom cursor fights "calm"; a11y/perf liability).
- `ResearchHighlights.astro`, `SectionHeading.astro`, `PageIntro.astro` — **delete** (superseded by
  inline page markup) unless formalized as shared primitives.

## Known issues

- **Mobile:** the floating dark icon-dock overlaps the last content (timeline rows / last blog entry).
  Fixed by the inline-footer replacement.
- **SSR log noise:** "Invalid hook call" floods the dev server log on every request. There is only ONE
  React on disk (19.2.4) — it is **not** a duplicate-install bug and **not** user-facing (browser
  console is clean; islands hydrate fine). It's an SSR-time warning from an island lib (`motion` /
  `dotlottie`). Low-priority cleanup.
- `dotLottie` deprecation warning in-browser ("pass a single object") — trivial.

## Conventions / gotchas

- Don't introduce new UI libraries or fonts without a deliberate replacement decision (see CORE_UI.md).
- No pixel fonts for prose; retro/scientific artifacts FRAME the writing, never dominate it.
- All motion must freeze/simplify under `prefers-reduced-motion`; no fast loops that read as loading.
- Reading width is `--reading-width: 67ch`; site width `--site-width`. Spacing scale is `--space-1..7`.
- KaTeX CSS is imported globally in `BaseLayout.astro`; math is build-time rendered, not client-side.
```
