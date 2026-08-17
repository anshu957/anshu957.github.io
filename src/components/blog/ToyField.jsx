import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { colorForRole, round2, toyIntegrate } from "./dynamics/toggleModel.js";
import "./ToyField.css";

// The simplest possible attractor/repeller/basin picture: vẋ = x − x³,
// vẏ = −y. No genes, no biology — just the vocabulary this essay needs
// before the toggle switch shows up. Two stable attractors at (±1, 0);
// one repeller at the origin (a saddle, technically, since it still pulls
// inward along y — but from the x=0 decision axis it repels).

const X_MIN = -1.6;
const X_MAX = 1.6;
const Y_MIN = -1.2;
const Y_MAX = 1.2;

const WIDTH = 480;
const HEIGHT = 360;
const MARGIN = 34;
const GRID_NX = 20; // dense on purpose — this figure exists to make the field legible
const GRID_NY = 15;
const MAX_TRAJECTORIES = 6;

const COLOR_LEFT = colorForRole("erythroid");
const COLOR_RIGHT = colorForRole("myeloid");
const COLOR_CENTER = colorForRole("progenitor");

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function toPx([x, y]) {
  const px = MARGIN + ((x - X_MIN) / (X_MAX - X_MIN)) * (WIDTH - 2 * MARGIN);
  const py = HEIGHT - MARGIN - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * (HEIGHT - 2 * MARGIN);
  return [round2(px), round2(py)];
}

function toModel(px, py) {
  const x = X_MIN + ((px - MARGIN) / (WIDTH - 2 * MARGIN)) * (X_MAX - X_MIN);
  const y = Y_MIN + ((HEIGHT - MARGIN - py) / (HEIGHT - 2 * MARGIN)) * (Y_MAX - Y_MIN);
  return [Math.max(X_MIN, Math.min(X_MAX, x)), Math.max(Y_MIN, Math.min(Y_MAX, y))];
}

function pathD(points) {
  return points.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${toPx([x, y]).join(",")}`).join(" ");
}

const FIXED_POINTS = [
  { x: -1, y: 0, kind: "attractor", color: COLOR_LEFT },
  { x: 1, y: 0, kind: "attractor", color: COLOR_RIGHT },
  { x: 0, y: 0, kind: "repeller", color: COLOR_CENTER },
];

export default function ToyField() {
  const reducedMotion = useMemo(prefersReducedMotion, []);
  const [trajectories, setTrajectories] = useState([]);
  const [revealCounts, setRevealCounts] = useState([]);
  const svgRef = useRef(null);
  const rafRef = useRef(null);

  const arrows = useMemo(() => {
    const out = [];
    const stepX = (X_MAX - X_MIN) / GRID_NX;
    const stepY = (Y_MAX - Y_MIN) / GRID_NY;
    for (let i = 0; i <= GRID_NX; i += 1) {
      for (let j = 0; j <= GRID_NY; j += 1) {
        const x = X_MIN + i * stepX;
        const y = Y_MIN + j * stepY;
        if (FIXED_POINTS.some((p) => Math.hypot(p.x - x, p.y - y) < 0.16)) continue;
        const vx = x - x ** 3;
        const vy = -y;
        const mag = Math.hypot(vx, vy) || 1;
        const len = 0.13;
        const ex = x + (vx / mag) * len;
        const ey = y + (vy / mag) * len;
        out.push([toPx([x, y]), toPx([ex, ey])]);
      }
    }
    return out;
  }, []);

  const dropCellAt = useCallback(
    (x, y) => {
      const points = toyIntegrate(x, y, { dt: 0.03, T: 8 });
      const [fx] = points[points.length - 1];
      const color = fx >= 0 ? COLOR_RIGHT : COLOR_LEFT;
      setTrajectories((prev) => [...prev, { points, color }].slice(-MAX_TRAJECTORIES));
      setRevealCounts((prev) => [...prev, reducedMotion ? points.length : 1].slice(-MAX_TRAJECTORIES));
    },
    [reducedMotion],
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
      dropCellAt(-0.5, -0.6);
      dropCellAt(0.4, 0.7);
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

  const [zeroX] = toPx([0, 0]);
  const [, topY] = toPx([0, Y_MAX]);
  const [, bottomY] = toPx([0, Y_MIN]);
  const [leftX] = toPx([X_MIN, 0]);
  const [rightX] = toPx([X_MAX, 0]);

  return (
    <figure className="tf-figure">
      <div className="tf-canvas-wrap">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="tf-svg"
          onClick={handleClick}
          role="img"
          aria-label="A two-dimensional vector field with two stable attractors and one repeller between them. Colored regions are each attractor's basin, divided by a separatrix through the repeller. Click anywhere to drop a point and watch it flow to one attractor or the other."
        >
          <defs>
            <marker id="tf-arrowhead" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4.2" markerHeight="4.2" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 Z" className="tf-arrowhead-fill" />
            </marker>
          </defs>

          {/* basins */}
          <rect x={leftX} y={topY} width={zeroX - leftX} height={bottomY - topY} className="tf-basin" style={{ fill: COLOR_LEFT }} />
          <rect x={zeroX} y={topY} width={rightX - zeroX} height={bottomY - topY} className="tf-basin" style={{ fill: COLOR_RIGHT }} />
          <text x={leftX + 10} y={topY + 16} className="tf-basin-label">
            basin
          </text>
          <text x={rightX - 10} y={topY + 16} textAnchor="end" className="tf-basin-label">
            basin
          </text>

          {/* separatrix */}
          <line x1={zeroX} y1={topY} x2={zeroX} y2={bottomY} className="tf-separatrix" />

          {/* flow field */}
          {arrows.map(([a, b], i) => (
            <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} className="tf-arrow" markerEnd="url(#tf-arrowhead)" />
          ))}

          {/* trajectories */}
          {trajectories.map((traj, i) => {
            const revealed = traj.points.slice(0, revealCounts[i] ?? traj.points.length);
            if (revealed.length < 2) return null;
            const [hx, hy] = toPx(revealed[revealed.length - 1]);
            const [sx, sy] = toPx(revealed[0]);
            return (
              <g key={i}>
                <path d={pathD(revealed)} className="tf-path" style={{ stroke: traj.color }} />
                <circle cx={sx} cy={sy} r={3} className="tf-path-start" />
                <circle cx={hx} cy={hy} r={4} style={{ fill: traj.color }} />
              </g>
            );
          })}

          {/* fixed points */}
          {FIXED_POINTS.map((p, i) => {
            const [px, py] = toPx([p.x, p.y]);
            if (p.kind === "repeller") {
              const s = 5;
              return (
                <g key={i}>
                  <line x1={px - s} y1={py - s} x2={px + s} y2={py + s} className="tf-saddle-mark" />
                  <line x1={px - s} y1={py + s} x2={px + s} y2={py - s} className="tf-saddle-mark" />
                  <text x={px} y={py - 14} textAnchor="middle" className="tf-label tf-label--saddle">
                    progenitor (unstable)
                  </text>
                </g>
              );
            }
            return (
              <g key={i}>
                <circle cx={px} cy={py} r={7} className="tf-fixed-dot" style={{ fill: p.color }} />
                <text x={px} y={py + 22} textAnchor="middle" className="tf-label">
                  mature cell
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="tf-controls">
        <span className="tf-hint">click anywhere to drop a point</span>
        <button type="button" className="tf-button--ghost" onClick={reset}>
          reset
        </button>
      </div>

      <figcaption>
        A simple field, ẋ = x − x³ and ẏ = −y. No genes yet, just the shape. The two colored dots are attractors:
        nearby points settle into them and stay. The point in the middle is a repeller: points near it get pushed
        away to one side or the other. Each shaded half is a basin, and the line dividing them is the separatrix.
      </figcaption>
    </figure>
  );
}
