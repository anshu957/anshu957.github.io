import { useEffect, useMemo, useRef, useState } from "react";
import "./RealDataFigure.css";

const DATA_URL = "/assets/blog/data/bonemarrow-velocity.json";
const GRID_N = 22;

// The mature endpoints of each lineage arm — not the stem/progenitor
// clusters (HSC_1, HSC_2, Precursors) and not the intermediate ones
// (Mono_1, Ery_1) that still have somewhere left to go.
const TERMINAL_CLUSTERS = ["Mono_2", "DCs", "Ery_2", "Mega", "CLP"];
const TERMINAL_FRACTION = 0.15; // top 15% by pseudotime, per cluster

const PALETTE_LIGHT = {
  "HSC_1": "#9b5744",
  "HSC_2": "#c07a52",
  "Precursors": "#8a7a4a",
  "CLP": "#6b7fb0",
  "Mono_1": "#5e7257",
  "Mono_2": "#7f9a6e",
  "DCs": "#7a6a9e",
  "Ery_1": "#b24a4a",
  "Ery_2": "#c97a6a",
  "Mega": "#c89a52",
};

const PALETTE_DARK = {
  "HSC_1": "#e08872",
  "HSC_2": "#e6ad86",
  "Precursors": "#c7b783",
  "CLP": "#8fa0cb",
  "Mono_1": "#8faa84",
  "Mono_2": "#aec7a0",
  "DCs": "#ab9bd0",
  "Ery_1": "#e08080",
  "Ery_2": "#eba99a",
  "Mega": "#d4b06a",
};

function useIsDark() {
  const [isDark, setIsDark] = useState(
    typeof document !== "undefined" && document.documentElement.classList.contains("dark"),
  );
  useEffect(() => {
    const el = document.documentElement;
    const observer = new MutationObserver(() => setIsDark(el.classList.contains("dark")));
    observer.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

export default function RealDataFigure({ citeN }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [hidden, setHidden] = useState(() => new Set());
  const [showFlow, setShowFlow] = useState(false);
  const [showConcepts, setShowConcepts] = useState(false);
  const [hover, setHover] = useState(null);
  const [attractorLabels, setAttractorLabels] = useState([]);
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const isDark = useIsDark();
  const palette = isDark ? PALETTE_DARK : PALETTE_LIGHT;

  useEffect(() => {
    let cancelled = false;
    fetch(DATA_URL)
      .then((res) => {
        if (!res.ok) throw new Error("failed to load");
        return res.json();
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const flowGrid = useMemo(() => {
    if (!data) return [];
    const bins = new Map();
    for (const cell of data.cells) {
      if (hidden.has(cell.c)) continue;
      const gx = Math.floor(cell.x * GRID_N);
      const gy = Math.floor(cell.y * GRID_N);
      const key = `${gx},${gy}`;
      const bin = bins.get(key) ?? { x: 0, y: 0, vx: 0, vy: 0, n: 0 };
      bin.x += cell.x;
      bin.y += cell.y;
      bin.vx += cell.vx;
      bin.vy += cell.vy;
      bin.n += 1;
      bins.set(key, bin);
    }
    return Array.from(bins.values())
      .filter((b) => b.n >= 3)
      .map((b) => ({ x: b.x / b.n, y: b.y / b.n, vx: b.vx / b.n, vy: b.vy / b.n }));
  }, [data, hidden]);

  // Each terminal lineage's attractor: the centroid of its own most mature
  // cells (top TERMINAL_FRACTION by pseudotime), not a hand-picked point.
  const attractors = useMemo(() => {
    if (!data) return [];
    return TERMINAL_CLUSTERS.map((c) => {
      const cells = data.cells.filter((cell) => cell.c === c && cell.t != null);
      if (cells.length === 0) return null;
      const topN = Math.max(1, Math.round(cells.length * TERMINAL_FRACTION));
      const top = [...cells].sort((a, b) => b.t - a.t).slice(0, topN);
      const x = top.reduce((sum, d) => sum + d.x, 0) / top.length;
      const y = top.reduce((sum, d) => sum + d.y, 0) / top.length;
      return { c, x, y, label: data.clusterLabels[c] ?? c };
    }).filter(Boolean);
  }, [data]);

  useEffect(() => {
    if (!data) return;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    const dpr = window.devicePixelRatio || 1;
    const rect = wrap.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const pad = 14;
    const w = rect.width - pad * 2;
    const h = rect.height - pad * 2;
    const px = (x) => pad + x * w;
    const py = (y) => pad + (1 - y) * h;

    for (const cell of data.cells) {
      if (hidden.has(cell.c)) continue;
      ctx.fillStyle = palette[cell.c] ?? "#999";
      ctx.globalAlpha = 0.62;
      ctx.beginPath();
      ctx.arc(px(cell.x), py(cell.y), 1.7, 0, Math.PI * 2);
      ctx.fill();
    }

    if (showFlow) {
      ctx.globalAlpha = 0.85;
      ctx.strokeStyle = isDark ? "#f0dcc8" : "#211512";
      ctx.lineWidth = 1;
      const ARROW_SCALE = 10;
      for (const b of flowGrid) {
        const x0 = px(b.x);
        const y0 = py(b.y);
        const x1 = px(b.x + b.vx * ARROW_SCALE);
        const y1 = py(b.y + b.vy * ARROW_SCALE);
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
        const angle = Math.atan2(y1 - y0, x1 - x0);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 - 4 * Math.cos(angle - 0.4), y1 - 4 * Math.sin(angle - 0.4));
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 - 4 * Math.cos(angle + 0.4), y1 - 4 * Math.sin(angle + 0.4));
        ctx.stroke();
      }
    }

    if (showConcepts) {
      const ringColor = isDark ? "#f4ead9" : "#211512";
      const labels = [];
      ctx.globalAlpha = 1;
      for (const a of attractors) {
        if (hidden.has(a.c)) continue;
        const cx = px(a.x);
        const cy = py(a.y);
        ctx.beginPath();
        ctx.arc(cx, cy, 7, 0, Math.PI * 2);
        ctx.strokeStyle = ringColor;
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fillStyle = palette[a.c] ?? "#999";
        ctx.fill();
        labels.push({ key: a.c, left: cx, top: cy, label: a.label });
      }
      setAttractorLabels(labels);
    } else if (attractorLabels.length) {
      setAttractorLabels([]);
    }
    ctx.globalAlpha = 1;
    // attractorLabels intentionally excluded: it's set by this effect, not read from it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, hidden, showFlow, showConcepts, isDark, palette, attractors]);

  const handleMove = (e) => {
    if (!data) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const pad = 14;
    const w = rect.width - pad * 2;
    const h = rect.height - pad * 2;
    const mx = (e.clientX - rect.left - pad) / w;
    const my = 1 - (e.clientY - rect.top - pad) / h;

    let best = null;
    let bestD = 0.02;
    for (const cell of data.cells) {
      if (hidden.has(cell.c)) continue;
      const d = (cell.x - mx) ** 2 + (cell.y - my) ** 2;
      if (d < bestD) {
        bestD = d;
        best = cell;
      }
    }
    setHover(best);
  };

  const toggleCluster = (c) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  };

  if (error) {
    return <p className="rdf-error">The bone marrow dataset didn't load. The rest of the figure sits this one out.</p>;
  }

  return (
    <figure className="rdf-figure">
      <div className="rdf-canvas-wrap" ref={wrapRef} onMouseMove={handleMove} onMouseLeave={() => setHover(null)}>
        <canvas ref={canvasRef} className="rdf-canvas" />
        {!data && <div className="rdf-loading">loading 5,780 real cells…</div>}
        {attractorLabels.map((m) => (
          <div key={m.key} className="rdf-attractor-label" style={{ left: m.left, top: m.top }}>
            {m.label}
          </div>
        ))}
        {hover && (
          <div className="rdf-tooltip">
            {data.clusterLabels[hover.c] ?? hover.c}
            {hover.t != null ? ` · pseudotime ${hover.t.toFixed(2)}` : ""}
          </div>
        )}
      </div>

      <div className="rdf-controls">
        <div className="rdf-toggle-row">
          <button type="button" className="rdf-flow-toggle" onClick={() => setShowFlow((v) => !v)}>
            {showFlow ? "hide flow" : "show flow"}
          </button>
          <button type="button" className="rdf-flow-toggle rdf-flow-toggle--ghost" onClick={() => setShowConcepts((v) => !v)}>
            {showConcepts ? "hide concept map" : "map concepts"}
          </button>
        </div>
        <div className="rdf-legend">
          {data &&
            Object.entries(data.clusterLabels).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`rdf-legend-item${hidden.has(key) ? " rdf-legend-item--off" : ""}`}
                onClick={() => toggleCluster(key)}
                style={{ "--swatch": palette[key] }}
              >
                {label}
              </button>
            ))}
        </div>
        {showConcepts && (
          <div className="rdf-concept-note">
            Ringed dots mark each terminal lineage's attractor: the centroid of its own most mature cells, the top
            15% by pseudotime. The colored region around each one is that attractor's basin, and the arrows are the
            measured flow, RNA velocity, not drawn by hand.
          </div>
        )}
      </div>

      <figcaption>
        Real data: 5,780 human CD34+ bone marrow cells, embedded and given an RNA-velocity field computed with
        scVelo, from Setty et al. 2019
        {citeN != null && (
          <sup className="rdf-cite">
            <a href={`#ref-${citeN}`}>{citeN}</a>
          </sup>
        )}
        . Click a legend entry to isolate a lineage; toggle flow to see the velocity field this whole essay has
        been arguing for.
      </figcaption>
    </figure>
  );
}
