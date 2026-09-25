import palette from "../styles/palette.json";

/** Domain name -> its CSS variable. The colours themselves live in src/styles/palette.json. */
export const DOMAIN_CSS_VARS = Object.fromEntries(
  Object.keys(palette.domain).map((name) => [name, `var(--domain-${name})`]),
);

/** Map post tags to one of four meaning-bearing domain accents. */
export function domainColor(tags = []) {
  const t = tags.join(" ").toLowerCase();
  if (/tea|notes|practice|personal|pause/.test(t)) return "gold";
  if (/network|physics|complex|math|graph/.test(t)) return "blue";
  if (/genom|transcriptom|sequenc|method|pipeline|software|single-cell|rna/.test(t)) return "sage";
  return "oxide";
}

/** Prefer this for CSS custom properties — follows light/dark tokens on .manuscript-page. */
export function accentVar(color) {
  return DOMAIN_CSS_VARS[color] ?? DOMAIN_CSS_VARS.oxide;
}

export function tagLabel(tag) {
  return (tag ?? "notes").replace(/-/g, " ");
}

/** Research theme index → domain accent. */
export const themeDomain = ["oxide", "sage", "blue"];

/** Publication card domain — prefers explicit theme, falls back to keywords. */
export function publicationDomain(item) {
  if (item.theme === "behavior") return "sage";
  if (item.theme === "physics-ml") return "blue";
  if (item.theme === "networks") return "oxide";

  const t = `${item.title} ${item.venue}`.toLowerCase();
  if (/behavior|jabs|mouse|phenotyp|genom|morphic/.test(t)) return "sage";
  if (/neural|machine learning|hamiltonian|physics|nonlinear/.test(t)) return "blue";
  if (/network|dynamical|synchron|basin|perturb/.test(t)) return "oxide";
  return "blue";
}
