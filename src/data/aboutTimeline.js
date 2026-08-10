/** One grounded theme per branch of the About timeline. Optional href links to the research page. */

/** @type {Record<string, { theme: string, href?: string }>} */
export const stopMeta = {
  nsit: {
    theme: "mechatronics",
  },
  hcl: {
    theme: "enterprise resource planning (SAP)",
  },
  iiser: {
    theme: "nonlinear dynamical systems",
    href: "/research/#theme-physics-ml",
  },
  olden: {
    theme: "food-web synchronization",
  },
  ncstate: {
    theme: "physics-informed ML",
    href: "/research/#theme-physics-ml",
  },
  jax: {
    theme: "cell fate and animal behavior",
    href: "/research/#theme-cell-fate",
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
      if (end !== null && start - end > 1) {
        const delta = start - end;
        items.push({
          kind: "gap",
          label: `${end}–${start}`,
        });
      }
    }
  }

  return items;
}

/** @param {"edu"|"industry"|"research"|"current"} type */
export function stopAccent(type) {
  switch (type) {
    case "edu":
      return "blue";
    case "industry":
      return "gold";
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
