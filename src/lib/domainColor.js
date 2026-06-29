export const DOMAIN_ACCENTS = {
  oxide: "#b85a43",
  blue: "#6b7fb0",
  sage: "#5e7257",
  gold: "#c89a52",
};

export const DOMAIN_CSS_VARS = {
  oxide: "var(--domain-oxide)",
  blue: "var(--domain-blue)",
  sage: "var(--domain-sage)",
  gold: "var(--domain-gold)",
};

/** Map post tags to one of four meaning-bearing domain accents. */
export function domainColor(tags = []) {
  const t = tags.join(" ").toLowerCase();
  if (/tea|notes|practice|personal|pause/.test(t)) return "gold";
  if (/network|physics|complex|math|graph/.test(t)) return "blue";
  if (/genom|transcriptom|sequenc|method|pipeline|software|single-cell|rna/.test(t)) return "sage";
  return "oxide";
}

export function accentHex(color) {
  return DOMAIN_ACCENTS[color] ?? DOMAIN_ACCENTS.oxide;
}

/** Prefer this for CSS custom properties — follows light/dark tokens on .manuscript-page. */
export function accentVar(color) {
  return DOMAIN_CSS_VARS[color] ?? DOMAIN_CSS_VARS.oxide;
}

export function tagLabel(tag) {
  return (tag ?? "notes").replace(/-/g, " ");
}

/** Nav section → dominant accent for active-link tinting. */
export function navAccent(path = "/") {
  if (path.startsWith("/blog")) return "gold";
  if (path.startsWith("/research")) return "sage";
  if (path.startsWith("/about")) return "blue";
  return "oxide";
}

/** Research theme index → domain accent. */
export const themeDomain = ["oxide", "sage", "blue"];

/** Publication card domain by venue/title keywords. */
export function publicationDomain(item) {
  const t = `${item.title} ${item.venue} ${item.summary}`.toLowerCase();
  if (/behavior|jabs|mouse|phenotyp/.test(t)) return "sage";
  if (/neural|machine learning|hamiltonian|physics|nonlinear|network|dynamical/.test(t)) return "blue";
  if (/cell|rna|velocity|fate|genom/.test(t)) return "oxide";
  return "blue";
}
