# Core UI Stack

This file fixes the visual foundation for the site so future pages stay in one coherent system.

## Current Architecture

- framework: Astro
- interactive layer: React islands
- motion layer: Motion for React
- content system: Astro content collections + MDX
- style layers:
  - [tokens.css](/Users/anshu957/Codex_experiments/MyWebpage/src/styles/tokens.css)
  - [base.css](/Users/anshu957/Codex_experiments/MyWebpage/src/styles/base.css)
  - [editorial.css](/Users/anshu957/Codex_experiments/MyWebpage/src/styles/editorial.css)
  - [retro.css](/Users/anshu957/Codex_experiments/MyWebpage/src/styles/retro.css)
  - [global.css](/Users/anshu957/Codex_experiments/MyWebpage/src/styles/global.css)

## Fixed Library Choices

- `Simple Icons` for local brand icons such as Google Scholar, GitHub, and ORCID
- `KaTeX` for inline and display math fragments that need real symbolic typography
- `Newsreader` for body, display, and interface typography
- `dotLottie React` for character-grade companion animation when we need a small ambient character accent
- custom retro accents are allowed, but they are no longer the primary UI system

## Fixed Font Choices

- display/editorial serif: `Newsreader`
- body/prose serif: `Newsreader`
- math typography: `KaTeX`'s bundled math fonts
- utility text should inherit the editorial serif unless there is a deliberate exception

## Fixed Style Rules

- warm paper background with restrained oxide, sage, and gold accents
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
