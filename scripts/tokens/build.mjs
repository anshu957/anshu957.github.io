// Generates every colour file from src/styles/palette.json, the single source of truth:
//   src/styles/tokens.css           CSS custom properties (:root light, html.dark dark)
//   scripts/sketch/manim/palette.zsh  LIGHT / DARK env arrays for the Manim card renders
//   scripts/diagrams/_palette.tex     \definecolor block for the TikZ diagrams
// Usage: npm run tokens   (also runs before dev and build)
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const palette = JSON.parse(fs.readFileSync(path.join(root, "src/styles/palette.json"), "utf8"));
const HEADER = "GENERATED from src/styles/palette.json by scripts/tokens/build.mjs. Do not edit; run `npm run tokens`.";

const groups = Object.entries(palette).filter(([k]) => !k.startsWith("$") && k !== "diagram");
const cssVar = (group, name) => (group === "domain" ? `--domain-${name}` : `--${name}`);
const block = (i) =>
  groups
    .map(([g, toks]) => `  /* ${g} */\n` + Object.entries(toks).map(([n, v]) => `  ${cssVar(g, n)}: ${v[i]};`).join("\n"))
    .join("\n");

const css = `/* ${HEADER} */\n\n:root {\n${block(0)}\n}\n\nhtml.dark {\n${block(1)}\n}\n`;

const hex = (group, name, i) => {
  const v = palette[group][name][i];
  if (!/^#[0-9a-f]{6}$/i.test(v)) throw new Error(`${group}.${name} must be a 6-digit hex for the art pipelines, got ${v}`);
  return v;
};
const env = (theme, i) => {
  const vars = { THEME: theme, INK: hex("ink", "ms-on-surface", i), FILL: hex("surface", "ms-sheet", i) };
  for (const d of Object.keys(palette.domain)) vars[d.toUpperCase()] = hex("domain", d, i);
  return Object.entries(vars).map(([k, v]) => `${k}="${v}"`).join(" ");
};
const zsh = `# ${HEADER}\nLIGHT=(${env("light", 0)})\nDARK=(${env("dark", 1)})\n`;

const tex = (i) => {
  const c = {
    ink: hex("ink", "ms-on-surface", i), muted: hex("ink", "ms-muted", i), paper: hex("surface", "ms-sheet", i),
    accent: hex("domain", "sage", i), accentfill: hex("diagram", "accentfill", i), oxide: hex("domain", "oxide", i),
  };
  return Object.entries(c).map(([k, v]) => `  \\definecolor{${k}}{HTML}{${v.slice(1).toUpperCase()}}`).join("\n");
};
const latex = `% ${HEADER}\n\\def\\darktheme{dark}\n\\ifx\\theme\\darktheme\n${tex(1)}\n\\else\n${tex(0)}\n\\fi\n`;

const out = {
  "src/styles/tokens.css": css,
  "scripts/sketch/manim/palette.zsh": zsh,
  "scripts/diagrams/_palette.tex": latex,
};
for (const [f, s] of Object.entries(out)) {
  const p = path.join(root, f);
  if (fs.existsSync(p) && fs.readFileSync(p, "utf8") === s) continue;
  fs.writeFileSync(p, s);
  console.log(`tokens: wrote ${f}`);
}
