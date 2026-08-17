// Shared numerical core for the PU.1/GATA1 toggle-switch figures.
// Source of truth: scripts/data/toggle-switch-spec.md. Keep this file
// dependency-free vanilla JS — it runs inside React islands but has no
// React import itself.
//
//   dx/dt = ax * x^n/(S^n+x^n) + b * S^n/(S^n+y^n) - k*x
//   dy/dt = ay * y^n/(S^n+y^n) + b * S^n/(S^n+x^n) - k*y
//
// x = PU.1 (myeloid), y = GATA1 (erythroid). Symmetric model has ax=ay=a.

export const AXIS_MAX = 3;

/**
 * Rounds a pixel coordinate to 2dp. Newton's method can settle to
 * slightly different floats across V8 builds (Node's SSR vs. a browser's),
 * which otherwise shows up as an SVG-attribute hydration mismatch even
 * though the discrepancy is many orders of magnitude below a pixel.
 */
export function round2(n) {
  return Math.round(n * 100) / 100;
}

// Critical values from the spec (§4, §5a) — exposed so figures can label
// thresholds without re-deriving them.
export const S_C1 = 0.643594; // tristable <-> bistable-committed
export const S_C2 = 1.553774; // bistable-committed <-> monostable
export const DELTA_C = 0.72963161; // arrest: saddle-node fold in delta
export const FOLD_POINT = [0.45887834, 1.12369973];

export const ROLE_COLOR_VAR = {
  progenitor: "var(--domain-gold)",
  myeloid: "var(--domain-oxide)",
  erythroid: "var(--domain-blue)",
};

export function colorForRole(role) {
  return ROLE_COLOR_VAR[role] ?? "var(--ms-muted)";
}

/** Fill in ax/ay from a shared `a` when the caller doesn't need bias. */
export function normalizeParams({ a, ax, ay, b = 1, S, n = 4, k = 1 } = {}) {
  return { ax: ax ?? a ?? 1, ay: ay ?? a ?? 1, b, S, n, k };
}

// Named regimes from spec §2/§3, ready to hand to the figures.
export const REGIMES = {
  tristableDefault: normalizeParams({ a: 1, b: 1, S: 0.5, n: 4, k: 1 }),
  monostable: normalizeParams({ a: 1, b: 1, S: 2.5, n: 4, k: 1 }),
  bistableCommitted: normalizeParams({ a: 1, b: 1, S: 1.0, n: 4, k: 1 }),
};

export function arrestParams(delta) {
  return normalizeParams({ ax: 1 + delta, ay: 1 - delta, b: 1, S: 1.0, n: 4, k: 1 });
}

// --- vector field & Jacobian -------------------------------------------

export function field(params, x, y) {
  const { ax, ay, b, S, n, k } = params;
  const Sn = S ** n;
  const xn = x ** n;
  const yn = y ** n;
  const vx = (ax * xn) / (Sn + xn) + (b * Sn) / (Sn + yn) - k * x;
  const vy = (ay * yn) / (Sn + yn) + (b * Sn) / (Sn + xn) - k * y;
  return [vx, vy];
}

function hillDeriv(u, Sn, n) {
  // d/du [ u^n / (S^n+u^n) ] = n*S^n*u^(n-1) / (S^n+u^n)^2
  return (n * Sn * u ** (n - 1)) / (Sn + u ** n) ** 2;
}

export function jacobian(params, x, y) {
  const { ax, ay, b, S, n, k } = params;
  const Sn = S ** n;
  const hx = hillDeriv(x, Sn, n);
  const hy = hillDeriv(y, Sn, n);
  const J11 = ax * hx - k;
  const J12 = -b * hy;
  const J21 = -b * hx;
  const J22 = ay * hy - k;
  return [
    [J11, J12],
    [J21, J22],
  ];
}

export function eigenvalues2x2(J) {
  const [[a, b], [c, d]] = J;
  const tr = a + d;
  const det = a * d - b * c;
  const disc = tr * tr - 4 * det;
  if (disc >= 0) {
    const sq = Math.sqrt(disc);
    return { l1: (tr + sq) / 2, l2: (tr - sq) / 2, complex: false };
  }
  const sq = Math.sqrt(-disc);
  return { l1: tr / 2, l2: tr / 2, im: sq / 2, complex: true };
}

const EIG_EPS = 1e-6;

export function classify(J) {
  const { l1, l2, complex, im } = eigenvalues2x2(J);
  if (complex) {
    if (l1 > EIG_EPS) return "unstable-spiral";
    if (l1 < -EIG_EPS) return "stable-spiral";
    return im > 0 ? "marginal-spiral" : "marginal";
  }
  if (l1 > EIG_EPS && l2 > EIG_EPS) return "unstable";
  if (l1 < -EIG_EPS && l2 < -EIG_EPS) return "stable";
  if ((l1 > EIG_EPS && l2 < -EIG_EPS) || (l2 > EIG_EPS && l1 < -EIG_EPS)) return "saddle";
  return "marginal";
}

/** Diagonal = progenitor/undecided; off-diagonal = one of the two fates. */
export function roleFor(x, y, type) {
  const onDiagonal = Math.abs(x - y) < 0.05;
  const stable = type === "stable";
  if (onDiagonal) return stable ? "progenitor" : "undecided";
  if (x > y) return stable ? "myeloid" : "progenitor-myeloid barrier";
  return stable ? "erythroid" : "progenitor-erythroid barrier";
}

// --- integration ---------------------------------------------------------

export function rk4Step(params, x, y, dt) {
  const [k1x, k1y] = field(params, x, y);
  const [k2x, k2y] = field(params, x + (dt / 2) * k1x, y + (dt / 2) * k1y);
  const [k3x, k3y] = field(params, x + (dt / 2) * k2x, y + (dt / 2) * k2y);
  const [k4x, k4y] = field(params, x + dt * k3x, y + dt * k3y);
  const nx = x + (dt / 6) * (k1x + 2 * k2x + 2 * k3x + k4x);
  const ny = y + (dt / 6) * (k1y + 2 * k2y + 2 * k3y + k4y);
  return [nx, ny];
}

const DEFAULT_CLAMP = [-0.05, AXIS_MAX + 0.5];

function clampPair(x, y, clamp) {
  if (!clamp) return [x, y];
  const [lo, hi] = clamp;
  return [Math.max(lo, Math.min(hi, x)), Math.max(lo, Math.min(hi, y))];
}

/** Full trajectory (for click-to-drop animation). Returns [[x,y], ...]. */
export function integrate(params, x0, y0, { dt = 0.03, T = 20, clamp = DEFAULT_CLAMP } = {}) {
  const steps = Math.round(T / dt);
  let x = x0;
  let y = y0;
  const points = [[x, y]];
  for (let i = 0; i < steps; i += 1) {
    [x, y] = rk4Step(params, x, y, dt);
    [x, y] = clampPair(x, y, clamp);
    points.push([x, y]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) break;
  }
  return points;
}

/** Final state only — cheap enough to call per grid cell in basinGrid. */
export function integrateFinal(params, x0, y0, { dt = 0.05, T = 40, clamp = DEFAULT_CLAMP } = {}) {
  const steps = Math.round(T / dt);
  let x = x0;
  let y = y0;
  for (let i = 0; i < steps; i += 1) {
    [x, y] = rk4Step(params, x, y, dt);
    [x, y] = clampPair(x, y, clamp);
  }
  return [x, y];
}

// --- toy attractor/repeller field ------------------------------------------
//
// The simplest possible bistable picture, with no biology attached: a
// decoupled pitchfork in x paired with plain decay in y. Two attractors at
// (±1,0), one repeller (a saddle, since it still pulls inward along y) at
// the origin. Used by ToyField.jsx to introduce attractor/repeller/basin
// vocabulary before the toggle switch's own field shows up.

export function toyField(x, y) {
  return [x - x ** 3, -y];
}

export function toyRk4Step(x, y, dt) {
  const [k1x, k1y] = toyField(x, y);
  const [k2x, k2y] = toyField(x + (dt / 2) * k1x, y + (dt / 2) * k1y);
  const [k3x, k3y] = toyField(x + (dt / 2) * k2x, y + (dt / 2) * k2y);
  const [k4x, k4y] = toyField(x + dt * k3x, y + dt * k3y);
  const nx = x + (dt / 6) * (k1x + 2 * k2x + 2 * k3x + k4x);
  const ny = y + (dt / 6) * (k1y + 2 * k2y + 2 * k3y + k4y);
  return [nx, ny];
}

/** Full trajectory for the toy field (for click-to-drop animation). */
export function toyIntegrate(x0, y0, { dt = 0.03, T = 8, clampX = [-1.6, 1.6], clampY = [-1.2, 1.2] } = {}) {
  const steps = Math.round(T / dt);
  let x = x0;
  let y = y0;
  const points = [[x, y]];
  for (let i = 0; i < steps; i += 1) {
    [x, y] = toyRk4Step(x, y, dt);
    x = Math.max(clampX[0], Math.min(clampX[1], x));
    y = Math.max(clampY[0], Math.min(clampY[1], y));
    points.push([x, y]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) break;
  }
  return points;
}

/**
 * Time for a trajectory starting at (x0,y0) to leave a ball of radius R
 * around `center` — used to measure the saddle-node ghost's dwell time
 * (spec §5a). Mirrors the study script's protocol: seed near the vanished
 * fixed-point pair and time the escape.
 */
export function dwellTime(params, x0, y0, { center, R = 0.25, dt = 0.05, maxT = 400 } = {}) {
  let x = x0;
  let y = y0;
  const steps = Math.round(maxT / dt);
  for (let i = 0; i < steps; i += 1) {
    const d = Math.hypot(x - center[0], y - center[1]);
    if (d > R) return i * dt;
    [x, y] = rk4Step(params, x, y, dt);
  }
  return maxT;
}

/**
 * Trims a trajectory shortly after it first enters a small ball around
 * `pos` (plus a short tail so the reveal animation visibly settles).
 * Distinct from a raw velocity cutoff: near a saddle-node ghost the
 * velocity is also tiny for a long stretch without the point having
 * actually arrived, so this checks *position*, not speed.
 */
export function trimAtPosition(points, pos, { R = 0.02, tailSteps = 15 } = {}) {
  if (!pos) return points;
  for (let i = 0; i < points.length; i += 1) {
    const [x, y] = points[i];
    if (Math.hypot(x - pos[0], y - pos[1]) < R) {
      return points.slice(0, Math.min(points.length, i + tailSteps + 1));
    }
  }
  return points;
}

// --- 1-D effective potential (Waddington landscape reduction) -------------
//
// Near the decision, x+y stays close to 2 (see spec §3b: both committed
// states and the central saddle in the bistable-committed regime sum to
// ~2). Projecting onto Δ = x−y on that slow manifold turns the 2-D flow
// into a 1-D one, g(Δ;S) = d/dt(x−y), which is (minus) the gradient of an
// effective potential U(Δ;S) — Waddington's landscape made literal.

/** Reduced 1-D velocity g(Δ) = ẋ−ẏ on the slow manifold x+y=2. */
export function reducedVelocity(params, delta) {
  const x = (2 + delta) / 2;
  const y = (2 - delta) / 2;
  const [vx, vy] = field(params, x, y);
  return vx - vy;
}

/**
 * U(Δ) = −∫₀^Δ g(Δ′) dΔ′, via cumulative trapezoid over `nSamples` steps
 * across [−deltaMax, deltaMax]. Returns { deltas, U }, both length
 * nSamples+1, with U anchored so U(0)=0.
 */
export function potentialCurve(params, { nSamples = 400, deltaMax = 2 } = {}) {
  const deltas = [];
  const g = [];
  for (let i = 0; i <= nSamples; i += 1) {
    const d = -deltaMax + (2 * deltaMax * i) / nSamples;
    deltas.push(d);
    g.push(reducedVelocity(params, d));
  }
  const integral = [0];
  for (let i = 1; i < deltas.length; i += 1) {
    const dd = deltas[i] - deltas[i - 1];
    integral.push(integral[i - 1] + 0.5 * (g[i] + g[i - 1]) * dd);
  }
  const zeroIdx = deltas.findIndex((d) => d >= 0);
  const baseline = integral[zeroIdx];
  const U = integral.map((v) => baseline - v);
  return { deltas, U };
}

/** Counts local minima/maxima in a sampled curve (interior points only). */
export function countExtrema(values) {
  let minima = 0;
  let maxima = 0;
  const minIdx = [];
  const maxIdx = [];
  for (let i = 1; i < values.length - 1; i += 1) {
    if (values[i] < values[i - 1] && values[i] < values[i + 1]) {
      minima += 1;
      minIdx.push(i);
    }
    if (values[i] > values[i - 1] && values[i] > values[i + 1]) {
      maxima += 1;
      maxIdx.push(i);
    }
  }
  return { minima, maxima, minIdx, maxIdx };
}

// --- fixed points ----------------------------------------------------------

function newtonSolve(params, x0, y0, { iters = 80, tol = 1e-10 } = {}) {
  let x = x0;
  let y = y0;
  for (let i = 0; i < iters; i += 1) {
    const [f1, f2] = field(params, x, y);
    if (Math.abs(f1) + Math.abs(f2) < tol) return { x, y, converged: true };
    const [[J11, J12], [J21, J22]] = jacobian(params, x, y);
    const det = J11 * J22 - J12 * J21;
    if (Math.abs(det) < 1e-12) return { x, y, converged: false };
    const dx = (J22 * f1 - J12 * f2) / det;
    const dy = (J11 * f2 - J21 * f1) / det;
    x -= dx;
    y -= dy;
    if (!Number.isFinite(x) || !Number.isFinite(y) || Math.abs(x) > 50 || Math.abs(y) > 50) {
      return { x, y, converged: false };
    }
  }
  const [f1, f2] = field(params, x, y);
  return { x, y, converged: Math.abs(f1) + Math.abs(f2) < 1e-6 };
}

/**
 * Newton from a grid of seeds, deduped, classified by Jacobian eigenvalues.
 * Returns [{x, y, type, role, eig: [l1, l2]}], sorted for determinism.
 */
export function fixedPoints(params, { gridN = 13, extent = AXIS_MAX } = {}) {
  const found = [];
  for (let i = 0; i < gridN; i += 1) {
    for (let j = 0; j < gridN; j += 1) {
      const sx = ((i + 0.5) / gridN) * extent;
      const sy = ((j + 0.5) / gridN) * extent;
      const res = newtonSolve(params, sx, sy);
      if (!res.converged) continue;
      const { x, y } = res;
      if (x < -0.01 || y < -0.01 || x > extent + 1 || y > extent + 1) continue;
      if (found.some((p) => Math.hypot(p.x - x, p.y - y) < 1e-3)) continue;
      const J = jacobian(params, x, y);
      const eig = eigenvalues2x2(J);
      const type = classify(J);
      const role = roleFor(x, y, type);
      found.push({ x, y, type, role, eig: [eig.l1, eig.l2] });
    }
  }
  found.sort((p, q) => p.x - q.x || p.y - q.y);
  return found;
}

/** Role of the stable fixed point nearest (fx,fy), or null if none is close. */
export function nearestStableRole(fixedPts, fx, fy, tol = 0.05) {
  let best = null;
  let bestD = Infinity;
  fixedPts
    .filter((p) => p.type === "stable")
    .forEach((a) => {
      const d = (a.x - fx) ** 2 + (a.y - fy) ** 2;
      if (d < bestD) {
        bestD = d;
        best = a;
      }
    });
  return bestD < tol ? best.role : null;
}

// --- basins of attraction & separatrix -------------------------------------

/**
 * Integrates a grid of initial conditions and tags each by nearest
 * attractor. Returns { N, extent, ids, attractors } where ids[i*N+j] is the
 * attractor index (or -1 if unclassified) for cell center
 * ((i+0.5)/N*extent, (j+0.5)/N*extent).
 */
export function basinGrid(params, { N = 46, extent = AXIS_MAX, T = 40, dt = 0.05 } = {}) {
  const fps = fixedPoints(params);
  const attractors = fps.filter((p) => p.type === "stable");
  const ids = new Int16Array(N * N).fill(-1);
  for (let i = 0; i < N; i += 1) {
    for (let j = 0; j < N; j += 1) {
      const x = ((i + 0.5) / N) * extent;
      const y = ((j + 0.5) / N) * extent;
      const [fx, fy] = integrateFinal(params, x, y, { dt, T });
      let best = -1;
      let bestD = Infinity;
      attractors.forEach((a, idx) => {
        const d = (a.x - fx) ** 2 + (a.y - fy) ** 2;
        if (d < bestD) {
          bestD = d;
          best = idx;
        }
      });
      ids[i * N + j] = bestD < 0.05 ? best : -1;
    }
  }
  return { N, extent, ids, attractors };
}

/**
 * Basin-boundary tracer: categorical marching squares over the basin grid.
 * Wherever two adjacent grid points disagree on attractor id, drop an edge
 * midpoint; pair up midpoints per cell into short segments. Good enough to
 * render as a "fine line" separatrix at typical figure resolution — see
 * spec §6/§7 (no need to trace the stable manifold analytically).
 */
export function traceSeparatrix(basin) {
  const { N, extent, ids } = basin;
  const X = (i) => ((i + 0.5) / N) * extent;
  const segments = [];
  for (let i = 0; i < N - 1; i += 1) {
    for (let j = 0; j < N - 1; j += 1) {
      const c00 = ids[i * N + j];
      const c10 = ids[(i + 1) * N + j];
      const c11 = ids[(i + 1) * N + (j + 1)];
      const c01 = ids[i * N + (j + 1)];
      const x0 = X(i);
      const x1 = X(i + 1);
      const y0 = X(j);
      const y1 = X(j + 1);
      const mids = [];
      if (c00 !== c10) mids.push([(x0 + x1) / 2, y0]); // bottom
      if (c10 !== c11) mids.push([x1, (y0 + y1) / 2]); // right
      if (c11 !== c01) mids.push([(x0 + x1) / 2, y1]); // top
      if (c01 !== c00) mids.push([x0, (y0 + y1) / 2]); // left
      if (mids.length === 2) segments.push([mids[0], mids[1]]);
      else if (mids.length === 4) {
        segments.push([mids[0], mids[1]]);
        segments.push([mids[2], mids[3]]);
      }
    }
  }
  return segments;
}

// --- dev self-check against spec's reference JSON (§8) ---------------------

const REFERENCE_TRISTABLE = [
  { point: [1.0, 1.0], type: "stable" },
  { point: [1.996078, 0.003922], type: "stable" },
  { point: [0.003922, 1.996078], type: "stable" },
  { point: [1.511575, 0.488425], type: "saddle" },
  { point: [0.488425, 1.511575], type: "saddle" },
];

function assertDefaultRegime() {
  const fps = fixedPoints(REGIMES.tristableDefault);
  if (fps.length !== 5) {
    console.warn(`[toggleModel] expected 5 fixed points for tristable-default, got ${fps.length}`);
    return;
  }
  for (const ref of REFERENCE_TRISTABLE) {
    const match = fps.find((p) => Math.hypot(p.x - ref.point[0], p.y - ref.point[1]) < 1e-3);
    if (!match) {
      console.warn("[toggleModel] missing reference fixed point", ref.point);
    } else if (match.type !== ref.type) {
      console.warn("[toggleModel] type mismatch at", ref.point, "got", match.type, "expected", ref.type);
    }
  }
}

function assertPotentialWells() {
  const single = potentialCurve(normalizeParams({ a: 1, b: 1, S: 2.2, n: 4, k: 1 }));
  const { minima: m1 } = countExtrema(single.U);
  if (m1 !== 1) {
    console.warn(`[toggleModel] expected single well at S=2.2, got ${m1} minima`);
  }
  const double = potentialCurve(normalizeParams({ a: 1, b: 1, S: 1.0, n: 4, k: 1 }));
  const { minima: m2, maxima: x2 } = countExtrema(double.U);
  if (m2 !== 2 || x2 < 1) {
    console.warn(`[toggleModel] expected double well + central hilltop at S=1.0, got ${m2} minima / ${x2} maxima`);
  }
}

if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.DEV) {
  try {
    assertDefaultRegime();
    assertPotentialWells();
  } catch (e) {
    console.warn("[toggleModel] dev assertion threw", e);
  }
}
