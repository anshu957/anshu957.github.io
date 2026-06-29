/** Margin whispers and research links for the About timeline. */

/** @type {Record<string, { whisper: string, research?: { href: string, label: string } }>} */
export const stopMeta = {
  nsit: {
    whisper: "structures · circuits · first principles",
  },
  iiser: {
    whisper: "master stability · small-world",
    research: { href: "/research/#theme-physics-ml", label: "dynamical systems" },
  },
  olden: {
    whisper: "stochastic resonance · North Sea wind",
  },
  ncstate: {
    whisper: "Hamiltonian priors",
    research: { href: "/research/#theme-physics-ml", label: "physics-aware ML" },
  },
  jax: {
    whisper: "RNA velocity · basin geometry",
    research: { href: "/research/#theme-cell-fate", label: "cell fate work" },
  },
};

/** @param {{ period: string, yearStart: number }} node */
export function yearEnd(node) {
  if (/[–-]\s*$/.test(node.period)) return null;
  const match = node.period.match(/[–-](\d{2,4})$/);
  if (!match) return null;
  const raw = match[1];
  if (raw.length === 2) {
    const century = Math.floor(node.yearStart / 100) * 100;
    return century + Number.parseInt(raw, 10);
  }
  return Number.parseInt(raw, 10);
}

/** @param {import("./career.js").careerNodes} nodes */
export function buildTimelineItems(nodes) {
  /** @type {Array<{ kind: "stop", node: (typeof nodes)[number] } | { kind: "gap", label: string }>} */
  const items = [];

  for (let i = nodes.length - 1; i >= 0; i -= 1) {
    items.push({ kind: "stop", node: nodes[i] });

    if (i > 0) {
      const older = nodes[i - 1];
      const newer = nodes[i];
      const end = yearEnd(older);
      const start = newer.yearStart;
      if (end !== null && start > end) {
        const delta = start - end;
        items.push({
          kind: "gap",
          label: `${end}–${start} · Δt ≈ ${delta} yr`,
        });
      }
    }
  }

  return items;
}

/** @param {"edu"|"research"|"current"} type */
export function stopAccent(type) {
  switch (type) {
    case "edu":
      return "blue";
    case "research":
      return "sage";
    case "current":
      return "oxide";
    default: {
      const _exhaustive = type;
      return "oxide";
    }
  }
}
