import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AXIS_MAX,
  REGIMES,
  basinGrid,
  colorForRole,
  fixedPoints,
  field,
  integrate,
  nearestStableRole,
  round2,
  traceSeparatrix,
} from "./dynamics/toggleModel.js";
import "./PhasePortrait.css";

// Bistable-committed regime (S=1.0, spec §3b/§8): exactly three fixed
// points — two stable attractors (the committed fates) and one saddle at
// the center (the undecided progenitor). No third "progenitor" attractor —
// that was the tristable regime's shape, which belongs to a different S.
const PARAMS = REGIMES.bistableCommitted;
const WIDTH = 560;
const HEIGHT = 560;
const MARGIN = 44;
const BASIN_N = 46;
const FLOW_N = 24;
const MAX_TRAJECTORIES = 8;
const BASIN_ALPHA_SUBTLE = 0.12;
const BASIN_ALPHA_FATEMAP = 0.4;
const ROLE_LABEL = {
  myeloid: "myeloid",
  erythroid: "erythroid",
  undecided: "progenitor (undecided)",
};

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function toPx([x, y]) {
  const px = MARGIN + (x / AXIS_MAX) * (WIDTH - 2 * MARGIN);
  const py = HEIGHT - MARGIN - (y / AXIS_MAX) * (HEIGHT - 2 * MARGIN);
  return [round2(px), round2(py)];
}

function toModel(px, py) {
  const x = ((px - MARGIN) / (WIDTH - 2 * MARGIN)) * AXIS_MAX;
  const y = ((HEIGHT - MARGIN - py) / (HEIGHT - 2 * MARGIN)) * AXIS_MAX;
  return [Math.max(0, Math.min(AXIS_MAX, x)), Math.max(0, Math.min(AXIS_MAX, y))];
}

function pathD(points) {
  return points.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${toPx([x, y]).join(",")}`).join(" ");
}

// Basin shading is ~2000 grid cells — drawn to a canvas rather than as SVG
// <rect> elements so the figure doesn't bake thousands of DOM nodes into
// the page. Mirrors RealDataFigure's light/dark palette pattern.
function useIsDark() {
  const [isDark, setIsDark] = useState(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("dark"),
  );
  useEffect(() => {
    const el = document.documentElement;
    const observer = new MutationObserver(() => setIsDark(el.classList.contains("dark")));
    observer.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

export default function PhasePortrait() {
  const reducedMotion = useMemo(prefersReducedMotion, []);
  const [trajectories, setTrajectories] = useState([]);
  const [revealCounts, setRevealCounts] = useState([]);
  const [showFateMap, setShowFateMap] = useState(false);
  const svgRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const isDark = useIsDark();

  const fixedPts = useMemo(() => fixedPoints(PARAMS), []);
  // Basin classification is ~2000 grid cells x a few hundred RK4 steps —
  // a few hundred ms of main-thread work. Compute it after first paint
  // (idle callback) so it doesn't block hydration or the initial dots/
  // controls from appearing; T/dt here are looser than trajectory playback
  // needs, just enough for reliable classification (verified against the
  // T=40/dt=0.05 reference — identical basin counts and separatrix).
  const [basin, setBasin] = useState(null);
  useEffect(() => {
    const compute = () => setBasin(basinGrid(PARAMS, { N: BASIN_N, T: 20, dt: 0.08 }));
    if (typeof requestIdleCallback === "function") {
      const id = requestIdleCallback(compute);
      return () => cancelIdleCallback(id);
    }
    const id = setTimeout(compute, 0);
    return () => clearTimeout(id);
  }, []);
  const separatrix = useMemo(() => (basin ? traceSeparatrix(basin) : []), [basin]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !basin) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);
    const scaleX = rect.width / WIDTH;
    const scaleY = rect.height / HEIGHT;
    const cellW = ((WIDTH - 2 * MARGIN) / basin.N) * scaleX + 0.6;
    const cellH = ((HEIGHT - 2 * MARGIN) / basin.N) * scaleY + 0.6;
    const style = getComputedStyle(document.documentElement);
    const colorCache = new Map();
    const resolve = (role) => {
      const varName = colorForRole(role);
      if (!colorCache.has(varName)) {
        const match = /var\((--[\w-]+)\)/.exec(varName);
        colorCache.set(varName, match ? style.getPropertyValue(match[1]).trim() : varName);
      }
      return colorCache.get(varName);
    };
    ctx.globalAlpha = showFateMap ? BASIN_ALPHA_FATEMAP : BASIN_ALPHA_SUBTLE;
    for (let i = 0; i < basin.N; i += 1) {
      for (let j = 0; j < basin.N; j += 1) {
        const id = basin.ids[i * basin.N + j];
        if (id < 0) continue;
        const role = basin.attractors[id]?.role;
        const x = ((i + 0.5) / basin.N) * AXIS_MAX;
        const y = ((j + 0.5) / basin.N) * AXIS_MAX;
        const [px, py] = toPx([x, y]);
        ctx.fillStyle = resolve(role);
        ctx.fillRect(px * scaleX - cellW / 2, py * scaleY - cellH / 2, cellW, cellH);
      }
    }
    ctx.globalAlpha = 1;
  }, [basin, isDark, showFateMap]);

  const arrows = useMemo(() => {
    const out = [];
    const step = AXIS_MAX / FLOW_N;
    for (let i = 0; i <= FLOW_N; i += 1) {
      for (let j = 0; j <= FLOW_N; j += 1) {
        const x = i * step;
        const y = j * step;
        if (fixedPts.some((p) => Math.hypot(p.x - x, p.y - y) < 0.1)) continue;
        const [vx, vy] = field(PARAMS, x, y);
        const mag = Math.hypot(vx, vy) || 1;
        const len = 0.115;
        const ex = x + (vx / mag) * len;
        const ey = y + (vy / mag) * len;
        out.push([toPx([x, y]), toPx([ex, ey])]);
      }
    }
    return out;
  }, [fixedPts]);

  const dropCellAt = useCallback(
    (x, y) => {
      const points = integrate(PARAMS, x, y, { dt: 0.03, T: 20 });
      const [fx, fy] = points[points.length - 1];
      const role = nearestStableRole(fixedPts, fx, fy);
      setTrajectories((prev) => [...prev, { points, role }].slice(-MAX_TRAJECTORIES));
      setRevealCounts((prev) => [...prev, reducedMotion ? points.length : 1].slice(-MAX_TRAJECTORIES));
    },
    [fixedPts, reducedMotion],
  );

  const handleClick = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = WIDTH / rect.width;
    const scaleY = HEIGHT / rect.height;
    const px = (e.clientX - rect.left) * scaleX;
    const py = (e.clientY - rect.top) * scaleY;
    const [x, y] = toModel(px, py);
    dropCellAt(x, y);
  };

  const reset = useCallback(() => {
    setTrajectories([]);
    setRevealCounts([]);
  }, []);

  useEffect(() => {
    if (trajectories.length === 0) {
      dropCellAt(0.3, 2.1);
      dropCellAt(2.1, 0.3);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (reducedMotion) return undefined;
    function tick() {
      setRevealCounts((prev) => {
        let changed = false;
        const next = prev.map((count, i) => {
          const total = trajectories[i]?.points.length ?? 0;
          if (count < total) {
            changed = true;
            return count + 4;
          }
          return count;
        });
        return changed ? next : prev;
      });
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [trajectories, reducedMotion]);

  return (
    <figure className="pp-figure">
      <div className="pp-canvas-wrap">
        <canvas ref={canvasRef} className="pp-basin-canvas" />
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="pp-svg"
          onClick={handleClick}
          role="img"
          aria-label="Phase portrait of the PU.1/GATA1 toggle switch in its bistable regime: two committed-fate attractors, myeloid and erythroid, separated by a single saddle point at the center, the undecided progenitor, and the separatrix between their two basins. Click anywhere to drop a cell and watch it settle; toggle the fate map to flood the whole plane by destiny."
        >
          <defs>
            <marker id="pp-arrowhead" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4.2" markerHeight="4.2" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 Z" className="pp-arrowhead-fill" />
            </marker>
            <marker id="pp-loop-arrowhead" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="3.6" markerHeight="3.6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 Z" className="pp-schematic-arrowhead" />
            </marker>
          </defs>

          {/* flow field */}
          {arrows.map(([a, b], i) => (
            <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} className="pp-arrow" markerEnd="url(#pp-arrowhead)" />
          ))}

          {/* separatrix */}
          {separatrix.map(([a, b], i) => {
            const [x1, y1] = toPx(a);
            const [x2, y2] = toPx(b);
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                className={`pp-separatrix${showFateMap ? " pp-separatrix--bold" : ""}`}
              />
            );
          })}

          {/* trajectories */}
          {trajectories.map((traj, i) => {
            const revealed = traj.points.slice(0, revealCounts[i] ?? traj.points.length);
            if (revealed.length < 2) return null;
            const color = traj.role ? colorForRole(traj.role) : "var(--ms-muted)";
            const [hx, hy] = toPx(revealed[revealed.length - 1]);
            const [sx, sy] = toPx(revealed[0]);
            return (
              <g key={i}>
                <path d={pathD(revealed)} className="pp-path" style={{ stroke: color }} />
                <circle cx={sx} cy={sy} r={3} className="pp-path-start" />
                <circle cx={hx} cy={hy} r={4} style={{ fill: color }} />
              </g>
            );
          })}

          {/* fixed points */}
          {fixedPts.map((p, i) => {
            const [px, py] = toPx([p.x, p.y]);
            const [cx, cy] = toPx([AXIS_MAX / 2, AXIS_MAX / 2]);
            const dx = px - cx;
            const dy = py - cy;
            const len = Math.hypot(dx, dy) || 1;
            const SAFE_L = MARGIN + 4;
            const SAFE_R = WIDTH - 6;
            const SAFE_T = 14;
            const SAFE_B = HEIGHT - 6;
            const lx = Math.min(SAFE_R, Math.max(SAFE_L, px + (dx / len) * 22));
            const ly = Math.min(SAFE_B, Math.max(SAFE_T, py + (dy / len) * 22));
            let anchor = dx >= 0 ? "start" : "end";
            if (lx <= SAFE_L + 0.5) anchor = "start";
            if (lx >= SAFE_R - 0.5) anchor = "end";
            const label = ROLE_LABEL[p.role] ?? p.role;
            if (p.type === "saddle") {
              const s = 4.5;
              return (
                <g key={i}>
                  <line x1={px - s} y1={py - s} x2={px + s} y2={py + s} className="pp-saddle-mark" />
                  <line x1={px - s} y1={py + s} x2={px + s} y2={py - s} className="pp-saddle-mark" />
                  <text x={lx} y={ly} textAnchor={anchor} className="pp-label pp-label--saddle">
                    {label}
                  </text>
                </g>
              );
            }
            return (
              <g key={i}>
                <circle cx={px} cy={py} r={6.5} className="pp-fixed-dot" style={{ fill: colorForRole(p.role) }} />
                <text x={lx} y={ly} textAnchor={anchor} className="pp-label">
                  {label}
                </text>
              </g>
            );
          })}

          {/* axis labels */}
          <text x={WIDTH / 2} y={HEIGHT - 10} textAnchor="middle" className="pp-axis-label">
            PU.1 (myeloid) →
          </text>
          <text
            x={16}
            y={HEIGHT / 2}
            textAnchor="middle"
            className="pp-axis-label"
            transform={`rotate(-90 16 ${HEIGHT / 2})`}
          >
            GATA1 (erythroid) →
          </text>

          {/* circuit schematic inset: self-activation + mutual repression */}
          <g aria-hidden="true" className="pp-schematic">
            <rect x={40} y={6} width={176} height={74} rx={7} className="pp-schematic-panel" />
            {/* mutual repression: line ending in a bar (⊣) at each node, not an arrowhead */}
            <line x1={90} y1={44} x2={156} y2={44} className="pp-schematic-link" />
            <line x1={90} y1={39.5} x2={90} y2={48.5} className="pp-schematic-bar" />
            <line x1={156} y1={39.5} x2={156} y2={48.5} className="pp-schematic-bar" />
            {/* self-activation loops */}
            <path
              d="M 71.35,38.5 C 64,20 92,20 84.65,38.5"
              className="pp-schematic-loop"
              markerEnd="url(#pp-loop-arrowhead)"
            />
            <path
              d="M 161.35,38.5 C 154,20 182,20 174.65,38.5"
              className="pp-schematic-loop"
              markerEnd="url(#pp-loop-arrowhead)"
            />
            <circle cx={78} cy={44} r={9} className="pp-schematic-node" style={{ fill: colorForRole("myeloid") }} />
            <circle cx={168} cy={44} r={9} className="pp-schematic-node" style={{ fill: colorForRole("erythroid") }} />
            <text x={78} y={68} textAnchor="middle" className="pp-schematic-label">
              PU.1
            </text>
            <text x={168} y={68} textAnchor="middle" className="pp-schematic-label">
              GATA1
            </text>
          </g>
        </svg>
      </div>

      <div className="pp-controls">
        <span className="pp-hint">click anywhere in the plane to drop a cell</span>
        <div className="pp-buttons">
          <button
            type="button"
            className={`pp-button--ghost${showFateMap ? " pp-button--active" : ""}`}
            onClick={() => setShowFateMap((v) => !v)}
            aria-pressed={showFateMap}
          >
            {showFateMap ? "hide fate map" : "show fate map"}
          </button>
          <button type="button" className="pp-button--ghost" onClick={reset}>
            reset
          </button>
        </div>
      </div>

      <figcaption>
        Bistable regime (S=1.0): two committed-fate attractors, myeloid and erythroid, and a single saddle at the
        center, the undecided progenitor, not a third attractor. The separatrix (roughly the diagonal x=y) divides
        the plane into their two basins of attraction; "show fate map" floods every point by which fate it's
        destined for. Inset: the circuit, where each gene activates itself and represses the other.
      </figcaption>
    </figure>
  );
}
