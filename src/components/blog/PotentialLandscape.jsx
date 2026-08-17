import { useEffect, useMemo, useRef, useState } from "react";
import {
  AXIS_MAX,
  S_C2,
  colorForRole,
  countExtrema,
  field,
  fixedPoints,
  normalizeParams,
  potentialCurve,
  round2,
} from "./dynamics/toggleModel.js";
import "./PotentialLandscape.css";

// Waddington's landscape, made literal, shown two ways at once from one
// shared slider: a compact phase portrait of the real 2-D toggle (left) and
// its 1-D reduction Δ = PU.1 − GATA1 on the slow manifold x+y≈2 (right).
// Sweeping the signal S makes a single attractor split into two, visibly,
// on both sides — see toggleModel.js's fixedPoints()/potentialCurve() and
// the dev assertion at S=2.2 vs S=1.0.

const S_MIN = 1.0;
const S_MAX = 2.5;
const DEFAULT_S = 2.2; // single well — above S_c2 ≈ 1.554

// -- right panel: 1-D potential --------------------------------------------
const WIDTH_R = 380;
const HEIGHT_R = 240;
const MARGIN_X = 30;
const MARGIN_TOP = 18;
const MARGIN_BOTTOM = 28;

// -- left panel: compact 2-D phase portrait --------------------------------
const WIDTH_L = 240;
const HEIGHT_L = 240;
const MARGIN_L = 18;
const FLOW_N_L = 9;

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function toPxL([x, y]) {
  const px = MARGIN_L + (x / AXIS_MAX) * (WIDTH_L - 2 * MARGIN_L);
  const py = HEIGHT_L - MARGIN_L - (y / AXIS_MAX) * (HEIGHT_L - 2 * MARGIN_L);
  return [round2(px), round2(py)];
}

export default function PotentialLandscape() {
  const reducedMotion = useMemo(prefersReducedMotion, []);
  const [S, setS] = useState(DEFAULT_S);
  const ballDeltaRef = useRef(0);

  const params = useMemo(() => normalizeParams({ a: 1, b: 1, S, n: 4, k: 1 }), [S]);
  const curve = useMemo(() => potentialCurve(params, { nSamples: 320 }), [params]);
  const extrema = useMemo(() => countExtrema(curve.U), [curve]);

  const minimaDeltas = extrema.minIdx.map((i) => curve.deltas[i]);
  const split = minimaDeltas.length > 1;

  // The ball tracks whichever minimum is nearest its last resting spot, so
  // it rolls smoothly to one side the moment the valley splits rather than
  // teleporting; on a tie (the instant of the split) it keeps the lower
  // index (erythroid/negative-Δ side), an arbitrary but stable choice.
  const ballDelta = useMemo(() => {
    if (minimaDeltas.length === 0) return ballDeltaRef.current;
    let best = minimaDeltas[0];
    let bestDist = Infinity;
    minimaDeltas.forEach((d) => {
      const dist = Math.abs(d - ballDeltaRef.current);
      if (dist < bestDist) {
        bestDist = dist;
        best = d;
      }
    });
    ballDeltaRef.current = best;
    return best;
  }, [minimaDeltas]);

  const [uMin, uMax] = useMemo(() => {
    let lo = Infinity;
    let hi = -Infinity;
    curve.U.forEach((v) => {
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    });
    const pad = (hi - lo) * 0.18 || 0.1;
    return [lo - pad, hi + pad];
  }, [curve]);

  const toPxR = ([delta, u]) => {
    const px = MARGIN_X + ((delta + 2) / 4) * (WIDTH_R - 2 * MARGIN_X);
    const py = HEIGHT_R - MARGIN_BOTTOM - ((u - uMin) / (uMax - uMin)) * (HEIGHT_R - MARGIN_TOP - MARGIN_BOTTOM);
    return [round2(px), round2(py)];
  };

  const pathD = curve.deltas.map((d, i) => `${i === 0 ? "M" : "L"} ${toPxR([d, curve.U[i]]).join(",")}`).join(" ");

  const ballU = useMemo(() => {
    // nearest sample to ballDelta, for the marker's height
    let bestI = 0;
    let bestDist = Infinity;
    curve.deltas.forEach((d, i) => {
      const dist = Math.abs(d - ballDelta);
      if (dist < bestDist) {
        bestDist = dist;
        bestI = i;
      }
    });
    return curve.U[bestI];
  }, [curve, ballDelta]);

  const [ballPx, ballPy] = toPxR([ballDelta, ballU]);
  const ballRole = !split ? "progenitor" : ballDelta >= 0 ? "myeloid" : "erythroid";

  const zeroX = toPxR([0, uMin])[0];
  const hilltopY = useMemo(() => {
    if (extrema.maxIdx.length === 0) return null;
    const i = extrema.maxIdx[0];
    return toPxR([curve.deltas[i], curve.U[i]])[1];
  }, [curve, extrema]);

  // Left panel: the real 2-D field at the current S, with its own fixed
  // points — one attractor at high S, two attractors + a central saddle
  // once S drops past S_c2.
  const fixedPts = useMemo(() => fixedPoints(params), [params]);
  const arrowsL = useMemo(() => {
    const out = [];
    const step = AXIS_MAX / FLOW_N_L;
    for (let i = 0; i <= FLOW_N_L; i += 1) {
      for (let j = 0; j <= FLOW_N_L; j += 1) {
        const x = i * step;
        const y = j * step;
        if (fixedPts.some((p) => Math.hypot(p.x - x, p.y - y) < 0.2)) continue;
        const [vx, vy] = field(params, x, y);
        const mag = Math.hypot(vx, vy) || 1;
        const len = 0.17;
        const ex = x + (vx / mag) * len;
        const ey = y + (vy / mag) * len;
        out.push([toPxL([x, y]), toPxL([ex, ey])]);
      }
    }
    return out;
  }, [params, fixedPts]);

  return (
    <figure className="pl-figure">
      <div className="pl-panels">
        <div className="pl-panel">
          <span className="pl-panel-title">phase portrait</span>
          <svg
            viewBox={`0 0 ${WIDTH_L} ${HEIGHT_L}`}
            className="pl-flow-svg"
            role="img"
            aria-label={
              split
                ? "Phase portrait with two attractors, myeloid and erythroid, and a central saddle."
                : "Phase portrait with a single central attractor, the multipotent progenitor."
            }
          >
            <defs>
              <marker id="pl-flow-arrowhead" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 Z" className="pl-flow-arrowhead-fill" />
              </marker>
            </defs>
            {arrowsL.map(([a, b], i) => (
              <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} className="pl-flow-arrow" markerEnd="url(#pl-flow-arrowhead)" />
            ))}
            {fixedPts.map((p, i) => {
              const [px, py] = toPxL([p.x, p.y]);
              if (p.type === "saddle") {
                const s = 5;
                return (
                  <g key={i}>
                    <line x1={px - s} y1={py - s} x2={px + s} y2={py + s} className="pl-flow-saddle" />
                    <line x1={px - s} y1={py + s} x2={px + s} y2={py - s} className="pl-flow-saddle" />
                  </g>
                );
              }
              return <circle key={i} cx={px} cy={py} r={6} className="pl-flow-dot" style={{ fill: colorForRole(p.role) }} />;
            })}
          </svg>
        </div>

        <div className="pl-panel">
          <span className="pl-panel-title">potential</span>
          <svg
            viewBox={`0 0 ${WIDTH_R} ${HEIGHT_R}`}
            className="pl-svg"
            role="img"
            aria-label={
              split
                ? "Effective potential landscape with two wells, myeloid and erythroid, separated by a central hilltop where the progenitor's valley used to be. A ball rests in one well."
                : "Effective potential landscape with a single well at the center: the multipotent progenitor state as a real valley. A ball rests at the bottom."
            }
          >
            {/* background half-bands, always present but subtle */}
            <rect x={MARGIN_X} y={MARGIN_TOP} width={zeroX - MARGIN_X} height={HEIGHT_R - MARGIN_TOP - MARGIN_BOTTOM} className="pl-band" style={{ fill: colorForRole("erythroid") }} />
            <rect x={zeroX} y={MARGIN_TOP} width={WIDTH_R - MARGIN_X - zeroX} height={HEIGHT_R - MARGIN_TOP - MARGIN_BOTTOM} className="pl-band" style={{ fill: colorForRole("myeloid") }} />

            <line x1={MARGIN_X} y1={HEIGHT_R - MARGIN_BOTTOM} x2={WIDTH_R - MARGIN_X} y2={HEIGHT_R - MARGIN_BOTTOM} className="pl-axis" />

            <path d={pathD} className="pl-curve" />

            {hilltopY != null && (
              <g>
                <line x1={zeroX} y1={MARGIN_TOP} x2={zeroX} y2={HEIGHT_R - MARGIN_BOTTOM} className="pl-hilltop-guide" />
                <text x={zeroX} y={MARGIN_TOP - 6} textAnchor="middle" className="pl-hilltop-label">
                  progenitor / saddle
                </text>
              </g>
            )}

            {split ? (
              <>
                <text x={(MARGIN_X + zeroX) / 2} y={HEIGHT_R - MARGIN_BOTTOM + 18} textAnchor="middle" className="pl-well-label">
                  erythroid
                </text>
                <text x={(zeroX + WIDTH_R - MARGIN_X) / 2} y={HEIGHT_R - MARGIN_BOTTOM + 18} textAnchor="middle" className="pl-well-label">
                  myeloid
                </text>
              </>
            ) : (
              <text x={(MARGIN_X + WIDTH_R - MARGIN_X) / 2} y={HEIGHT_R - MARGIN_BOTTOM + 18} textAnchor="middle" className="pl-well-label">
                multipotent (single valley)
              </text>
            )}

            <g className="pl-ball-wrap" style={reducedMotion ? undefined : { transition: "transform 480ms cubic-bezier(0.32, 0.9, 0.4, 1.1)" }} transform={`translate(${ballPx} ${ballPy})`}>
              <circle r={7} className="pl-ball" style={{ fill: colorForRole(ballRole) }} />
            </g>

            <text x={WIDTH_R / 2} y={HEIGHT_R - 6} textAnchor="middle" className="pl-axis-label">
              Δ = PU.1 − GATA1 →
            </text>
            <text x={10} y={MARGIN_TOP + 8} className="pl-axis-label">
              U(Δ)
            </text>
          </svg>
        </div>
      </div>

      <div className="pl-controls">
        <label className="pl-slider">
          <span>developmental signal = {S.toFixed(3)}</span>
          <input
            type="range"
            min={S_MIN}
            max={S_MAX}
            step={0.004}
            value={S}
            onChange={(e) => setS(Number(e.target.value))}
          />
        </label>
        <div className="pl-regime">
          {split ? "double well, the progenitor is now a hilltop" : `single well, S_c ≈ ${S_C2.toFixed(3)}`}
        </div>
      </div>

      <figcaption>
        The developmental signal lowers the threshold at which each gene switches itself on; drop it past a point
        and the single attractor splits in two. High signal (above S≈{S_C2.toFixed(2)}): one attractor at the
        center, the multipotent progenitor, seen here as one valley (right) and one point the field converges on
        (left). Lower the signal and both panels split at once. The valley becomes two wells around a hilltop, and the
        flow field reorganizes into two new attractors, myeloid and erythroid, with a saddle where the progenitor
        used to be.
      </figcaption>
    </figure>
  );
}
