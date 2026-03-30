import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = __dirname;

const palette = {
  ink: "#241b18",
  oxide: "#b85a43",
  sage: "#576d53",
  gold: "#d0a25d",
  blue: "#7686b7",
  teal: "#6fb3a6",
  rose: "#d67b7b",
  violet: "#9d86c8",
  sand: "#e7d7b4",
};

const families = [
  {
    key: "bars",
    title: "Bar Wave",
    build: ({ base, accent, shift }) => {
      const heights = [2, 4, 6, 5, 3, 5, 2];
      return [
        ...heights.map((height, index) => {
          const x = index + 1;
          const h = clamp(height + (shift % 2) - (index % 3 === 0 ? 1 : 0), 1, 7);
          return rect(x, 8 - h, 1, h, index % 2 === 0 ? accent : palette.ink, 0);
        }),
        dot(0, 7, palette.sage),
      ];
    },
  },
  {
    key: "mirror",
    title: "Mirror Wave",
    build: ({ base, accent, shift }) => {
      const heights = [1, 3, 5, 6, 5, 3, 1];
      return [
        ...heights.map((height, index) => {
          const x = index + 1;
          const h = clamp(height + (shift % 3 === 0 ? 1 : 0), 1, 7);
          return rect(x, 4 - Math.min(3, h), 1, h, index === 3 ? accent : palette.ink, 0);
        }),
        dot(0, 4, palette.gold),
        dot(7, 3, palette.teal),
      ];
    },
  },
  {
    key: "pulse",
    title: "Pulse Wave",
    build: ({ base, accent, shift }) => {
      return [
        rect(1, 5, 1, 2, palette.ink, 0),
        rect(2, 4, 1, 3, palette.sand, 0),
        rect(3, 2, 1, 5, accent, 0),
        rect(4, 1, 1, 6, palette.ink, 0),
        rect(5, 2, 1, 5, accent, 0),
        rect(6, 4, 1, 3, palette.sand, 0),
        rect(7, 5, 1, 2, palette.ink, 0),
        dot((shift % 2) + 1, 1, palette.gold),
      ];
    },
  },
  {
    key: "ripple",
    title: "Ripple Echo",
    build: ({ base, accent, shift }) => {
      const cx = 3 + (shift % 2);
      const cy = 4;
      return [
        ...ring(cx, cy, 1, accent),
        ...ring(cx, cy, 2, palette.sage),
        ...ring(cx, cy, 3, palette.ink),
        dot(cx, cy, palette.gold),
      ];
    },
  },
  {
    key: "speaker",
    title: "Speaker Wave",
    build: ({ base, accent, shift }) => {
      return [
        rect(1, 3, 1, 2, palette.ink, 0),
        rect(2, 2, 1, 4, palette.ink, 0),
        rect(3, 1, 1, 6, accent, 0),
        rect(5, 2, 1, 4, palette.sage, 0),
        rect(6, 1, 1, 6, palette.ink, 0),
        dot(7, 4, palette.gold),
        dot((shift % 2) + 4, 0, palette.rose),
      ];
    },
  },
  {
    key: "beam",
    title: "Beam Wave",
    build: ({ base, accent, shift }) => {
      return [
        ...[0, 1, 2, 3, 4].map((index) => {
          const x = index + 1;
          const h = clamp(2 + index + (shift % 2), 1, 7);
          return rect(x, 7 - h, 1, h, index % 2 === 0 ? accent : palette.ink, 0);
        }),
        rect(6, 1, 1, 1, palette.gold, 0),
        rect(7, 0, 1, 1, palette.teal, 0),
      ];
    },
  },
  {
    key: "stereo",
    title: "Stereo Wave",
    build: ({ base, accent, shift }) => {
      return [
        ...[1, 2, 3, 4, 5, 6].map((x) => {
          const top = x < 4 ? x - 1 : 6 - x;
          const bottom = x < 4 ? 6 - x : x - 1;
          return [
            rect(x, clamp(2 - top + (shift % 2), 0, 7), 1, clamp(2 + top, 1, 4), x % 2 ? accent : palette.ink, 0),
            rect(x, clamp(4 + bottom - (shift % 2), 0, 7), 1, clamp(1 + bottom, 1, 4), x % 2 ? palette.sage : palette.blue, 0),
          ];
        }).flat(),
        dot(0, 3, palette.gold),
      ];
    },
  },
  {
    key: "spark",
    title: "Spark Wave",
    build: ({ base, accent, shift }) => {
      return [
        rect(1, 4, 1, 1, palette.gold, 0),
        rect(2, 3, 1, 2, palette.ink, 0),
        rect(3, 2, 1, 4, accent, 0),
        rect(4, 1, 1, 6, palette.ink, 0),
        rect(5, 2, 1, 4, accent, 0),
        rect(6, 3, 1, 2, palette.ink, 0),
        rect(7, 4, 1, 1, palette.teal, 0),
        dot((shift % 3) + 2, 0, palette.rose),
      ];
    },
  },
  {
    key: "oscillator",
    title: "Oscillator Wave",
    build: ({ base, accent, shift }) => {
      const pattern = [2, 4, 6, 3, 5, 2, 4];
      return [
        ...pattern.map((height, index) => {
          const x = index + 1;
          const h = clamp(height + ((shift + index) % 2), 1, 7);
          return rect(x, 8 - h, 1, h, index === 2 || index === 4 ? accent : palette.ink, 0);
        }),
        dot(0, 1, palette.gold),
      ];
    },
  },
  {
    key: "wavelet",
    title: "Wavelet",
    build: ({ base, accent, shift }) => {
      return [
        rect(1, 6, 1, 1, palette.ink, 0),
        rect(2, 5, 1, 2, palette.sage, 0),
        rect(3, 3, 1, 4, accent, 0),
        rect(4, 2, 1, 5, palette.ink, 0),
        rect(5, 3, 1, 4, accent, 0),
        rect(6, 5, 1, 2, palette.sage, 0),
        rect(7, 6, 1, 1, palette.ink, 0),
        dot((shift % 2) + 1, 2, palette.teal),
      ];
    },
  },
  {
    key: "echo",
    title: "Echo Wave",
    build: ({ base, accent, shift }) => {
      return [
        ...ring(3 + (shift % 2), 4, 1, palette.sand),
        ...ring(3 + (shift % 2), 4, 2, accent),
        dot(3 + (shift % 2), 4, palette.ink),
        rect(6, 2, 1, 4, palette.gold, 0),
        rect(7, 1, 1, 6, palette.ink, 0),
      ];
    },
  },
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function rect(x, y, width, height, fill, rx = 0) {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}"${rx ? ` rx="${rx}"` : ""} />`;
}

function dot(x, y, fill) {
  return rect(x, y, 1, 1, fill);
}

function ring(cx, cy, radius, fill) {
  const points = [];
  for (let dx = -radius; dx <= radius; dx += 1) {
    for (let dy = -radius; dy <= radius; dy += 1) {
      const onEdge = Math.abs(dx) === radius || Math.abs(dy) === radius;
      const inside = Math.abs(dx) <= radius && Math.abs(dy) <= radius;
      if (inside && onEdge) {
        points.push(dot(cx + dx, cy + dy, fill));
      }
    }
  }
  return points;
}

function pickPalette(seed) {
  const swatches = [
    { base: "#f5edda", accent: palette.gold },
    { base: "#efe4cf", accent: palette.oxide },
    { base: "#f2e8d7", accent: palette.sage },
    { base: "#f6ecdb", accent: palette.blue },
    { base: "#f1e6d2", accent: palette.teal },
    { base: "#eee1c7", accent: palette.rose },
    { base: "#f7eedf", accent: palette.violet },
    { base: "#f0e4cf", accent: palette.gold },
  ];

  return swatches[seed % swatches.length];
}

function svgDocument(inner) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8" width="64" height="64" shape-rendering="crispEdges" role="img" aria-hidden="true">
  <rect width="8" height="8" fill="none" />
  ${inner}
</svg>
`;
}

function makeIcon(index) {
  const family = families[(index - 1) % families.length];
  const variant = Math.floor((index - 1) / families.length);
  const theme = pickPalette(index - 1);
  const flip = variant % 2 === 1;
  const shift = variant % 4;
  const content = family.build({
    base: theme.base,
    accent: theme.accent,
    shift,
    flip,
  });

  return {
    id: index,
    file: `soundwave-${String(index).padStart(3, "0")}.svg`,
    title: `${family.title} ${String(variant + 1).padStart(2, "0")}`,
    family: family.key,
    palette: [theme.base, theme.accent, palette.ink],
    svg: svgDocument(content.join("\n  ")),
  };
}

async function main() {
  await mkdir(outDir, { recursive: true });

  const icons = [];
  for (let index = 1; index <= 80; index += 1) {
    const icon = makeIcon(index);
    icons.push({
      id: icon.id,
      file: icon.file,
      title: icon.title,
      family: icon.family,
      palette: icon.palette,
      viewBox: "0 0 8 8",
    });
    await writeFile(path.join(outDir, icon.file), icon.svg, "utf8");
  }

  const manifest = {
    name: "soundwave-icons",
    description: "A reusable 8-bit sound-wave icon set on an 8x8 grid.",
    grid: "8x8",
    count: icons.length,
    generatedAt: new Date().toISOString(),
    files: icons,
  };

  await writeFile(path.join(outDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  const familiesSummary = families
    .map((family) => `- ${family.key}: ${family.title}`)
    .join("\n");

  await writeFile(
    path.join(outDir, "README.md"),
    `# Soundwave Icons\n\n80 tiny 8-bit sound-wave SVGs on an 8x8 grid.\n\n## Contents\n\n- Files: \`soundwave-001.svg\` through \`soundwave-080.svg\`\n- Manifest: [manifest.json](./manifest.json)\n- Generator: [generate.mjs](./generate.mjs)\n\n## Families\n\n${familiesSummary}\n\n## Usage\n\nImport the SVGs directly where you need them. They are designed to scale cleanly and stay legible at small sizes.\n`,
    "utf8",
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
