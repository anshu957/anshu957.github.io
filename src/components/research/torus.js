// Hamiltonian chaos on the 2-torus. Chirikov's standard map
//   I' = I + K sin θ,  θ' = θ + I'   (both mod 2π)
// has the torus as its phase space, so its orbits are drawn on an embedded one:
// I runs around the ring, θ around the tube. K = 0.971635 is the critical value, where the last
// spanning KAM curve breaks. Regular orbits (islands, surviving tori) are coloured by their starting
// action I₀ along the domain palette; orbits with a positive Lyapunov exponent (the chaotic sea) are ink. Drawn once on the client, re-coloured on theme change.

const TAU = 2 * Math.PI;
const K = 0.971635;
const W = 320, H = 220; // logical size, matches the SVG plates
const R = 1, r = 0.5, TILT = 0.85, S = 95;
const ca = Math.cos(TILT), sa = Math.sin(TILT);
// Site domain tokens (they have light and dark values), from low to high action.
const PALETTE = ["plum", "blue", "teal", "sage", "gold", "oxide"];

// Orbit points in unit coordinates: x, y on screen (before scaling), z toward the viewer.
let orbits = null;
function solve() {
  const seeds = [];
  for (let i = 0; i < 48; i++) seeds.push([Math.PI, 0.02 + ((TAU - 0.04) * i) / 47]);
  for (let i = 0; i < 24; i++) seeds.push([0, 0.02 + ((TAU - 0.04) * i) / 23]);
  return seeds.map(([th, p], k) => {
    let dth = 1, dp = 0, lyap = 0;
    for (let i = 0; i < 600; i++) {
      const c = K * Math.cos(th);
      p = (p + K * Math.sin(th) + TAU) % TAU;
      th = (th + p) % TAU;
      const nth = (1 + c) * dth + dp, np = c * dth + dp;
      const n = Math.hypot(nth, np);
      lyap += Math.log(n);
      dth = nth / n; dp = np / n;
    }
    const chaotic = lyap / 600 > 0.02;
    const n = chaotic ? 12000 : 2500;
    const pts = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      p = (p + K * Math.sin(th) + TAU) % TAU;
      th = (th + p) % TAU;
      const q = embed(p, th - Math.PI / 2);
      pts[3 * i] = q[0]; pts[3 * i + 1] = q[1]; pts[3 * i + 2] = q[2];
    }
    return { pts, chaotic, hue: seeds[k][1] / TAU };
  });
}

// u around the ring, v around the tube, then tilted about the screen x axis.
function embed(u, v) {
  const rr = R + r * Math.cos(v);
  const x = rr * Math.cos(u), y = rr * Math.sin(u), z = r * Math.sin(v);
  return [x, y * ca - z * sa, y * sa + z * ca];
}

// Any CSS colour string to [r, g, b], by painting it.
const probe = typeof document !== "undefined" && document.createElement("canvas").getContext("2d", { willReadFrequently: true });
function rgb(css, fallback) {
  probe.clearRect(0, 0, 1, 1);
  probe.fillStyle = fallback;
  probe.fillStyle = css;
  probe.fillRect(0, 0, 1, 1);
  return probe.getImageData(0, 0, 1, 1).data.slice(0, 3);
}

function draw(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.round(canvas.clientWidth * dpr);
  const h = Math.round((w * H) / W);
  if (!w) return;
  const k = (S * w) / W;
  const cx = w / 2, cy = h / 2;

  // Depth buffer and Lambert shade of the surface, from dense sampling.
  const zb = new Float32Array(w * h).fill(-9);
  const shade = new Float32Array(w * h);
  const L = [-0.4, -0.5, 0.77];
  const nu = Math.ceil(w * 2.6), nv = Math.ceil(w * 1.3);
  for (let i = 0; i < nu; i++) {
    const u = (TAU * i) / nu, cu = Math.cos(u), su = Math.sin(u);
    for (let j = 0; j < nv; j++) {
      const v = (TAU * j) / nv, cv = Math.cos(v), sv = Math.sin(v);
      const rr = R + r * cv, y = rr * su, z = r * sv;
      const Z = y * sa + z * ca;
      const X = Math.floor(cx + k * rr * cu), Y = Math.floor(cy + k * (y * ca - z * sa));
      if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
      const idx = Y * w + X;
      if (Z > zb[idx]) {
        zb[idx] = Z;
        const ny = cv * su, nz = sv;
        shade[idx] = Math.max(0, L[0] * cv * cu + L[1] * (ny * ca - nz * sa) + L[2] * (ny * sa + nz * ca));
      }
    }
  }

  // Visible orbit points, counted per pixel: the chaotic sea, and regular orbits with their palette position.
  const sea = new Uint16Array(w * h), isle = new Uint16Array(w * h), hue = new Float32Array(w * h);
  for (const o of orbits) {
    const pts = o.pts;
    for (let i = 0; i < pts.length; i += 3) {
      const X = Math.floor(cx + k * pts[i]), Y = Math.floor(cy + k * pts[i + 1]);
      if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
      const idx = Y * w + X;
      if (pts[i + 2] < zb[idx] - 0.02) continue;
      if (o.chaotic) sea[idx]++;
      else { isle[idx]++; hue[idx] = o.hue; }
    }
  }
  canvas.width = w; canvas.height = h;
  canvas._buf = { w, h, zb, shade, sea, isle, hue, dpr };
  paint(canvas);
}

function paint(canvas) {
  const b = canvas._buf;
  if (!b) return;
  const cs = getComputedStyle(canvas);
  const ink = rgb(cs.getPropertyValue("--ms-on-surface"), "#111111");
  const sheet = rgb(cs.getPropertyValue("--ms-sheet"), "#fffff8");
  const pal = PALETTE.map((n) => rgb(cs.getPropertyValue(`--domain-${n}`), "#6b7fb0"));
  const col = (t) => {
    const x = t * (pal.length - 1), i = Math.min(pal.length - 2, Math.floor(x)), f = x - i;
    return [0, 1, 2].map((c) => pal[i][c] + (pal[i + 1][c] - pal[i][c]) * f);
  };
  const ctx = canvas.getContext("2d");
  const img = ctx.createImageData(b.w, b.h);
  const d = img.data;
  const over = (idx, col, a) => {
    d[idx] += (col[0] - d[idx]) * a; d[idx + 1] += (col[1] - d[idx + 1]) * a; d[idx + 2] += (col[2] - d[idx + 2]) * a;
  };
  const pt = 0.55 / b.dpr; // per-point ink, so density reads the same at any resolution
  for (let i = 0; i < b.w * b.h; i++) {
    if (b.zb[i] <= -9) continue;
    const o = 4 * i;
    d[o] = sheet[0]; d[o + 1] = sheet[1]; d[o + 2] = sheet[2]; d[o + 3] = 255;
    over(o, ink, 0.03 + 0.13 * (1 - b.shade[i]));
    if (b.sea[i]) over(o, ink, 0.8 * (1 - Math.pow(1 - 0.6 * pt, b.sea[i])));
    if (b.isle[i]) over(o, col(b.hue[i]), Math.min(1, 0.85 + pt * b.isle[i]));
  }
  ctx.putImageData(img, 0, 0);
}

// One theme watcher for whichever torus canvases are on the current page.
let themeWatch = null;

export function drawTori(canvas) {
  if (canvas._started) return;
  canvas._started = true;
  themeWatch ??= new MutationObserver(() => document.querySelectorAll("canvas[data-torus]").forEach(paint));
  themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  const start = () => {
    orbits ??= solve();
    draw(canvas);
    new ResizeObserver(() => {
      if (Math.round(canvas.clientWidth * Math.min(window.devicePixelRatio || 1, 2)) !== canvas._buf?.w) draw(canvas);
    }).observe(canvas);
  };
  // Solve only when the plate comes near the viewport.
  const io = new IntersectionObserver((es) => {
    if (es.some((e) => e.isIntersecting)) { io.disconnect(); start(); }
  }, { rootMargin: "400px" });
  io.observe(canvas);
}
