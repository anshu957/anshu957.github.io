# Core UI Stack

This file fixes the visual foundation for the site so future pages stay in one coherent system.

## Current Architecture

- framework: Astro
- interactive layer: React islands
- motion layer: Motion for React
- content system: Astro content collections + MDX
- style layers (imported by `src/layouts/BaseLayout.astro`, then per page):
  - `src/styles/palette.json`: the single source of truth for every colour, as `[light, dark]` pairs
  - `src/styles/tokens.css`: GENERATED from `palette.json` by `npm run tokens` (runs before dev and build); `:root` light, `html.dark` dark. Never edit by hand
  - `src/styles/base.css`: fonts, non-colour tokens (`--ms-font-*`, `--ms-container`), element defaults
  - `src/styles/manuscript.css`: the page system (sheet, grain, glass recipes, header, archive, article)
  - the same generator writes `scripts/sketch/manim/palette.zsh` (card art) and `scripts/diagrams/_palette.tex` (TikZ), so art cannot drift from the site

## Fixed Library Choices

- `Simple Icons` for local brand icons such as Google Scholar, GitHub, and ORCID
- `KaTeX` for inline and display math fragments that need real symbolic typography
- `Literata` (variable, optical-size axis, via `@fontsource-variable/literata`) for body, display, and interface typography; `JetBrains Mono` for dates, tags, kickers and the header badge
- `dotLottie React` for character-grade companion animation when we need a small ambient character accent
- custom retro accents are allowed, but they are no longer the primary UI system
- `TikZ` (LuaLaTeX + `pdftocairo`, build-time only) for post diagrams: `scripts/diagrams/<post>/render.sh` renders each `.tex` to light + dark SVGs in `public/assets/blog/<post>/`, shown by `src/components/blog/Diagram.astro`. Shared style in `_preamble.tex`; icons from `fontawesome5`. Add-on packages matched to TeX Live 2023 live outside the repo in `~/.local/share/texmf-tl2023` (fontawesome5, simpleicons, forest, pgf-umlsd, dirtree). Nothing ships to the browser but the SVGs.
- Anonymous post comments (no account): `src/components/blog/Comments.astro` (plain DOM, text-only rendering) talking to a Cloudflare Worker + D1 in `workers/comments/` (honeypot, timing and per-IP rate limits; owner deletes via admin token). API base: `siteMeta.commentsApi` (override with `PUBLIC_COMMENTS_API`). Opt out per post with `comments: false`.

## Fixed Font Choices

- display/editorial serif: `Literata`
- body/prose serif: `Literata`
- metadata (dates, tags, kickers, badge): `JetBrains Mono`
- math typography: `KaTeX`'s bundled math fonts
- diagrams: glyphs of `Crimson Pro` + `JetBrains Mono` are baked into each SVG as outlines at render time (art pipeline not yet moved to Literata) (TTFs in `scripts/diagrams/fonts/`); not loaded by the site
- utility text should inherit the editorial serif unless there is a deliberate exception
- type scale (`base.css`): every `font-size` uses a step, `--fs-label` 12 / `--fs-note` 15 / `--fs-small` 17 / `--fs-body` 18 / `--fs-lede` 21 / `--fs-h3` / `--fs-h2` / `--fs-h1`; never a raw rem/px size (drop caps excepted)
- plate width: post cards and research plates share `--ms-plate-w` (22rem)

## Fixed Style Rules

- Tufte Ivory: ivory sheet (`--ms-sheet` #fffff8 / #1b1b19), true-black ink (`--ms-on-surface` #111 / #efefe8), prose at full ink
- ONE accent, rubric red (`--ms-accent` #a51c30 / #f07a8a): links (always underlined), active nav, drop cap, rules
- domain colours (`--domain-*`, vivid, all at least 4.5:1 on the sheet) are categorical only: tags, the header badge, research plates, card and diagram art; never nav or links
- liquid glass (`.ms-glass`, `.ms-glass-plate` in `manuscript.css`) for the header badge and figure plates; glass tokens `--ms-glass-*`
- change a colour only in `src/styles/palette.json`; card art (`generate.sh`) and diagrams (`_preamble.tex`) read the generated files, then re-render them
- serif for identity, body, navigation, and post titles
- the site should read as editorial first and retro second
- math fragments should be typeset, not improvised with symbol fallbacks
- retro artifacts should be sparse and feel like found details inside a research notebook
- no arbitrary new UI libraries without a deliberate replacement decision
- custom motion should be sparse, slow, and characterful

## Motion Rules

- companion motion should feel alive rather than decorative
- companion motion should not dominate the header hierarchy
- motion should stop or simplify under reduced-motion preference
- no fast loops that read as loading indicators
